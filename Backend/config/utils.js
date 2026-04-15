import courierPkg from "@trycourier/courier";

// Ye tarika SyntaxError ko bypass karta hai
const CourierClient = courierPkg.CourierClient || courierPkg.default?.CourierClient;

if (!CourierClient) {
  throw new Error("CourierClient not found in the package. Check your installation.");
}

const courier = new CourierClient({ 
  authorizationToken: process.env.COURIER_AUTH_TOKEN 
});

const sendEmail = async (email, otp) => {
  try {
    const { requestId } = await courier.send({
      message: {
        to: { email: email },
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
    console.error("Courier Error:", error.message);
    throw new Error("Email service failed");
  }
};

export default sendEmail;