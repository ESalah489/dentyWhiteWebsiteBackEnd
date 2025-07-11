import { buffer } from 'micro';
import Stripe from 'stripe';
import config from '../config/index.js';
import Payment from '../../DB/models/Payment.model.js';

const stripe = new Stripe(config.stripe.secretKey);

export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, config.stripe.webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      await Payment.findByIdAndUpdate(paymentId, {
        status: 'paid',
        paymentDate: new Date(),
        transactionId: session.id,
      });
    }
  }

  res.status(200).json({ received: true });
};
