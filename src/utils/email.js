import nodemailer from 'nodemailer';

export const sendEmail = async ({to, subject, html}) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    await transporter.sendMail({
        from: `"Dental Clinic App" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
};