import twilio from 'twilio';

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio (accountSid, authToken);

export const sendWhatsAppMessage = async ({ to, message }) => {
  return client.messages.create({
    from: 'whatsapp:+14155238886', 
    to: `whatsapp:${to}`,
    body: message
  });
};