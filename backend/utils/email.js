const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const sendVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email",
    text: `Your OTP for email verification is ${otp}. It expires in 10 minutes.`,
  };
  await transporter.sendMail(mailOptions);
};

const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  if (options.html) {
    mailOptions.html = options.html;
  }

  return await transporter.sendMail(mailOptions);
};

const sendForgotPasswordEmail = async (email, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
                 <a href="${process.env.FRONTEND_URL}/set-new-password?token=${token}"
           style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
    text: `Click this link to reset your password: ${process.env.FRONTEND_URL}/set-new-password?token=${token}. It expires in 1 hour.`,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendForgotPasswordEmail , sendEmail};