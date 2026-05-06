import nodemailer from "nodemailer";

const sendEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      // Hum host mein domain ki jagah IP bhi daal sakte hain, 
      // lekin Gmail ke liye 'service' parameter sabse best kaam karta hai Render pe.
      service: "gmail", 
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // 🚨 Sabse important part: Force IPv4 stack
      family: 4, 
      tls: {
        // Render ke networking issues se bachne ke liye
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Ping-Chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔐 ${otp} is your Ping-Chat code`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
          <h2 style="color: #10b981;">Ping-Chat Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing: 5px; text-align: center; background: #f4f4f4; padding: 10px;">${otp}</h1>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    return info;

  } catch (error) {
    // Agar ab bhi fail ho, toh error detail check karo
    console.error("🚨 Detailed Error:", error.code, error.command);
    throw error;
  }
};

export default sendEmail;