import { CourierClient } from "@trycourier/courier";

// Explicitly setting the key and using 'apiKey' property
const courier = new CourierClient({ 
  apiKey: process.env.COURIER_AUTH_TOKEN 
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