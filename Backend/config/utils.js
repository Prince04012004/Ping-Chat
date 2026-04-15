import nodemailer from "nodemailer";

const sendEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // 587 ke liye false hi rahega
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Make sure yahan Gmail ka "App Password" use ho raha ho
      },
      tls: {
        rejectUnauthorized: false // Cloud servers par connection issues fix karta hai
      }
    });

    const mailOptions = {
      from: `"Ping AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "OTP Verification - Ping",
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 400px; margin: auto; background-color: #050505; color: #ffffff; padding: 40px 20px; border-radius: 24px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">Ping</h2>
          <p style="font-size: 10px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Secure AI Workspace</p>
          
          <div style="margin: 40px 0;">
            <p style="font-size: 14px; color: #a1a1aa; margin-bottom: 8px;">Your verification code is:</p>
            <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ffffff; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px;">
              ${otp}
            </div>
          </div>
          
          <p style="font-size: 12px; color: #52525b;">This code is valid for 10 minutes only.</p>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 30px 0;">
          <p style="font-size: 10px; color: #3f3f46;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP sent successfully to:", email);
  } catch (error) {
    console.error("Email Sending Error:", error);
    throw new Error("Email service failed");
  }
};

export default sendEmail;