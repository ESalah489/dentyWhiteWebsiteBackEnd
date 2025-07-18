export const preparePaymentData = (payment, appointment) => {
  return {
    amount: payment.amount,
    currency: 'USD',
    customer: {
      name: `${appointment.user.firstName} ${appointment.user.lastName}`,
      email: appointment.user.email,
      phone: appointment.user.phone
    },
    appointmentId: appointment._id.toString(),
    serviceName: appointment.service.name,
    doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
    appointmentDate: appointment.date
  };
};

export const sendPaymentConfirmation = async (user, paymentDetails) => {
  // إرسال إيميل التأكيد
  try {
    await sendEmail({
      to: user.email,
      subject: 'Payment Confirmation',
      html: `
        <h2>Payment Successful</h2>
        <p>Thank you for your payment of $${paymentDetails.amount} for your appointment.</p>
        <p>Transaction ID: ${paymentDetails.transactionId}</p>
      `
    });
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }

  // إرسال إشعار SMS إذا كان هناك رقم هاتف
  if (user.phone) {
    try {
      await sendSMS({
        to: user.phone,
        body: `Your payment of $${paymentDetails.amount} was successful. Ref: ${paymentDetails.transactionId}`
      });
    } catch (smsError) {
      console.error('Failed to send confirmation SMS:', smsError);
    }
  }
};