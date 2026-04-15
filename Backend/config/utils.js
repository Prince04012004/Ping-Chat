import { createRequire } from "module";
const require = createRequire(import.meta.url);
const courierPkg = require("@trycourier/courier");

// This line handles all possible export structures (v4, v5, and v6+)
const CourierClient = courierPkg.CourierClient || courierPkg.default?.CourierClient || courierPkg;

const courier = new CourierClient({ 
  authorizationToken: process.env.COURIER_AUTH_TOKEN 
});

const sendEmail = async (email, otp) => {
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

    console.log("Email sent successfully! Request ID:", requestId);
  } catch (error) {
    console.error("Courier Error:", error.message);
    throw new Error("Email service failed");
  }
};

export default sendEmail;