import courierPkg from "@trycourier/courier";

// 1. SyntaxError bypass karne ke liye safe import
const CourierClient = courierPkg.CourierClient || courierPkg.default?.CourierClient || courierPkg;

// 2. Client initialize karo (apiKey use karke)
const courier = new CourierClient({ 
  apiKey: process.env.COURIER_AUTH_TOKEN 
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

    // 3. HYBRID CHECK: Check if method is .send or .messages.send
    // Ye line decide karegi ki kaunsa method work karega
    let response;
    if (typeof courier.send === 'function') {
      response = await courier.send(messagePayload);
    } else if (courier.messages && typeof courier.messages.send === 'function') {
      response = await courier.messages.send(messagePayload);
    } else {
      throw new Error("Courier SDK methods not found. Try updating the package.");
    }

    console.log("Email sent successfully! ID:", response.requestId || response.messageId);
  } catch (error) {
    console.error("Courier Error:", error.message);
    throw new Error("Email service failed");
  }
};

export default sendEmail;