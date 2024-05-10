import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import { Email } from "./email";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const sendEmail = async function (email: string, userId: string) {
  try {
    const hashedToken = await bcrypt.hash(userId, 10);
    const verifyTokenExpiry = new Date(Date.now() + 24 * 3600000);

    const updatedHtml = Email.replace(
      "https://sociial.onrender.com/verify",
      `https://sociial.onrender.com/verify?token=${hashedToken}`
    );
    console.log(updatedHtml);

    await User.findByIdAndUpdate(
      userId,
      {
        verifyToken: hashedToken,
        verifyTokenExpiry,
      },
      { new: true }
    );

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Verify mail",
      text: `Click the link to verify your account https://sociial.onrender.com/verify?token=${hashedToken}`,
      html: updatedHtml,
    });
  } catch (error) {
    console.log(error);
  }
};

export default sendEmail;
