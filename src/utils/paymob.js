import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

let authToken = null;

export const createPaymentToken = async (payment, appointment) => {
  // Auth token
  if (!authToken) {
    const auth = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: process.env.PAYMOB_API_KEY
    });
    authToken = auth.data.token;
  }

  // Order
  const order = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
    auth_token: authToken,
    amount_cents: payment.amount * 100,
    delivery_needed: false,
    currency: 'EGP',
    items: []
  });

  // Payment key
  const billingData = {
    first_name: appointment.user.name,
    last_name: "User",
    email: appointment.user.email || "test@example.com",
    phone_number: appointment.user.phone || "01111111111"
  };

  const paymentKey = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
    auth_token: authToken,
    amount_cents: payment.amount * 100,
    expiration: 3600,
    order_id: order.data.id,
    billing_data: billingData,
    currency: 'EGP',
    integration_id: process.env.PAYMOB_INTEGRATION_ID
  });

  return paymentKey.data.token;
};

export const getPaymentUrl = (token) => {
  return `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${token}`;
};

export const verifyPayment = async () => true; // تبسيط مؤقت
