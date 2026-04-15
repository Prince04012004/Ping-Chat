import Courier from "@trycourier/courier";

// Library ko as a default import liya hai taaki SyntaxError na aaye
const CourierClient = Courier.CourierClient || Courier.default?.CourierClient || Courier;

const courier = new CourierClient({ 
  authorizationToken: process.env.COURIER_AUTH_TOKEN 
});

const sendEmail = async (email, otp) => {
  try {
    const messagePayload = {
      message: {
        to: { email: email },
        content: {
          title: "Ping AI - Verification Code",
          body: `Your verification code is: ${otp}. This code is valid for 10 minutes.`,
        },
        routing: {
          method: "single",
          channels: ["email"],
        },
      },
    };

    // Yahan hum check kar rahe hain ki method kahan hai
    const sendMethod = courier.send || (courier.messages && courier.messages.send);
    
    if (typeof sendMethod !== 'function') {
      throw new Error("Courier send method not found");
    }

    const response = await sendMethod.call(courier, messagePayload);
    console.log("OTP Sent! Request ID:", response.requestId || response.messageId);

  } catch (error) {
    console.error("Courier Error:", error.message);
    throw new Error("Email service failed");
  }
};

export default sendEmail;