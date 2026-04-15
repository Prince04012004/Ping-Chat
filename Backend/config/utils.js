import nodemailer from "nodemailer";

const sendEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "OTP Verification - ChatBox",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="text-align: center; color: #10b981;">ChatBox</h2>
        <p>Your verification code is:</p>
        <div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #333;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #777; text-align: center;">This code is valid for 10 minutes only.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;