const sendEmail = async (email, otp) => {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email }],
          },
        ],
        // From address wahi rakho jo SendGrid mein verified hai
        from: { 
          email: "princekudiya2004@gmail.com", 
          name: "Ping-Chat Security" 
        },
        // Reply-To add karne se trust badhta hai
        reply_to: { 
          email: "princekudiya2004@gmail.com", 
          name: "Support" 
        },
        subject: `🔐 ${otp} is your Ping-Chat verification code`,
        content: [
          {
            type: "text/plain",
            value: `Your Ping-Chat verification code is ${otp}. Valid for 10 minutes.`,
          },
          {
            type: "text/html",
            value: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; color: #1a1a1a;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: -1px;">Ping-Chat</h1>
                  <p style="color: #666; font-size: 14px; margin-top: 5px;">Secure Verification System</p>
                </div>
                
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; text-align: center; border: 1px dashed #d1d5db;">
                  <p style="margin: 0 0 15px 0; font-size: 16px; color: #374151;">Use the code below to verify your account:</p>
                  <span style="display: block; font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #111827; margin: 10px 0;">${otp}</span>
                  <p style="margin: 15px 0 0 0; font-size: 13px; color: #6b7280;">This code expires in 10 minutes.</p>
                </div>

                <div style="margin-top: 25px; font-size: 14px; color: #4b5563; line-height: 1.5;">
                  <p>If you didn't request this code, you can safely ignore this email. Someone might have typed your email address by mistake.</p>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                  <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; 2026 Ping-Chat App. Built with ❤️ in Delhi.</p>
                </div>
              </div>
            `,
          },
        ],
      }),
    });

    if (response.status >= 400) {
      const errorData = await response.json();
      console.error("SendGrid Error Details:", errorData);
    }

    console.log("OTP Sent! Status:", response.status);
  } catch (error) {
    console.error("Email Error:", error.message);
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

export default sendEmail;