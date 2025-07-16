import twilio from 'twilio';

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

function formatToInternationalPhone(phone) {
  if (!phone) return null;

  if (phone.startsWith('0')) {
    return `+20${phone.slice(1)}`;
  }

  if (phone.startsWith('+')) {
    return phone;
  }

  return `+20${phone}`;
}

export const sendWhatsAppMessage = async ({ to, message }) => {
  const formattedTo = formatToInternationalPhone(to);

  try {
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${formattedTo}`,
      body: message,
    });

    console.log("✅ WhatsApp message sent:", response.sid);
    return { success: true };
  } catch (error) {
    console.error("❌ WhatsApp Error:", error.message);

    if (error.message.includes("Twilio Sandbox")) {
      return {
        success: false,
        reason: "not_joined",
        message:
          "To receive WhatsApp messages, please send 'join silver-night' to +1 415 523 8886 on WhatsApp.",
      };
    }

    return {
      success: false,
      reason: "unknown",
      message: error.message,
    };
  }
};