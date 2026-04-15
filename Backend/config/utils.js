import { CourierClient } from "@trycourier/courier";

// Courier Client ko initialize karo
// Render dashboard mein 'COURIER_AUTH_TOKEN' variable add karna mat bhulna
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
        data: {
          otp_code: otp, // Agar tune Courier template banaya hai toh wahan kaam aayega
        },
        routing: {
          method: "single",
          channels: ["email"],
        },
      },
    });

    console.log("OTP Sent Successfully! Courier ID:", requestId);
  } catch (error) {
    console.error("Courier Error:", error);
    // Yahan hum error throw karenge taaki frontend pe 'Email service failed' dikhe agar fail ho
    throw new Error("Email service failed");
  }
};

export default sendEmail;