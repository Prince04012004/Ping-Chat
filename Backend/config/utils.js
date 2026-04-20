const sendEmail = async (email, otp) => {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        // .env file mein RESEND_API_KEY=re_your_key_here zaroor rakhna
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ⚠️ Free tier mein 'from' hamesha yahi rahega jab tak domain verify na ho
        from: "Ping-Chat <onboarding@resend.dev>", 
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
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("🔥 Success! OTP sent to Inbox via Resend. ID:", data.id);
    } else {
      console.error("❌ Resend Error Details:", data);
    }
  } catch (error) {
    console.error("🚨 Critical Email Error:", error.message);
  }
};

export default sendEmail;