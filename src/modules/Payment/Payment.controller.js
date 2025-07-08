import Payment from '../../../DB/models/Payment.model.js';
import Appointment from '../../../DB/models/booking.model.js'
import { createSession, getSession } from '../../utils/stripe.js';
import { createPaymentToken, getPaymentUrl, verifyPayment as verifyPaymob } from '../../utils/paymob.js';
import { createOrder, verifyPayment as verifyPaypal } from '../../utils/paypal.js';

export const initiatePayment = async (req, res) => {
  try {
    const { appointmentId, paymentMethod, gateway = 'stripe' } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate('user service');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const payment = await Payment.create({
      user: req.user._id,
      service: appointment.service._id,
      amount: appointment.amount,
      method: paymentMethod,
      paymentGateway: paymentMethod === 'online' ? gateway : undefined,
    });

    appointment.payment = payment._id;
    await appointment.save();

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
        paymentUrl = order.links.find(link => link.rel === 'approve').href;
        payment.transactionId = order.id;
      }

      await payment.save();
      return res.json({ paymentUrl, paymentId: payment._id });
    } else {
      appointment.paymentStatus = 'pending';
      await appointment.save();
      return res.json({ message: 'Cash payment selected', paymentId: payment._id });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    let isPaid = false;

    if (payment.paymentGateway === 'stripe') {
      const session = await getSession(payment.transactionId);
      isPaid = session.payment_status === 'paid';
    } else if (payment.paymentGateway === 'paymob') {
      isPaid = await verifyPaymob(payment.transactionId);
    } else if (payment.paymentGateway === 'paypal') {
      isPaid = await verifyPaypal(payment.transactionId);
    }

    if (isPaid) {
      payment.status = 'paid';
      payment.paymentDate = new Date();
      await payment.save();

      await Appointment.updateOne(
        { _id: req.body.appointmentId },
        { paymentStatus: 'paid' }
      );
    }

    res.json({ isPaid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
