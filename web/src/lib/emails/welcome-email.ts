import { sendEmail } from "./send-email";

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  await sendEmail({
    to: user.email,
    subject: "환영합니다!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">환영합니다!</h2>
        <p>${user.name}님, 안녕하세요.</p>
        <p>회원가입을 해주셔서 감사합니다! 함께하게 되어 기쁩니다.</p>
        <p>감사합니다.</p>
      </div>
    `,
    text: `${user.name}님, 안녕하세요.\n\n회원가입을 해주셔서 감사합니다! 함께하게 되어 기쁩니다.\n\n감사합니다.`,
  });
}
