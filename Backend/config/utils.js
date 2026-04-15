import courierPkg from "@trycourier/courier";

// 1. Precise extraction for v6+ and v7+
const CourierClient = courierPkg.CourierClient || courierPkg.default?.CourierClient || courierPkg;

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
          body: `Welcome to Ping AI! Your verification code is: ${otp}. This code is valid for 10 minutes.`,
        },
        routing: {
          method: "single",
          channels: ["email"],
        },
      },
    };

    /**
     * TRICK: Courier v6+ uses nested 'send' if initialized this way.
     * We attempt multiple common access patterns.
     */
    let response;
    
    if (courier.send && typeof courier.send === 'function') {
        response = await courier.send(messagePayload);
    } else if (courier.messages && typeof courier.messages.send === 'function') {
        response = await courier.messages.send(messagePayload);
    } else {
        // Last resort: some versions require calling it like this
        response = await courier.send.messages(messagePayload);
    }

    console.log("Email sent successfully! ID:", response.requestId || response.messageId);
  } catch (error) {
    console.error("Courier Error Detail:", error.message);
    throw new Error("Email service failed");
  }
};

export default sendEmail;