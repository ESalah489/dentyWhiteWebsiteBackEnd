import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createSession = async (payment, appointment) => {
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: appointment.service.name },
        unit_amount: payment.amount * 100
      },
      quantity: 1,
    }],
    mode: 'payment',
    // success_url: `${process.env.FRONTEND_URL}/payment/success`,
    // cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    success_url: `https://example.com/payment/success`,  
    cancel_url: `https://example.com/payment/cancel`,
    metadata: {
      paymentId: payment._id.toString()
    }
  });
};

export const getSession = async (sessionId) => {
  return await stripe.checkout.sessions.retrieve(sessionId);
};
