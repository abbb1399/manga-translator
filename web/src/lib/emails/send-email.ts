import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL!;

export function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    // TODO 나중에 제거
    to: "abbb13999@gmail.com",
    subject,
    html,
    text,
  });
}
