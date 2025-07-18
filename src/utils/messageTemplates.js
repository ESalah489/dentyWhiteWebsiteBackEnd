export const clinicInfo = {
  name: 'Dentia Clinic',
  address: '123 Smiles Street, north Sinai, Al-A',
  phone: '+20 111 222 3333',
  email: 'info@dentia.com'
};

export const templates = {
appointmentCreated: ({ firstName, appointmentDate, startTime, endTime }) => ({
  subject: '📅 Appointment Created Successfully',
  emailHtml: `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto; padding:20px;">
      <h2 style="color:#4a90e2;">Hello ${firstName},</h2>
      <p>Your appointment has been <strong>created</strong> successfully at <strong>${clinicInfo.name}</strong>.</p>
      <p><strong>Date:</strong> ${appointmentDate}<br/>
         <strong>Time:</strong> ${startTime} - ${endTime}</p>
      <p><strong>Clinic Address:</strong> ${clinicInfo.address}<br/>
         <strong>Contact Number:</strong> ${clinicInfo.phone}</p>
      <p>If you have any questions, feel free to reply to this email.</p>
      <hr style="border:none; border-top:1px solid #eee;"/>
      <p style="font-size:0.9em; color:#888;">
        ${clinicInfo.name} • ${clinicInfo.address} • ${clinicInfo.phone}
      </p>
    </div>
  `,
  whatsappText: `Hi ${firstName} 👋\n\nYour appointment has been *created* at ${clinicInfo.name}.\n📅 ${appointmentDate}\n⏰ ${startTime} - ${endTime}\n📍 ${clinicInfo.address}\n📞 ${clinicInfo.phone}`
}),

patientRegisteredByAdmin: ({ firstName, email, password }) => ({
  subject: '👤 Your Account Has Been Created',
  emailHtml: `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto; padding:20px;">
      <h2 style="color:#4a90e2;">Welcome ${firstName},</h2>
      <p>An account has been created for you at <strong>${clinicInfo.name}</strong>.</p>
      <p>Here are your login details:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>You can now login and manage your appointments anytime, and change password if you like.</p>
      <p>If you have any questions, feel free to reach out.</p>
      <hr style="border:none; border-top:1px solid #eee;"/>
      <p style="font-size:0.9em; color:#888;">
        ${clinicInfo.name} • ${clinicInfo.address} • ${clinicInfo.phone}
      </p>
    </div>
  `,
  whatsappText: `Hi ${firstName} 👋\n\nAn account has been created for you at *${clinicInfo.name}*.\n\nHere’s your login info:\n📧 Email: ${email}\n🔑 Password: ${password}\n\nYou can now log in and manage your appointments.\n📞 ${clinicInfo.phone}`
}),



appointmentConfirmed: ({ firstName, appointmentDate, startTime, endTime, paymentUrl }) => ({
  subject: '✅ Appointment Confirmed',
  emailHtml: `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto; padding:20px;">
      <h2 style="color:#4a90e2;">Hello ${firstName},</h2>
      <p>Your appointment is now <strong>confirmed</strong>. We look forward to seeing you!</p>
      <p><strong>Date:</strong> ${appointmentDate}<br/>
         <strong>Time:</strong> ${startTime} - ${endTime}</p>
      <p><strong>Clinic Address:</strong> ${clinicInfo.address}<br/>
         <strong>Contact Number:</strong> ${clinicInfo.phone}</p>
      <p style="margin-top:20px;">
        👉 You can now pay online: <a href="${paymentUrl}" target="_blank" style="color:#4a90e2;">Click here to pay</a>
      </p>
      <hr style="border:none; border-top:1px solid #eee;"/>
      <p style="font-size:0.9em; color:#888;">
        ${clinicInfo.name} • ${clinicInfo.address} • ${clinicInfo.phone}
      </p>
    </div>
  `,
  whatsappText: `Hi ${firstName} 😊\n\nYour appointment at ${clinicInfo.name} is *confirmed*.\n📅 ${appointmentDate}\n⏰ ${startTime} - ${endTime}\n📍 ${clinicInfo.address}\n📞 ${clinicInfo.phone}\n\nYou can now pay online here:\n${paymentUrl}\n\nSee you soon!`
}),


appointmentCancelled: ({ firstName, cancellationMessage, byClinic, appointmentDate, startTime, endTime, refund }) => ({
  subject: byClinic ? '⚠️ Appointment Cancelled by Clinic' : '❌ Appointment Cancelled',
  emailHtml: `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto; padding:20px;">
      <h2 style="color:#e94e77;">Hello ${firstName},</h2>
      <p>Your appointment on <strong>${appointmentDate}</strong> at <strong>${startTime}</strong> has been <strong>cancelled</strong>${byClinic ? ' by the clinic' : ''}.</p>
      <p><strong>Reason:</strong> ${cancellationMessage}</p>
      ${refund ? `<p style="color:green;">💸 A refund of <strong>$${refund.amount}</strong> has been processed. It may take a few days to appear in your account.</p>` : ''}
      <p>If you'd like to reschedule or need help, contact us at ${clinicInfo.phone}.</p>
      <hr style="border:none; border-top:1px solid #eee;"/>
      <p style="font-size:0.9em; color:#888;">
        ${clinicInfo.name} • ${clinicInfo.address} • ${clinicInfo.phone}
      </p>
    </div>
  `,
  whatsappText: `Hi ${firstName},\n\nYour appointment on ${appointmentDate} at ${startTime} was cancelled${byClinic ? ' by the clinic' : ''}.\nReason: ${cancellationMessage}${refund ? '\n💸 Refund has been processed.' : ''}\n📞 For rescheduling, call ${clinicInfo.phone}`
}),

appointmentCompleted: ({ firstName, appointmentDate }) => ({
  subject: '🎉 Thank You for Visiting',
  emailHtml: `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto; padding:20px;">
      <h2 style="color:#4a90e2;">Hi ${firstName},</h2>
      <p>Thank you for visiting <strong>${clinicInfo.name}</strong> on <strong>${appointmentDate}</strong>.</p>
      <p>We’d love to hear your feedback. Please reply to this email with your thoughts!</p>
      <hr style="border:none; border-top:1px solid #eee;"/>
      <p style="font-size:0.9em; color:#888;">
        ${clinicInfo.name} • ${clinicInfo.address} • ${clinicInfo.phone}
      </p>
    </div>
  `,
  whatsappText: `Hi ${firstName},\n\nThank you for visiting us on ${appointmentDate}. We’d appreciate your feedback 🤗\n📞 ${clinicInfo.phone}`
}),

  noShow: ({ firstName, rebookUrl }) => ({
    subject: '🚗 You Missed Your Appointment',
    emailHtml: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto; padding:20px;">
        <h2 style="color:#e94e77;">Hello ${firstName},</h2>
        <p>We missed you at your appointment.</p>
        <p>You can rebook at any time by clicking the button below:</p>
        <a href="${rebookUrl}" style="display:inline-block; margin-top:10px; padding:10px 15px; background-color:#4a90e2; color:white; text-decoration:none; border-radius:5px;">Rebook Now</a>
        <p style="margin-top: 15px;">Or contact us at ${clinicInfo.phone} if you need assistance.</p>
        <hr style="border:none; border-top:1px solid #eee;"/>
        <p style="font-size:0.9em; color:#888;">
          ${clinicInfo.name} &bull; ${clinicInfo.address} &bull; ${clinicInfo.phone}
        </p>
      </div>
    `,
    whatsappText: `Hi ${firstName},\n\nLooks like you missed your appointment.\nYou can rebook here: ${rebookUrl}\n📞 ${clinicInfo.phone}`
  }),

  appointmentRescheduled: ({ firstName, newDate, newStartTime, newEndTime }) => ({
    subject: '📆 Appointment Rescheduled',
    emailHtml: `
      <div style="font-family: Arial; color:#333; max-width:600px; margin:auto; padding:20px;">
        <h2 style="color:#4a90e2;">Hi ${firstName},</h2>
        <p>Your appointment has been <strong>rescheduled</strong>.</p>
        <p><strong>Date:</strong> ${newDate}<br/><strong>Time:</strong> ${newStartTime} - ${newEndTime}</p>
      </div>
    `,
    whatsappText: `Hi ${firstName},\n\nYour appointment has been *rescheduled* to ${newDate} from ${newStartTime} to ${newEndTime}.`
  }),

  appointmentDelayed: ({ firstName, delayMinutes, note }) => ({
    subject: '⏳ Appointment Delayed',
    emailHtml: `
      <div style="font-family: Arial; color:#333; max-width:600px; margin:auto; padding:20px;">
        <h2 style="color:#e94e77;">Hi ${firstName},</h2>
        <p>Your appointment has been delayed by <strong>${delayMinutes} minutes</strong>.</p>
        ${note ? `<p><strong>Note from the clinic:</strong> ${note}</p>` : ''}
        <p>If you have any questions, feel free to contact us at ${clinicInfo.phone}.</p>
      </div>
    `,
    whatsappText: `Hi ${firstName},\n\nYour appointment has been delayed by ${delayMinutes} minutes.${note ? `\nNote from the clinic: ${note}` : ''}`
  }),

refundProcessed: ({ firstName, amount }) => ({
  subject: '💸 Refund Processed',
  emailHtml: `
    <div style="font-family: Arial, sans-serif; color: #333; max-width:600px; margin:auto; padding:20px;">
      <h2 style="color:#28a745;">Hi ${firstName},</h2>
      <p>We’ve successfully processed your refund${amount ? ` of <strong>$${amount}</strong>` : ''} for the cancelled appointment.</p>
      <p>It may take a few business days to reflect in your account.</p>
      <p>If you have any questions, feel free to contact us at ${clinicInfo.phone}.</p>
      <p>Thank you for your understanding.<br/>– Dentia Team</p>
    </div>
  `,
  whatsappText: `Hi ${firstName},\n\nYour refund${amount ? ` of $${amount}` : ''} has been successfully processed. It may take a few days to reflect in your account.\n\n– Dentia Team`
}),

};

export default templates;
