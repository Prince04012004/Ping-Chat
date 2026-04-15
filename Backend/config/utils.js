import { Resend } from "resend";

const sendEmail = async (email, otp) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: "Ping AI <onboarding@resend.dev>",
      to: email,
      subject: "Ping AI - Verification Code",
      html: `<h2>Your OTP is: <b>${otp}</b></h2><p>Valid for 10 minutes.</p>`,
    });

    if (error) throw new Error(error.message);
    console.log("OTP Sent Successfully! ID:", data.id);
  } catch (error) {
    console.error("Email Error:", error.message);
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

export default sendEmail;