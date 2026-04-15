import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { CourierClient } = require("@trycourier/courier");

const courier = new CourierClient({ 
  authorizationToken: process.env.COURIER_AUTH_TOKEN 
});

const sendEmail = async (email, otp) => {
  try {
    const { requestId } = await courier.send({
      message: {
        to: {
          email: email,
        },
        content: {
          title: "Ping AI Verification",
          body: `Bhai, tera Ping AI account verify karne ke liye OTP ye hai: ${otp}. Ye sirf 10 minutes tak valid hai.`,
        },
        routing: {
          method: "single",
          channels: ["email"],
        },
      },
    });

    console.log("OTP Sent Successfully! Courier ID:", requestId);
  } catch (error) {
    console.error("Courier Error Details:", error.message);
    throw new Error("Email service failed");
  }
};

export default sendEmail;