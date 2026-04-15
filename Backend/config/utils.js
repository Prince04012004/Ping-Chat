import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Isse 'SyntaxError: does not provide an export named CourierClient' kabhi nahi aayega
const CourierPkg = require("@trycourier/courier");

// Isse 'TypeError: CourierClient is not a constructor' fix ho jayega
const CourierClient = CourierPkg.CourierClient || (CourierPkg.default && CourierPkg.default.CourierClient) || CourierPkg;

const sendEmail = async (email, otp) => {
  // Check if API key exists in environment
  const apiKey = process.env.COURIER_AUTH_TOKEN || process.env.COURIER_API_KEY;
  
  if (!apiKey) {
    console.error("Critical Error: Courier API Key is missing in Render Environment Variables.");
    throw new Error("Email configuration missing");
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

    console.log("Email sent successfully! ID:", requestId);
  } catch (error) {
    console.error("Courier Service Error:", error.message);
    throw new Error("Email service failed");
  }
};

export default sendEmail;