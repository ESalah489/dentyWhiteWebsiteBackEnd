import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

let accessToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  if (accessToken && new Date() < tokenExpiry) return accessToken;

  const response = await axios.post(
    'https://api-m.sandbox.paypal.com/v1/oauth2/token',
    'grant_type=client_credentials',
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET
      }
    }
  );

  accessToken = response.data.access_token;
  tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
  return accessToken;
};

export const createOrder = async (payment, appointment) => {
  const token = await getAccessToken();

  const response = await axios.post(
    'https://api-m.sandbox.paypal.com/v2/checkout/orders',
    {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: payment.amount
        },
        description: appointment.service.name
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      }
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

export const verifyPayment = async (orderId) => {
  const token = await getAccessToken();

  const response = await axios.get(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.status === 'COMPLETED';
};
