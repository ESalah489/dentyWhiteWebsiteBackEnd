  import { buffer } from 'micro';
  import Stripe from 'stripe';
  import config from '../config/index.js';
  import Payment from '../../DB/models/payment.model.js';

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
           transactionId: session.payment_intent,
        });
      }
    }

    res.status(200).json({ received: true });
  };

//   export const stripeWebhook = async (req, res) => {
//   const sig = req.headers['stripe-signature'];

//   let event;
//   try {
//     const buf = await buffer(req);
//     event = stripe.webhooks.constructEvent(buf, sig, config.stripe.webhookSecret);
//   } catch (err) {
//     console.error("❌ Webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   console.log("📡 Received webhook event:", event.type);

//   try {
//     switch (event.type) {
//       case 'checkout.session.completed':
//         const session = event.data.object;
//         console.log("✅ Checkout session completed:", session.id);

//         const paymentId = session.metadata?.paymentId;
//         if (paymentId) {
//           await Payment.findByIdAndUpdate(paymentId, {
//             status: 'paid',
//             paymentDate: new Date(),
//             transactionId: session.payment_intent, // Store payment intent ID for easier refunds
//             sessionId: session.id, // Store session ID separately if needed
//           });
//           console.log("💾 Payment updated:", paymentId);
//         }
//         break;

//       case 'charge.dispute.created':
//         console.log("⚠️ Dispute created:", event.data.object.id);
//         break;

//       case 'invoice.payment_succeeded':
//         console.log("✅ Invoice payment succeeded:", event.data.object.id);
//         break;

//       case 'invoice.payment_failed':
//         console.log("❌ Invoice payment failed:", event.data.object.id);
//         break;

//       default:
//         console.log("ℹ️ Unhandled event type:", event.type);
//     }
//   } catch (error) {
//     console.error("❌ Error processing webhook:", error);
//     return res.status(500).json({ error: 'Webhook processing failed' });
//   }

//   res.status(200).json({ received: true });
// };