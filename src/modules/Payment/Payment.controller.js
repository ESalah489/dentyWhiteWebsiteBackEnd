import Payment from '../../../DB/models/Payment.model.js';
import Appointment from '../../../DB/models/booking.model.js'
import { createSession, getSession } from '../../utils/stripe.js';
import { createPaymentToken, getPaymentUrl, verifyPayment as verifyPaymob } from '../../utils/paymob.js';
import { createOrder, verifyPayment as verifyPaypal } from '../../utils/paypal.js';
import Stripe from 'stripe';

export const initiatePayment = async (req, res) => {
  try {
    const { appointmentId, paymentMethod, gateway } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate('user service');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (!appointment.service) {
      return res.status(400).json({ message: 'Service not found in appointment' });
    }
    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({ message: "Appointment already paid" });
    }

    if (paymentMethod === 'online' && !gateway) {
      return res.status(400).json({ message: 'Payment gateway is required for online payment' });
    }

    const amount = appointment.amount || appointment.service?.price;
    if (!amount) {
      return res.status(400).json({ message: 'Amount not found for payment' });
    }

const payment = await Payment.create({
  user: req.user._id,
  service: appointment.service._id,
  amount,
  method: paymentMethod,
  paymentGateway: paymentMethod === 'online' ? gateway : undefined,
});

    appointment.payment = payment._id;
    await appointment.save();

    console.log("Gateway:", gateway);


    if (paymentMethod === 'online') {
      let paymentUrl;
      if (gateway === 'stripe') {
        const session = await createSession(payment, appointment);
        paymentUrl = session.url;
        payment.transactionId = session.id;
      } else if (gateway === 'paymob') {
        const token = await createPaymentToken(payment, appointment);
        paymentUrl = getPaymentUrl(token);
        payment.transactionId = token;
       } else if (gateway === 'paypal') {
        const order = await createOrder(payment, appointment);

        console.log("🧾 PayPal Order Response:", JSON.stringify(order, null, 2));

        const approvalLinkObj = order.links?.find(link => link.rel === 'approve');

        if (!approvalLinkObj) {
          return res.status(500).json({ message: 'Approval link not found in PayPal response' });
        }

        paymentUrl = approvalLinkObj.href;
        payment.transactionId = order.id;
      }

      console.log({
  user: req.user._id,
  service: appointment.service._id,
  amount: appointment.amount,
  method: paymentMethod,
  paymentGateway: paymentMethod === 'online' ? gateway : undefined,
});


      await payment.save();
      return res.json({ paymentUrl, paymentId: payment._id });
    } else {
      appointment.paymentStatus = 'pending';
      await appointment.save();
      return res.json({ message: 'Cash payment selected', paymentId: payment._id });
    }
  } catch (error) {
      console.error("💥 initiatePayment error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const verifyPayment = async (req, res) => {
  console.log("👉 Reached verifyPayment route", req.params.paymentId);

  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access to payment" });
    }

    let isPaid = false;


    if (payment.paymentGateway === 'stripe') {
      const session = await getSession(payment.transactionId);
      isPaid = session.payment_status === 'paid';

    } else if (payment.paymentGateway === 'paymob') {
      isPaid = await verifyPaymob(payment.transactionId);

    } else if (payment.paymentGateway === 'paypal') {
      isPaid = await verifyPaypal(payment.transactionId);
    }

    if (!isPaid) {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // ✅ If Payment Verified
    if (isPaid) {
      payment.status = 'paid';
      payment.paymentDate = new Date();
      await payment.save();

      await Appointment.updateOne(
        { payment: payment._id },
        { paymentStatus: 'paid' }
      );
    }

    res.json({
    isPaid,
      paymentStatus: payment.status,
      paymentDate: payment.paymentDate,
    });

  } catch (error) {
    console.error("💥 Error in verifyPayment:", error);
    res.status(500).json({ message: error.message });
  }
};


export const paymobCallbackHandler = async (req, res) => {
  try {
    console.log("📥 Webhook Received:", req.body);

    const { obj } = req.body;
console.log("🔥 Full Body:", req.body);

    if (!obj || !obj.id || !obj.success) {
      return res.status(400).json({ message: "Invalid callback data" });
    }

    const transactionId = obj.id;

    const payment = await Payment.findOne({ transactionId });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found for this transaction" });
    }

    // تحقق من النجاح
    if (obj.success && obj.pending === false) {
      payment.status = 'paid';
      payment.paymentDate = new Date();
      await payment.save();

      await Appointment.updateOne(
        { payment: payment._id },
        { paymentStatus: 'paid' }
      );

      console.log(`✅ Payment success for appointment via Paymob Transaction: ${transactionId}`);
    } else {
      console.log(`❌ Payment failed or still pending. Transaction: ${transactionId}`);
    }

    return res.status(200).send("✅ Webhook processed");
  } catch (error) {
    console.error("❌ Error in paymobCallbackHandler:", error);
    return res.status(500).json({ message: "Server error in callback" });
  }
};

