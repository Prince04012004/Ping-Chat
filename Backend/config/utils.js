const sendEmail = async (email, otp) => {
  const apiKey = process.env.COURIER_AUTH_TOKEN || process.env.COURIER_API_KEY;

  try {
    const response = await fetch("https://api.courier.com/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          to: {
            email: email,
          },
          content: {
            title: "Ping AI - Verification Code",
            body: `Your verification code is: ${otp}. Valid for 10 minutes.`,
          },
          routing: {
            method: "single",
            channels: ["email"],
          },
        },
      }),
    });

    const data = await response.json();
    console.log("OTP Sent! Response:", data);
  } catch (error) {
    console.error("Email Error:", error.message);
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

export default sendEmail;