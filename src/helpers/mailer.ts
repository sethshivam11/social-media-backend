import nodemailer from "nodemailer";
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

const sendEmail = async function (
  email: string,
  code: number,
  username: string
) {
  try {
    const updatedHtml = Email(
      code,
      username,
      process.env.PUBLIC_URL || "https://sociial.vercel.app"
    );

    await transporter
      .sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: "Verify mail - Activate your account",
        text: `Click the link to verify your account https://sociial.onrender.com/verify?code=${code}&username=${username} at sociial.\nThis code is valid for 5 minutes.\nIf you did not request for this code, please ignore this mail.`,
        html: updatedHtml,
      })
  } catch (error) {
    console.log(error);
  }
};


export default sendEmail;
