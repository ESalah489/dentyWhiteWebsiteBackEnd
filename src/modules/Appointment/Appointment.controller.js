import Appointment from '../../../DB/models/booking.model.js'
import User from '../../../DB/models/user.model.js'
import Doctor from '../../../DB/models/doctor.model.js'
import Service from '../../../DB/models/service.model.js'
import { sendEmail } from '../../utils/email.js';
import { templates } from '../../utils/messageTemplates.js';
import { sendWhatsAppMessage } from '../../utils/whatsapp.js';
import { generateRandomPassword } from "../../utils/password.js"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from 'stripe';


/* ---------------------------- Create an appointment (client or admin) ---------------------------- */

export const createAppointment = async (req, res) => {
    try {
        const {
            doctor,
            service,
            date,
            startTime,
            endTime,
            paymentMethod,
            notes,
        } = req.body;

        if (!doctor || !service) {
            return res.status(400).json({ message: "Doctor and service are required" });
        }

        if (!date || !startTime || !endTime) {
            return res.status(400).json({ message: "Date, start time and end time are required" });
        }

        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        const appointmentDate = new Date(date);

        if (isNaN(start) || isNaN(end) || isNaN(appointmentDate)) {
            return res.status(400).json({ message: "Invalid date or time format" });
        }

        if (start < now || end < now) {
            return res.status(400).json({ message: "Appointment time must be in the future" });
        }

        if (start >= end) {
            return res.status(400).json({ message: "Start time must be before end time" });
        }

        const doctorInfo = await Doctor.findById(doctor);
        if (!doctorInfo) return res.status(404).json({ message: "Doctor not found" });

        const serviceInfo = await Service.findById(service);
        if (!serviceInfo) return res.status(404).json({ message: "Service not found" });

        const amount = serviceInfo.price;

        const appointmentDay = new Date(date).toLocaleString('en-US', { weekday: 'long' });
        const doctorDaySlots = doctorInfo.availableTimes.find(slot => slot.day === appointmentDay);

        if (!doctorDaySlots) {
            return res.status(400).json({ message: `Doctor is not available on ${appointmentDay}` });
        }

        const isSlotAvailable = doctorDaySlots.slots.some(slot => {
            const from = new Date(`${date}T${slot.from}`);
            const to = new Date(`${date}T${slot.to}`);
            return new Date(startTime) >= from && new Date(endTime) <= to;
        });

        if (!isSlotAvailable) {
            return res.status(400).json({ message: "Selected time is not within doctor's working hours" });
        }

        let patientInfo;
        let userId;

        const isAdmin = req.user.role === 'admin';

        if (isAdmin) {
            if (!req.body.patientInfo) {
                return res.status(400).json({ message: "Patient info is required..." });
            }

            patientInfo = req.body.patientInfo;

            // تحقق هل المستخدم له موعد بالفعل في نفس اليوم — فقط إضافة هذا الجزء هنا
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // البحث باستخدام _id للمستخدم الجديد أو الموجود
            let existingUser = await User.findOne({ email: patientInfo.email });
            if (!existingUser) {
                // إنشاء مستخدم جديد (هذا جزء من كودك الأصلي)
                const randomPassword = generateRandomPassword();
                const hashedPassword = await bcrypt.hash(randomPassword, 10);

                existingUser = await User.create({
                    firstName: patientInfo.firstName,
                    lastName: patientInfo.lastName,
                    email: patientInfo.email,
                    phone: patientInfo.phone,
                    age: patientInfo.age,
                    password: hashedPassword,
                    role: "client",
                });

                const tpl = templates.patientRegisteredByAdmin({
                    firstName: patientInfo.firstName,
                    email: patientInfo.email,
                    password: randomPassword,
                });

                await sendEmail({
                    to: patientInfo.email,
                    subject: tpl.subject,
                    html: tpl.emailHtml,
                });

                if (patientInfo?.phone) {
                    const result = await sendWhatsAppMessage({
                        to: patientInfo.phone,
                        message: tpl.whatsappText,
                    });

                    if (!result.success && result.reason === "not_joined") {
                        console.log("⚠️ WhatsApp not delivered. User needs to join sandbox.");
                    }
                }

                const token = jwt.sign(
                    { userId: existingUser._id, role: existingUser.role },
                    process.env.JWT_SECRET,
                    { expiresIn: "30d" }
                );

                console.log(`✅ New user created - token: ${token}`);
            }

            // هنا بعد التأكد أن المستخدم موجود، نتحقق هل لديه موعد بالفعل في نفس اليوم:
            const existingAppointmentForUser = await Appointment.findOne({
                user: existingUser._id,
                date: { $gte: startOfDay, $lte: endOfDay },
                status: { $nin: ["cancelled", "no-show", "expired"] }
            });

            if (existingAppointmentForUser) {
                return res.status(409).json({
                    message: "⛔ This user already has an appointment on this day.",
                });
            }

            req.user = existingUser;
            userId = existingUser._id;

            patientInfo = {
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                email: existingUser.email,
                phone: existingUser.phone,
                age: existingUser.age,
            };
        } else {
            const user = await User.findById(req.user._id).select("firstName lastName email phone age");
            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }

            patientInfo = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                age: user.age,
            };
            userId = req.user._id;
        }

        const appointmentStatus = isAdmin ? 'confirmed' : 'pending';

        if (!isAdmin) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const alreadyBookedSameDoctor = await Appointment.findOne({
                user: req.user._id,
                doctor,
                date: { $gte: startOfDay, $lte: endOfDay },
                status: { $nin: ["cancelled", "no-show", "expired"] }
            });

            if (alreadyBookedSameDoctor) {
                return res.status(409).json({
                    message: "⛔ You've already booked with this doctor on this day.",
                });
            }
        }

        const exists = await Appointment.findOne({
            doctor,
            startTime: new Date(startTime),
            status: { $nin: ["cancelled", "expired"] }
        });
        if (exists) {
            return res.status(409).json({ message: 'This time slot is already booked.' });
        }

        const appointment = new Appointment({
            user: userId,
            bookedBy: req.user._id,
            doctor,
            service,
            date,
            startTime,
            endTime,
            amount,
            patientInfo,
            paymentMethod,
            notes,
            status: appointmentStatus,
            history: [{ action: 'created', by: req.user._id }],
        });

        await appointment.save();

        if (patientInfo?.email) {
            const formattedDate = new Date(appointment.date).toLocaleDateString('en-GB');
            const formattedStart = new Date(appointment.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const formattedEnd = new Date(appointment.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            const tpl = templates.appointmentCreated({
                firstName: patientInfo.firstName,
                appointmentDate: formattedDate,
                startTime: formattedStart,
                endTime: formattedEnd
            });

            await sendEmail({ to: patientInfo.email, subject: tpl.subject, html: tpl.emailHtml });

            if (patientInfo?.phone) {
                const result = await sendWhatsAppMessage({ to: patientInfo.phone, message: tpl.whatsappText });

                if (!result.success && result.reason === 'not_joined') {
                    console.log("⚠️ WhatsApp not delivered. User needs to join sandbox.");
                    appointment.whatsappReminder = result.message;
                }
            }
        }

        res.status(201).json({
            message: "appointment created",
            appointment,
            whatsappReminder: appointment.whatsappReminder || null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* ---------------------------- Get Appointment Status (booked, empty, pending) ---------------------------- */

// export const getSlotsStatus = async (req, res) => {
//     try{
//         const {date} = req.query;

//         if (!date) {
//             return res.status(400).json({ message: 'Date is required'});
//         }

//         const startOfDay = new Date(date);
//         startOfDay.setHours(0,0,0,0);

//         const endOfDay = new Date(date);
//         endOfDay.setHours(23,59,59,999);

//         const appointments = await Appointment.find({
//             date: { $gte: startOfDay, $lte: endOfDay }
//         }).select('startTime endTime status');

//         res.status(200).json({ appointments });
//     } catch (error) {
//         res.status(500).json({ message: error.message});
//     }
// }

export const getSlotsStatus = async (req, res) => {
  try {
    const { doctorId, serviceId, date } = req.query;

    if (!doctorId || !serviceId || !date) {
      return res.status(400).json({ message: "Missing doctorId, serviceId, or date" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const selectedDay = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    }); 

    const availableDay = doctor.availableTimes.find((d) => d.day === selectedDay);
    if (!availableDay) return res.status(200).json({ slots: [] }); 

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      service: serviceId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ["cancelled", "expired", "no-show"] },
    }).select("startTime endTime status");

    const slots = availableDay.slots.map((slot) => {
      const start = new Date(`${date}T${slot.from}:00`);
      const end = new Date(`${date}T${slot.to}:00`);

      const matched = bookedAppointments.find(
        (appt) =>
            (start < new Date(appt.endTime)) && (end > new Date(appt.startTime))
        );

      return {
        startTime: start,
        endTime: end,
        status: matched ? matched.status : "available",
      };
    });

    res.status(200).json({ slots });
  } catch (error) {
    console.error("getSlotsStatus error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------- To Make Just One Appoinment For Day ---------------------------- */

export const getMyAppointments = async (req, res) => {
  try {
    const userId = req.user._id;

    const appointments = await Appointment.find({ user: userId }).select("date startTime endTime");
    res.status(200).json({ appointments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching your appointments" });
  }
};

/* ---------------------------- confirm Appointment By Admin ---------------------------- */

export const confirmAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment Not Found!' });
        }

        if (appointment.status !== 'pending') {
            return res.status(400).json({ message: `Appointment is already ${appointment.status}!` });
        }

        if (!appointment.doctor || !appointment.service) {
            return res.status(400).json({ message: 'Doctor and service are required' });
        }

        appointment.status = 'confirmed';
        appointment.confirmedBy = req.user._id;
        appointment.history.push({ action: 'confirmed', by: req.user._id });

        await appointment.save();

        console.log("Appointment.patientInfo:", appointment.patientInfo);

        const { email, phone, firstName = 'User' } = appointment.patientInfo || {};
        let whatsappMessageResult = null;

        if (email && firstName) {
            const formattedDate = new Date(appointment.date).toLocaleDateString('en-GB');
            const formattedStart = new Date(appointment.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const formattedEnd = new Date(appointment.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            const paymentUrl = `${process.env.FRONTEND_URL}/payment`;

            const tpl = templates.appointmentConfirmed({
                firstName,
                appointmentDate: formattedDate,
                startTime: formattedStart,
                endTime: formattedEnd,
                paymentUrl
            });

            await sendEmail({ to: email, subject: tpl.subject, html: tpl.emailHtml });

            if (phone) {
                whatsappMessageResult = await sendWhatsAppMessage({ to: phone, message: tpl.whatsappText });

                if (!whatsappMessageResult.success) {
                    appointment.whatsappReminder = whatsappMessageResult.reason;
                    await appointment.save();
                }
            }
        }

        res.status(200).json({
            message: 'Appointment Confirmed',
            appointment,
            whatsapp: whatsappMessageResult?.reason || 'Message sent successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ---------------------------- cancel Appointment By Admin or User ---------------------------- */

// export const cancelAppointment = async (req, res) => {
//   try {
//     const { cancellationMessage } = req.body;

//     if (!cancellationMessage || cancellationMessage.trim() === "") {
//       return res.status(400).json({ message: "Cancellation Message is Required!" });
//     }

//     const appointment = await Appointment.findById(req.params.id);

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment Not Found!" });
//     }

//     if (appointment.status === "cancelled") {
//       return res.status(400).json({ message: "Appointment is already cancelled!" });
//     }

//     const isAdmin = req.user.role === "admin";
//     const now = new Date();
//     const appointmentTime = new Date(appointment.startTime);

//     if (!isAdmin) {
//       const cancelBefore = new Date(appointmentTime);
//       cancelBefore.setHours(cancelBefore.getHours() - appointment.cancellationWindowHours);

//       if (now > cancelBefore) {
//         return res
//           .status(400)
//           .json({ message: " You can't cancel this appointment because it's less than 24 hours before its scheduled time." });
//       }
//     }

//     await appointment.populate("payment");
//     const payment = appointment.payment;

//     // const { email, phone, firstName = "User" } = appointment.patientInfo || {};
//     // const firstName = appointment?.patientInfo?.firstName || "User";
//     // const email = appointment?.patientInfo?.email;
//     // const phone = appointment?.patientInfo?.phone;



// if (payment?.status === "paid" && payment?.paymentGateway === "stripe") {
//   try {
//     const Stripe = (await import("stripe")).default;
//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//     const session = await stripe.checkout.sessions.retrieve(payment.transactionId);
//     const paymentIntentId = session.payment_intent;

//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

//     if (
//       !paymentIntent ||
//       paymentIntent.status !== "succeeded" ||
//       !paymentIntent.charges ||
//       !paymentIntent.charges.data.length
//     ) {
//       return res.status(400).json({
//         message: "Cannot process refund. Payment was not completed successfully.",
//       });
//     }

//     const charge = paymentIntent.charges.data[0];

//     // Request the refund
//     await stripe.refunds.create({
//       charge: charge.id,
//     });

//     // Update the payment status
//     payment.status = "refunded";
//     await payment.save();

//     // Prepare notification
//     const firstName = appointment?.patientInfo?.firstName || "User";
//     const email = appointment?.patientInfo?.email;
//     const phone = appointment?.patientInfo?.phone;

//     const refundTpl = templates.refundProcessed({ firstName });

//     if (email) {
//       await sendEmail({
//         to: email,
//         subject: refundTpl.subject,
//         html: refundTpl.emailHtml,
//       });
//     }

//     if (phone) {
//       await sendWhatsAppMessage({
//         to: phone,
//         message: refundTpl.whatsappText,
//       });
//     }

//     return res.status(200).json({ message: "Refund processed successfully." });

//   } catch (stripeError) {
//     console.error("❌ Stripe Refund Error:", stripeError);
//     return res.status(500).json({
//       message: "Stripe refund failed.",
//       details: stripeError.message,
//     });
//   }
// }



// //     if (payment?.status === "paid" && payment?.paymentGateway === "stripe") {
// //       try {
// //         const Stripe = (await import("stripe")).default;
// //         const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// //         // const paymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);
// //         const session = await stripe.checkout.sessions.retrieve(payment.transactionId);
// //         const paymentIntentId = session.payment_intent;

// //         const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
// // // console.log("Charges array: ", paymentIntent.charges.data);


// //         if (!paymentIntent || !paymentIntent.charges || !paymentIntent.charges.data.length) {
// //           return res.status(400).json({ message: "No charges found for this payment intent." });
// //         }

// //         const charge = paymentIntent.charges.data[0];

// //         await stripe.refunds.create({
// //           charge: charge.id,
// //         });

// //         payment.status = "refunded";
// //         await payment.save();

// //         // const { email, phone, firstName = "User" } = appointment.patientInfo || {};
// //         const firstName = appointment?.patientInfo?.firstName || "User";
// //         const email = appointment?.patientInfo?.email;
// //         const phone = appointment?.patientInfo?.phone;

// //         const refundTpl = templates.refundProcessed({ firstName });

// //       if (email) {
// //         await sendEmail({
// //           to: email,
// //           subject: refundTpl.subject,
// //           html: refundTpl.emailHtml,
// //         });
// //       }

// //       if (phone) {
// //         await sendWhatsAppMessage({
// //           to: phone,
// //           message: refundTpl.whatsappText,
// //         });
// //       }

// //        return res.status(200).json({ message: "Refund processed successfully" });
// //         } catch (stripeError) {
// //           console.error("❌ Stripe Refund Error:", stripeError);
// //           return res.status(500).json({
// //             message: "Stripe refund failed",
// //             details: stripeError.message,
// //           });
// //         }
// //     }

    
//     const formattedDate = new Date(appointment.date).toLocaleDateString("en-GB");
//     const formattedStart = new Date(appointment.startTime).toLocaleTimeString("en-GB", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//     const formattedEnd = new Date(appointment.endTime).toLocaleTimeString("en-GB", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//     const tpl = templates.appointmentCancelled({
//       firstName,
//       cancellationMessage,
//       byClinic: isAdmin,
//       appointmentDate: formattedDate,
//       startTime: formattedStart,
//       endTime: formattedEnd,
//     });

//     if (email) {
//       await sendEmail({
//         to: email,
//         subject: tpl.subject,
//         html: tpl.emailHtml,
//       });
//     }

//     let whatsappMessageResult = null;
//     if (phone) {
//       whatsappMessageResult = await sendWhatsAppMessage({
//         to: phone,
//         message: tpl.whatsappText,
//       });
//       if (!whatsappMessageResult.success) {
//         appointment.whatsappReminder = whatsappMessageResult.reason;
//       }
//     }

//     appointment.status = "cancelled";
//     appointment.cancellationMessage = cancellationMessage;
//     await appointment.save();

//     res.status(200).json({
//       message: "Appointment Cancelled",
//       appointment,
//       whatsapp: whatsappMessageResult?.reason || "Message sent successfully",
//     });
//   } catch (error) {
//       console.error("❌ Server Error while cancelling appointment:", error);
//     res.status(500).json({ message: error.message });
//   }
// };


export const cancelAppointment = async (req, res) => {
  try {
    const { cancellationMessage } = req.body;

    if (!cancellationMessage || cancellationMessage.trim() === "") {
      return res.status(400).json({ message: "Cancellation Message is Required!" });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment Not Found!" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Appointment is already cancelled!" });
    }

    const isAdmin = req.user.role === "admin";
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);

    if (!isAdmin) {
      const cancelBefore = new Date(appointmentTime);
      cancelBefore.setHours(cancelBefore.getHours() - appointment.cancellationWindowHours);

      if (now > cancelBefore) {
        return res
          .status(400)
          .json({ message: " You can't cancel this appointment because it's less than 24 hours before its scheduled time." });
      }
    }

    await appointment.populate("payment");
    const payment = appointment.payment;

    // Handle Stripe refund if payment was made
    if (payment?.status === "paid" && payment?.paymentGateway === "stripe") {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        console.log("💳 Processing refund for payment:", payment.transactionId);

        let paymentIntent;
        
        // Check if transactionId is a session ID or payment intent ID
        if (payment.transactionId.startsWith('cs_')) {
          // It's a session ID, get the payment intent from the session
          const session = await stripe.checkout.sessions.retrieve(payment.transactionId);
          console.log("🔍 Session retrieved:", session.id);
          
          if (!session || !session.payment_intent) {
            console.log("❌ No payment intent found in session");
            return res.status(400).json({
              message: "Cannot process refund. No payment intent found.",
            });
          }
          
          paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        } else if (payment.transactionId.startsWith('pi_')) {
          // It's already a payment intent ID
          paymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);
        } else {
          console.log("❌ Invalid transaction ID format:", payment.transactionId);
          return res.status(400).json({
            message: "Invalid transaction ID format.",
          });
        }

        console.log("💰 Payment Intent status:", paymentIntent.status);
        console.log("💰 Payment Intent ID:", paymentIntent.id);

        // Check if payment intent is valid for refund
        if (!paymentIntent || paymentIntent.status !== "succeeded") {
          console.log("❌ Payment intent not succeeded, status:", paymentIntent.status);
          return res.status(400).json({
            message: "Cannot process refund. Payment was not completed successfully.",
          });
        }

        // **NEW: Check if already refunded by examining existing refunds**
        const existingRefunds = await stripe.refunds.list({
          payment_intent: paymentIntent.id,
          limit: 10
        });

        console.log("🔍 Existing refunds for this payment:", existingRefunds.data.length);

        // Check if there are any successful refunds for this payment
        const successfulRefunds = existingRefunds.data.filter(refund => 
          refund.status === 'succeeded' || refund.status === 'pending'
        );

        if (successfulRefunds.length > 0) {
          console.log("⚠️ Payment already has refunds:", successfulRefunds.map(r => r.id));
          
          // Update local payment record to reflect the refund
          payment.status = "refunded";
          payment.refundId = successfulRefunds[0].id;
          payment.refundDate = new Date();
          await payment.save();

          // Still cancel the appointment
          appointment.status = "cancelled";
          appointment.cancellationMessage = cancellationMessage;
          await appointment.save();

          return res.status(200).json({
            message: "Appointment cancelled. Payment was already refunded.",
            refundId: successfulRefunds[0].id,
            refundAmount: successfulRefunds[0].amount / 100,
            appointment
          });
        }

        // **NEW: Also check if the total refunded amount equals the payment amount**
        const totalRefunded = existingRefunds.data.reduce((sum, refund) => {
          if (refund.status === 'succeeded') {
            return sum + refund.amount;
          }
          return sum;
        }, 0);

        if (totalRefunded >= paymentIntent.amount) {
          console.log("⚠️ Payment amount already fully refunded");
          
          // Update local payment record
          payment.status = "refunded";
          payment.refundId = existingRefunds.data[0]?.id;
          payment.refundDate = new Date();
          await payment.save();

          appointment.status = "cancelled";
          appointment.cancellationMessage = cancellationMessage;
          await appointment.save();

          return res.status(200).json({
            message: "Appointment cancelled. Payment was already fully refunded.",
            refundAmount: totalRefunded / 100,
            appointment
          });
        }

        // Proceed with refund if no existing refunds
        let refund;
        try {
          // First try to create refund using payment_intent (recommended approach)
          refund = await stripe.refunds.create({
            payment_intent: paymentIntent.id,
            reason: 'requested_by_customer'
          });
          console.log("✅ Refund created successfully with payment_intent:", refund.id);
        } catch (refundError) {
          console.log("❌ Refund with payment_intent failed:", refundError.message);
          
          // **ENHANCED: Better error handling for already refunded charges**
          if (refundError.message.includes('already been refunded')) {
            console.log("⚠️ Charge already refunded, updating local records");
            
            // Update payment status
            payment.status = "refunded";
            payment.refundDate = new Date();
            await payment.save();

            // Cancel appointment
            appointment.status = "cancelled";
            appointment.cancellationMessage = cancellationMessage;
            await appointment.save();

            return res.status(200).json({
              message: "Appointment cancelled. Payment was already refunded.",
              appointment
            });
          }
          
          console.log("🔄 Trying with charge method...");
          
          // Fallback: try with charge
          try {
            // Get the latest charge from the payment intent
            const charges = await stripe.charges.list({
              payment_intent: paymentIntent.id,
              limit: 1
            });
            
            if (charges.data.length === 0) {
              console.log("❌ No charges found for this payment intent");
              return res.status(400).json({
                message: "Cannot process refund. No charges found for this payment.",
              });
            }
            
            const charge = charges.data[0];
            console.log("💳 Found charge:", charge.id, "Status:", charge.status);
            
            if (charge.status !== 'succeeded') {
              console.log("❌ Charge not succeeded, status:", charge.status);
              return res.status(400).json({
                message: "Cannot process refund. Charge was not successful.",
              });
            }
            
            refund = await stripe.refunds.create({
              charge: charge.id,
              reason: 'requested_by_customer'
            });
            console.log("✅ Refund created successfully with charge:", refund.id);
          } catch (chargeError) {
            console.log("❌ Charge refund also failed:", chargeError.message);
            
            // **ENHANCED: Handle already refunded charge gracefully**
            if (chargeError.message.includes('already been refunded')) {
              console.log("⚠️ Charge already refunded, updating local records");
              
              // Update payment status
              payment.status = "refunded";
              payment.refundDate = new Date();
              await payment.save();

              // Cancel appointment
              appointment.status = "cancelled";
              appointment.cancellationMessage = cancellationMessage;
              await appointment.save();

              return res.status(200).json({
                message: "Appointment cancelled. Payment was already refunded.",
                appointment
              });
            }
            
            throw new Error(`Refund failed: ${chargeError.message}`);
          }
        }

        // Update payment status
        payment.status = "refunded";
        payment.refundId = refund.id;
        payment.refundDate = new Date();
        await payment.save();

        // Prepare notification
        const firstName = appointment?.patientInfo?.firstName || "User";
        const email = appointment?.patientInfo?.email;
        const phone = appointment?.patientInfo?.phone;

        const refundTpl = templates.refundProcessed({ firstName });

        // Send notifications
        if (email) {
          await sendEmail({
            to: email,
            subject: refundTpl.subject,
            html: refundTpl.emailHtml,
          });
          console.log("📧 Refund email sent to:", email);
        }

        if (phone) {
          await sendWhatsAppMessage({
            to: phone,
            message: refundTpl.whatsappText,
          });
          console.log("📱 WhatsApp refund message sent to:", phone);
        }

        // Update appointment status
        appointment.status = "cancelled";
        appointment.cancellationMessage = cancellationMessage;
        await appointment.save();

        return res.status(200).json({ 
          message: "Appointment cancelled and refund processed successfully.",
          refundId: refund.id,
          refundAmount: refund.amount / 100, // Convert back to dollars
          appointment
        });

      } catch (stripeError) {
        console.error("❌ Stripe Refund Error:", stripeError);
        
        // If refund fails, still cancel the appointment but inform about refund failure
        appointment.status = "cancelled";
        appointment.cancellationMessage = cancellationMessage;
        await appointment.save();

        return res.status(500).json({
          message: "Appointment cancelled but refund failed. Please contact support.",
          details: stripeError.message,
          appointment
        });
      }
    }

    // Handle cancellation without refund (no payment or different gateway)
    const firstName = appointment?.patientInfo?.firstName || "User";
    const email = appointment?.patientInfo?.email;
    const phone = appointment?.patientInfo?.phone;

    const formattedDate = new Date(appointment.date).toLocaleDateString("en-GB");
    const formattedStart = new Date(appointment.startTime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedEnd = new Date(appointment.endTime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const tpl = templates.appointmentCancelled({
      firstName,
      cancellationMessage,
      byClinic: isAdmin,
      appointmentDate: formattedDate,
      startTime: formattedStart,
      endTime: formattedEnd,
    });

    if (email) {
      await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.emailHtml,
      });
    }

    let whatsappMessageResult = null;
    if (phone) {
      whatsappMessageResult = await sendWhatsAppMessage({
        to: phone,
        message: tpl.whatsappText,
      });
      if (!whatsappMessageResult.success) {
        appointment.whatsappReminder = whatsappMessageResult.reason;
      }
    }

    appointment.status = "cancelled";
    appointment.cancellationMessage = cancellationMessage;
    await appointment.save();

    res.status(200).json({
      message: "Appointment Cancelled",
      appointment,
      whatsapp: whatsappMessageResult?.reason || "Message sent successfully",
    });
  } catch (error) {
    console.error("❌ Server Error while cancelling appointment:", error);
    res.status(500).json({ message: error.message });
  }
};
/* ---------------------------- Get All Appointments for Admin ---------------------------- */

export const getAllAppointments = async (req, res) => {
  try {
    const { status, doctor, date } = req.query;

    const query = {};

    if (status) query.status = status;
    if (doctor) query.doctor = doctor;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    if (req.query.isFirstTime) {
      query.isFirstTime = req.query.isFirstTime === 'true';
    }

    const appointments = await Appointment.find(query)
      .populate('doctor', 'name')
      .populate('service', 'name')
      .populate('bookedBy', 'firstName email')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({ appointments });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ---------------------------- Allow Online Payment After confirmation ---------------------------- */

export const allowPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized - user data not found" });
    }

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Only clients can proceed with payment" });
    }

    if (!appointment.user) {
      return res.status(400).json({ message: "Appointment has no user assigned" });
    }

    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not allowed to pay for this appointment" });
    }

    if (appointment.paymentMethod !== "online") {
      return res.status(400).json({ message: "This appointment is not eligible for online payment" });
    }

    return res.status(200).json({ allow: true });
  } catch (err) {
    console.error("❌ Error in allowPayment:", err); // full error
    return res.status(500).json({ message: "Server error" });
  }
};


/* ---------------------------- Get All Appointments for One User ---------------------------- */

export const getUserAppointments = async (req, res) => {
    try {
        const userId = req. params.userId;
        const { status } = req.query;

        const query = {
            $or: [
                { user: userId },
                { bookedBy: userId }
            ]
        };

        if(status) query.status = status;

        const appointments = await Appointment
        .find(query)
        .populate({
            path: 'doctor',
            populate: {
            path: 'user',
            select: 'firstName lastName'
            }
        })
        .populate('service', 'name')
        .sort({ date: -1 });

        
        res.status(200).json({ appointments });
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

/* ---------------------------- Rescedule Appointment ---------------------------- */

export const rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { newDate, newStartTime, newEndTime } = req.query;

        const appointment = await Appointment.findById(id);

        if(!appointment) {
            return res.status(404).json({ message: 'Appointment not found!'});
        }

        const now = new Date();
        const originalStart = new Date(appointment.startTime);
        const diffHours = (originalStart - now) / (1000 * 60 *60);

        if (diffHours < appointment.cancellationWindowHours) {
            return res.status(400).json({ message: "Cannot reschedule less than 24h before appointment" });
        }

        if (appointment.rescheduleCount >= 2) {
            return res.status(400).json({ message: "You can't reschedule more than 2 times" });
        }

        appointment.rescheduleCount += 1;


        const oldAppointment = { ...appointment._doc };

        appointment.date = newDate;
        appointment.startTime = newStartTime;
        appointment.endTime = newEndTime;
        appointment.status = 'rescheduled';
        appointment.rescheduledFrom = oldAppointment._id;

        await appointment.save();

        const { email, phone, firstName = 'User' } = appointment.patientInfo || {};

        const formattedDate = new Date(appointment.date).toLocaleDateString('en-GB');
        const formattedStart = new Date(appointment.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const formattedEnd = new Date(appointment.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        const tpl = templates.appointmentRescheduled({
            firstName,
            newDate: formattedDate,
            newStartTime: formattedStart,
            newEndTime: formattedEnd,
        });

        if (email) {
        await sendEmail({
            to: email,
            subject: tpl.subject,
            html: tpl.emailHtml
        });
        }

        let whatsappMessageResult = null;
        if (phone) {
        whatsappMessageResult = await sendWhatsAppMessage({ to: phone, message: tpl.whatsappText });
        if (!whatsappMessageResult.success) {
            appointment.whatsappReminder = whatsappMessageResult.reason;
            await appointment.save();
        }
        }


        res.status(200).json({ message: "Appointment rescheduled!", appointment,
            whatsapp: whatsappMessageResult?.reason || 'Message sent successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

/* ---------------------------- Appointment Dashboard Stats ---------------------------- */

export const getAppointmentStats = async (req, res) => {
    try{
        const stats = await Appointment.aggregate([
            {
                $group: {
                    _id: {
                        service: '$service',
                        doctor: '$doctor',
                    },
                    count: { $sum: 1 },
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: '_id.service',
                    foreignField: '_id',
                    as: 'serviceInfo',
                }
            },
            {
                $lookup: {
                    from: 'doctors',
                    localField: '_id.doctor',
                    foreignField: '_id',
                    as: 'doctorInfo',
                }
            },
            {
                $project: {
                    count: 1,
                    service: { $arrayElemAt: ["$serviceInfo.name", 0] },
                    doctor: { $arrayElemAt: ["$doctorInfo.name", 0] },
                }
            }
        ]);

        res.json({ stats });

    } catch (error) {
        res,status(500).json({ message: error.message })
    }
}

/* ---------------------------- Mark Appointment Completed ---------------------------- */

export const markAppointmentCompleted = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed appointments can be completed' });
    }

    const now = new Date();
    if (now < new Date(appointment.endTime)) {
      return res.status(400).json({ message: 'Cannot complete before session ends' });
    }

    appointment.status = 'completed';
    appointment.history.push({ action: 'completed', by: req.user._id });
    await appointment.save();

    const { email, phone, firstName = 'User' } = appointment.patientInfo || {};
    const tpl = templates.appointmentCompleted({ firstName });

    if (email) {
      await sendEmail({ to: email, subject: tpl.subject, html: tpl.emailHtml });
    }

    let whatsappMessageResult = null;
    if (phone) {
      whatsappMessageResult = await sendWhatsAppMessage({ to: phone, message: tpl.whatsappText });
      if (!whatsappMessageResult.success) {
        appointment.whatsappReminder = whatsappMessageResult.reason;
        await appointment.save();
      }
    }

    res.json({
      message: 'Appointment marked as completed',
      appointment,
      whatsapp: whatsappMessageResult?.reason || 'Message sent successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ---------------------------- Get Completed Appointment ---------------------------- */

export const getCompletedAppointments = async (req, res) => {
    try {
        const completed = await Appointment.find({ status: 'completed' })
        .populate('user doctor service')
        .sort({ date: -1 });

        res.json(completed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ---------------------------- Get Status Status (completed, cancelled, created) ---------------------------- */

export const getStatusStats = async (req, res) => {
    try {
        const stats = await Appointment.aggregate([
            {
                $group: {
                    _id: {
                    doctor: '$doctor',
                    service: '$service',
                    status: '$status',
                    },
                    count: { $sum: 1 },
                }
            },
            {
                $lookup: {
                    from: 'doctors',
                    localField: '_id.doctor',
                    foreignField: '_id',
                    as: 'doctorInfo',
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: '_id.service',
                    foreignField: '_id',
                    as: 'serviceInfo',
                }
            },
            {
                $project: {
                    count: 1,
                    status: '$_id.status',
                    doctor: { $arrayElemAt: ['$doctorInfo.name', 0] },
                    service: { $arrayElemAt: ['$serviceInfo.name', 0] },
                    _id: 0,
                }
            }
        ]);
        
        res.status(200).json({ stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ---------------------------- Get Daily Report For Doctor Appointments (completed, cancelled, created) ---------------------------- */

export const getDailyReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const appointments = await Appointment.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('doctor service');

    res.status(200).json({ count: appointments.length, appointments });
} catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------- Mark No-show Appointments By Admin ---------------------------- */

export const markNoShow = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('payment');

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: "Only completed appointments can be marked as no-show" });
    }

    const { firstName = 'User', email, phone } = appointment.patientInfo || {};
    const payment = appointment.payment;

    appointment.status = 'no-show';
    appointment.attended = false;
    appointment.noShowHandled = true;

    appointment.history.push({
      action: 'marked as no-show',
      by: req.user._id,
      at: new Date()
    });

    // Refund if paid
    if (payment?.status === 'paid' && payment?.paymentGateway) {
      if (payment.paymentGateway === 'stripe') {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.refunds.create({ payment_intent: payment.transactionId });
        payment.status = 'refunded';
      } else if (payment.paymentGateway === 'paymob') {
        payment.status = 'refund-pending'; 
      } else if (payment.paymentGateway === 'paypal') {
        payment.status = 'refund-pending'; 
      }

      await payment.save();

      const refundTpl = templates.refundProcessed({ firstName });

      if (email) {
        await sendEmail({ to: email, subject: refundTpl.subject, html: refundTpl.emailHtml });
      }

      if (phone) {
        await sendWhatsAppMessage({ to: phone, message: refundTpl.whatsappText });
      }
    }

    const rebookUrl = `${process.env.FRONTEND_URL}/appointments/rebook/${appointment._id}`;
    const tpl = templates.noShow({ firstName, rebookUrl });

    if (email) {
      await sendEmail({ to: email, subject: tpl.subject, html: tpl.emailHtml });
    }

    let whatsappMessageResult = null;
        if (phone) {
            whatsappMessageResult = await sendWhatsAppMessage({ to: phone, message: tpl.whatsappText });
            if (!whatsappMessageResult.success) {
                appointment.whatsappReminder = whatsappMessageResult.reason;
                await appointment.save();
            }
        }

    await appointment.save();

    res.status(200).json({
      message: "Appointment marked as no-show. Refund processed if applicable.",
      appointment,
      whatsapp: whatsappMessageResult?.reason || 'Message sent successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ---------------------------- Get All Mark No-show Appointments By Admin ---------------------------- */

export const getNoShowStats = async (req, res) => {
  try {
    const count = await Appointment.countDocuments({ status: 'no-show' });
    res.json({ noShowCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------- Delay Appointments By Admin ---------------------------- */

export const delayAppointment = async (req, res) => {
  try {
    const { delayMinutes, message } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);

    appointment.startTime = new Date(startTime.getTime() + delayMinutes * 60000);
    appointment.endTime = new Date(endTime.getTime() + delayMinutes * 60000);

    appointment.history.push({
        action: `delayed ${delayMinutes} mins`,
        message: message || '',
        by: req.user._id,
        at: new Date(),
    });

    await appointment.save();

    const { email, phone, firstName = 'User' } = appointment.patientInfo || {};

    const tpl = templates.appointmentDelayed({
        firstName,
        delayMinutes,
        note: message
    });

    if (email) {
    await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.emailHtml
    });
    }

    let whatsappMessageResult = null;
        if (phone) {
            whatsappMessageResult = await sendWhatsAppMessage({ to: phone, message: tpl.whatsappText });
            if (!whatsappMessageResult.success) {
                appointment.whatsappReminder = whatsappMessageResult.reason;
                await appointment.save();
            }
        }

    res.status(200).json({ message: 'Appointment delayed', appointment,
        whatsapp: whatsappMessageResult?.reason || 'Message sent successfully'
     });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};