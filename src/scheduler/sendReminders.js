import appointmentSchema from '../../DB/models/booking.model.js';
import { sendEmail } from '../utils/email.js';
import { sendWhatsAppMessage } from '../utils/whatsapp.js';

export const sendReminders = async () => {
  try {
    const now = new Date();

    const reminderConfigs = [
      {
        hoursBefore: 24,
        label: '24h',
      },
      {
        hoursBefore: 2,
        label: '2h',
      },
    ];

    for (const config of reminderConfigs) {
      const reminderTime = new Date(now.getTime() + config.hoursBefore * 60 * 60 * 1000);
      const reminderWindowEnd = new Date(reminderTime.getTime() + 5 * 60 * 1000); 

      const appointments = await appointmentSchema.find({
        startTime: { $gte: reminderTime, $lte: reminderWindowEnd },
        status: 'confirmed',
        reminders: { $not: { $elemMatch: { label: config.label } } } 
      });

      for (const appt of appointments) {
        const { email, phone, firstName } = appt.patientInfo || {};
        const msg = `Reminder (${config.label}): Hi ${firstName}, your appointment starts at ${new Date(appt.startTime).toLocaleTimeString()}.`;

        if (email) await sendEmail({ to: email, subject: 'Appointment Reminder', html: `<p>${msg}</p>` });
        if (phone) await sendWhatsAppMessage({ to: phone, message: msg });

        appt.reminders.push({
          type: config.label,
          sentAt: new Date(),
          via: {
            email: !!email,
            whatsapp: !!phone
          }
        });

        appt.history.push({
          action: `reminder-sent-${config.label}`,
          by: 'system',
          at: new Date()
        });

        await appt.save();
      }
    }

    console.log('✅ Reminders sent successfully');
  } catch (err) {
    console.error('❌ Reminder error:', err.message);
  }
};
