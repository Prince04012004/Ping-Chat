const sendEmail = async (email, otp) => {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email }] }],
        from: { email: "princekudiya2004@gmail.com", name: "Ping-chat" },
        subject: "Ping-chat - Verification Code",
        content: [{
          type: "text/html",
          value: `<h2>Your OTP: <b>${otp}</b></h2><p>Valid for 10 minutes.</p>`,
        }],
      }),
    });

    console.log("OTP Sent! Status:", response.status);
  } catch (error) {
    console.error("Email Error:", error.message);
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

export default sendEmail;