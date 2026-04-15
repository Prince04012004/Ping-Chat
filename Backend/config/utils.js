import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Courier = require("@trycourier/courier");

// Is logic se hum package ka sahi constructor nikaal lenge bina error ke
const CourierClient = Courier.CourierClient || (Courier.default && Courier.default.CourierClient) || Courier;

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

    console.log("Email sent successfully! ID:", requestId);
  } catch (error) {
    console.error("Courier Error:", error.message);
    throw new Error("Email service failed");
  }
};

export default sendEmail;