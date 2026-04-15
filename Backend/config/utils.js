import { createRequire } from "module";
const require = createRequire(import.meta.url);
const CourierPkg = require("@trycourier/courier");

const CourierClient = CourierPkg.CourierClient || (CourierPkg.default && CourierPkg.default.CourierClient) || CourierPkg;

const sendEmail = async (email, otp) => {
  // 1. Check if the key exists (using both common names)
  const apiKey = process.env.COURIER_AUTH_TOKEN || process.env.COURIER_API_KEY;

  if (!apiKey) {
    console.error("Backend Error: COURIER_AUTH_TOKEN is missing in Render Environment Variables.");
    throw new Error("Server configuration error. Please check API keys.");
  }

  // 2. Initialize inside the function to ensure it has the latest env values
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
    // Custom message for frontend
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

export default sendEmail;