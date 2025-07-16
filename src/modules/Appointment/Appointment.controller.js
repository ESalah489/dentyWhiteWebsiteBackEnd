import Appointment from '../../../DB/models/booking.model.js'
import User from '../../../DB/models/user.model.js'
import Doctor from '../../../DB/models/doctor.model.js'
import { sendEmail } from '../../utils/email.js';
import { templates } from '../../utils/messageTemplates.js';
import { sendWhatsAppMessage } from '../../utils/whatsapp.js';
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
            amount,
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

        const isAdmin = req.user.role ==='admin';

        if (isAdmin){
            if(!req.body.patientInfo){
                return res.status(400).json({message: "Patient info is required..."});
            }
            patientInfo = req.body.patientInfo;
        } else {
            const user = await User.findById(req.user._id).select("firstName lastName email phone age");
            if (!user) {
                return res.status(400).json({message: "User not found"});
            }

            patientInfo = {
                firstName : user.firstName,
                lastName : user.lastName,
                email : user.email,
                phone : user.phone,
                age : user.age,
            };
        }

        const userId = isAdmin ? null : req.user._id;
        const appointmentStatus = isAdmin ? 'confirmed' : 'pending';

        const exists = await Appointment.findOne({
            doctor,
            startTime: new Date(startTime),
        });
        if (exists) {
            return res.status(409).json({ message: 'This time slot is already booked.' });
        }

        const appointment =  new Appointment ({
            user : userId,
            bookedBy : req.user._id,
            doctor,
            service,
            date,
            startTime,
            endTime,
            patientInfo,
            paymentMethod,
            amount,
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


        res.status(201).json({message : "appointment created", appointment,
            whatsappReminder: appointment.whatsappReminder || null
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

/* ---------------------------- Get Appointment Status (booked, empty, pending) ---------------------------- */

export const getSlotsStatus = async (req, res) => {
    try{
        const {date} = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required'});
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0,0,0,0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23,59,59,999);

        const appointments = await Appointment.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        }).select('startTime endTime status');

        res.status(200).json({ appointments });
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

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

            const tpl = templates.appointmentConfirmed({
                firstName,
                appointmentDate: formattedDate,
                startTime: formattedStart,
                endTime: formattedEnd
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

export const cancelAppointment = async (req, res) => {
    try{
        const { cancellationMessage } = req.body;

        if (!cancellationMessage || cancellationMessage.trim() === '') {
            return res.status(400).json({ message: 'Cancellation Message is Required!'});
        }
    
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment Not Found!'});
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: 'Appointment is already cancelled!'});
        }

        const isAdmin = req.user.role === 'admin';
        const now = new Date();
        const appointmentTime = new Date(appointment.startTime);

        if (!isAdmin) {
            const cancelBefore = new Date(appointmentTime);
            cancelBefore.setHours(cancelBefore.getHours() - appointment.cancellationWindowHours);

            if (now > cancelBefore) {
                res.status(400).json({ message: 'You can only cancel 24 hours before the appointment'});
            }
        }

        await appointment.populate('payment');
        const payment = appointment.payment;

        const { email, phone, firstName = 'User' } = appointment.patientInfo || {};

        if (payment?.status === 'paid' && payment?.paymentGateway === 'stripe') {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

            await stripe.refunds.create({
                payment_intent: payment.transactionId
            });

            payment.status = 'refunded';
            await payment.save();

            const refundTpl = templates.refundProcessed({ firstName });

            if (email) {
                await sendEmail({ to: email, subject: refundTpl.subject, html: refundTpl.emailHtml });
            }

            if (phone) {
                await sendWhatsAppMessage({ to: phone, message: refundTpl.whatsappText });
            }
            }

            const formattedDate = new Date(appointment.date).toLocaleDateString('en-GB');
            const formattedStart = new Date(appointment.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const formattedEnd = new Date(appointment.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            const tpl = templates.appointmentCancelled({
            firstName,
            cancellationMessage,
            byClinic: isAdmin,
            appointmentDate: formattedDate,
            startTime: formattedStart,
            endTime: formattedEnd
            });

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

        res.status(200).json({ message: 'Appointment Cancelled', appointment,
            whatsapp: whatsappMessageResult?.reason || 'Message sent successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

/* ---------------------------- Get All Appointments for Admin ---------------------------- */

export const getAllAppointments = async (req, res) => {
    try {
        const { status, doctor, date } = req.query;

        const query= {};

        if(status) query.status = status;
        if(doctor) query.doctor = doctor;
        if(date) {
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

        const limit= parseInt(req.query.limit) || 10;
        const page= parseInt(req.query.page) || 1;
        const skip= (page - 1) * limit; 

        const appointments = await Appointment 
        .find(query)
        .populate('doctor', 'name')
        .populate('service', 'name')
        .populate('bookedBy', 'firstName email')
        .sort({ date:1, startTime:1 })
        .skip(skip)
        .limit(limit);
    
        const totalCount= await Appointment.countDocuments(query);

        res.status(200).json({ 
            appointments,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            } 
        });

    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}


/* ---------------------------- Get All Appointments for One User ---------------------------- */

export const getUserAppointments = async (req, res) => {
    try {
        const userId = req. params.userId;
        const { status } = req.query;

        const query = { bookedBy: userId};
        if(status) query.status = status;

        const appointments = await Appointment 
        .find( query )
        .populate('doctor', 'name')
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
    try{
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.status !== 'confirmed') {
        return res.status(400).json({ message: 'Only confirmed appointments can be completed' });
        }

        const now = new Date();
        if (now < appointment.endTime) {
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


        res.json({ message: 'Appointment marked as completed', appointment,
            whatsapp: whatsappMessageResult?.reason || 'Message sent successfully'
         });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

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