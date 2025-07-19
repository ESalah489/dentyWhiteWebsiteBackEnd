import Appointment from '../../DB/models/booking.model.js';

export const autoCompleteAppointments = async () => {
  try {
    const now = new Date();

    const result = await Appointment.updateMany(
      { endTime: { $lte: now }, status: 'confirmed' },
      {
        $set: { status: 'completed', attended: true },
        $push: {
          history: {
            action: 'auto-completed',
            by: 'system',
            at: now,
          },
        },
      }
    );

    console.log(`✅ Auto-completed appointments: ${result.modifiedCount}`);
  } catch (error) {
    console.error('❌ Failed to auto-complete appointments:', error.message);
  }
};

export const autoExpireAppointments = async () => {
  try {
    const now = new Date();

    const result = await Appointment.updateMany(
      {
        endTime: { $lte: now },
        status: 'pending'
      },
      {
        $set: { status: 'expired' },
        $push: {
          history: {
            action: 'auto-expired',
            by: 'system',
            at: now,
          }
        }
      }
    );

    console.log(`🕒 Auto-expired appointments: ${result.modifiedCount}`);
  } catch (error) {
    console.error('❌ Failed to auto-expire appointments:', error.message);
  }
};