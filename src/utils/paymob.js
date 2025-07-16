import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

let authToken = null;

export const createPaymentToken = async (payment, appointment) => {

  console.log("🔑 PAYMOB_API_KEY:", process.env.PAYMOB_API_KEY);

  // Auth token
  if (!authToken) {
    const auth = await axios.post('https://accept.paymob.com/api/auth/tokens', {
        api_key: process.env.PAYMOB_API_KEY
      });

      authToken = auth.data.token; 
      console.log("✅ Auth Token:", authToken);

    console.log("🔐 Auth Response:", auth.data);
  }

  // Order
  const order = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
    auth_token: authToken,
    amount_cents: payment.amount * 100,
    delivery_needed: false,
    currency: 'EGP',
    merchant_order_id: appointment._id.toString(),
    items: []
    
  });
    console.log("📦 Order Response:", order.data);

    // Payment key
    const billingData = {
    first_name: appointment.user?.firstName || "Reem",
    last_name: appointment.user?.lastName || "Yousef",
    email: appointment.user?.email || "test@example.com",
    phone_number: appointment.user?.phone || "01111111111",
    apartment: "NA",
    floor: "NA",
    street: appointment.user?.address?.street || "Tahrir",
    building: "NA",
    city: appointment.user?.address?.city || "Cairo",
    state: "Cairo",
    country: appointment.user?.address?.country || "EG",
    postal_code: appointment.user?.address?.postalCode || "12345",
    shipping_method: "PKG",
  };


  console.log('📋 Billing Data:', billingData);


  const paymentKey = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
    auth_token: authToken,
    amount_cents: payment.amount * 100,
    expiration: 3600,
    order_id: order.data.id,
    billing_data: billingData,
    currency: 'EGP',
    integration_id: process.env.PAYMOB_INTEGRATION_ID
  });
   console.log("🔑 Payment Key Response:", paymentKey.data);

  return paymentKey.data.token;
};

export const getPaymentUrl = (token) => {
  return `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${token}`;
};

export const verifyPayment = async (transactionId) => {
  // Get auth token if not already fetched
  if (!authToken) {
    const auth = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: process.env.PAYMOB_API_KEY,
    });
    authToken = auth.data.token;
  }

  const response = await axios.get(
    `https://accept.paymob.com/api/acceptance/transactions/${transactionId}?token=${authToken}`
  );

  const transaction = response.data;

  console.log('💰 Transaction Details:', transaction);

  return transaction.success && transaction.pending === false;
};
