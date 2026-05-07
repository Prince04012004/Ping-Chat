import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Ping-Chat <onboarding@resend.dev>",
      to: [email],
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
    });

    if (error) {
      console.error("🚨 Resend Error:", error);
      throw new Error(error.message);
    }

    console.log("🔥 OTP sent! ID:", data?.id);

  } catch (err) {
    console.error("🚨 Email Error:", err.message);
    throw err;
  }
};

export default sendEmail;