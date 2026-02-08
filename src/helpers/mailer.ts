import { Resend } from "resend";
import { Email } from "./email";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async function (
  email: string,
  code: number,
  username: string,
  isRandom?: boolean,
) {
  const updatedHtml = Email(
    code,
    username,
    process.env.PUBLIC_URL || "https://sociial.vercel.app",
    isRandom,
  );

  const { error } = await resend.emails.send({
    from: "no-reply@sociial.dev-shivam.in",
    to: email,
    subject: "Verify mail - Activate your account",
    text: `Click the link to verify your account https://sociial.onrender.com/verify?code=${code}&username=${username} at sociial.\nThis code is valid for 5 minutes.\nIf you did not request for this code, please ignore this mail.`,
    html: updatedHtml,
  });

  if (error) {
    console.log(error);
    return false;
  }

  return true;
};

export default sendEmail;
