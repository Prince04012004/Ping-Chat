import { CourierClient } from "@trycourier/courier";

const sendEmail = async (email, otp) => {
  const apiKey = process.env.COURIER_AUTH_TOKEN || process.env.COURIER_API_KEY;

  if (!apiKey) {
    console.error("Backend Error: COURIER_AUTH_TOKEN is missing in Render Environment Variables.");
    throw new Error("Server configuration error. Please check API keys.");
  }

  const courier = new CourierClient({ authorizationToken: apiKey });

  try {
    const { requestId } = await courier.send({
      message: {
        to: { email: email },
        content: {
          title: "Ping AI - Verification Code",
          body: `Welcome to Ping AI! Your verification code is: ${otp}. This code is valid for 10 minutes.`,
        },
        routing: {
          method: "single",
          channels: ["email"],
        },
      },
    });

    console.log("OTP Sent Successfully! ID:", requestId);
  } catch (error) {
    console.error("Courier Service Error:", error.message);
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

export default sendEmail;