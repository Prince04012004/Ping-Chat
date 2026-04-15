import { CourierClient } from "@trycourier/courier";

const courier = new CourierClient({ 
  authorizationToken: process.env.COURIER_AUTH_TOKEN 
});

const sendEmail = async (email, otp) => {
  try {
    // Basic message object
    const messagePayload = {
      message: {
        to: { email: email },
        content: {
          title: "Ping AI - Verification Code",
          body: `Your verification code is: ${otp}. Valid for 10 minutes.`,
        },
        routing: {
          method: "single",
          channels: ["email"],
        },
      },
    };

    // Version Check: Kuch versions mein direct .send() hota hai, kuch mein .messages.send()
    let response;
    if (typeof courier.send === 'function') {
      response = await courier.send(messagePayload);
    } else if (courier.messages && typeof courier.messages.send === 'function') {
      response = await courier.messages.send(messagePayload);
    } else {
      throw new Error("Courier SDK method 'send' not found. Please check SDK version.");
    }

    console.log("Email sent successfully! ID:", response.requestId || response.messageId);
  } catch (error) {
    console.error("Courier Error:", error.message);
    throw new Error("Email service failed");
  }
};

export default sendEmail;