import nodemailer from "nodemailer";
import dns from "dns";

// ✅ Force IPv4 — Render's IPv6 networking is a common cause for timeouts
dns.setDefaultResultOrder("ipv4first");

const sendEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587, // 👈 Port 465 is likely blocked, 587 is safer for cloud hosting
      secure: false, // 👈 Must be false for port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // ⚠️ Must be a 16-digit Google App Password
      },
      tls: {
        // This prevents the connection from dropping on cloud servers
        rejectUnauthorized: false,
        minVersion: "TLSv1.2"
      },
      connectionTimeout: 20000, // Give it more time for the handshake
    });

    const mailOptions = {
      from: `"Ping-Chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔐 ${otp} is your Ping-Chat code`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 450px; margin: auto; border: 1px solid #eee; border-radius: 15px; padding: 30px; text-align: center;">
          <h1 style="color: #10b981; margin-bottom: 10px;">Ping-Chat</h1>
          <p style="color: #666; font-size: 16px;">Verify your email to start chatting.</p>
          
          <div style="margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${otp}</span>
          </div>
          
          <p style="font-size: 13px; color: #94a3b8;">This code is valid for 10 minutes. If you didn't request this, ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;">
          <p style="font-size: 11px; color: #cbd5e1;">&copy; 2026 Ping-Chat Secure Node</p>
        </div>
      `,
    };

    // Verify the connection before trying to send
    await transporter.verify();
    
    const info = await transporter.sendMail(mailOptions);
    console.log("🔥 OTP sent successfully! Message ID:", info.messageId);
    return info;

  } catch (error) {
    console.error("🚨 Nodemailer Error:", error.message);
    // If it still fails, check if the password is a Google "App Password"
    throw error;
  }
};

export default sendEmail;