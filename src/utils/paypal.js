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
          value: payment.amount.toFixed(2)
        },
        description: appointment.service.name
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/payment/success/?paymentId=${payment._id}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/failure`
      }
      // application_context: {
      //   brand_name: "Clinic Appointments",
      //   landing_page: "LOGIN",
      //   user_action: "PAY_NOW",
        // return_url: `${process.env.FRONTEND_URL}/payment/success`,
        // cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      //   return_url: `https://google.com/?orderId=${payment._id}`,
      //   cancel_url: "https://example.com/cancel"
      // }

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

// export const verifyPayment = async (orderId) => {
//   const token = await getAccessToken();

//   const response = await axios.get(
//     `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       }
//     }
//   );

//   console.log('Paypal order status:', response.data.status);
//   console.log('Paypal order details:', JSON.stringify(response.data, null, 2));


//   try {
//   await axios.post(
//     `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
//     {},
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       }
//     }
//   );
// } catch (error) {
//   console.error('❌ Error capturing PayPal order:', error.response?.data || error.message);
//   throw new Error('Failed to capture PayPal payment');
// }


//   return response.data.status === 'COMPLETED';
// };


export const verifyPayment = async (orderId) => {
  const token = await getAccessToken();

  // Get latest order info
  const orderRes = await axios.get(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const status = orderRes.data.status;
  console.log('Paypal order status:', status);
  console.log('Paypal order details:', JSON.stringify(orderRes.data, null, 2));

  if (status === 'COMPLETED') return true;

  if (status === 'APPROVED') {
    try {
      // Retry after 3s delay to avoid premature capture
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const captureRes = await axios.post(
        `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const capStatus =
        captureRes.data.status ||
        captureRes.data.purchase_units?.[0]?.payments?.captures?.[0]?.status;

      console.log("✅ Capture response:", JSON.stringify(captureRes.data, null, 2));

      return capStatus === 'COMPLETED';
    } catch (err) {
      console.error("❌ Capture failed:", JSON.stringify(err.response?.data, null, 2));
      return false;
    }
  }

  return false;
};
