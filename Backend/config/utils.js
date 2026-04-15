import { CourierClient } from "@trycourier/courier";

const sendEmail = async (email, otp) => {
  const apiKey = process.env.COURIER_AUTH_TOKEN || process.env.COURIER_API_KEY;

  if (!apiKey) {
    throw new Error("Server configuration error. Please check API keys.");
  }

  const courier = CourierClient({ authorizationToken: apiKey });

  try {
    const { requestId } = await courier.send({
      message: {
        to: {
          email: email,  // 👈 object format mein
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
    });

    console.log("OTP Sent! ID:", requestId);
  } catch (error) {
    console.error("Courier Full Error:", JSON.stringify(error.response?.data || error.message, null, 2));
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

export default sendEmail;