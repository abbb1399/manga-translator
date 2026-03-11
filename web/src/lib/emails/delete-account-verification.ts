import { sendEmail } from "./send-email";

interface EmailVerificationData {
  user: {
    name: string;
    email: string;
  };
  url: string;
}

export async function sendDeleteAccountVerificationEmail({
  user,
  url,
}: EmailVerificationData) {
  await sendEmail({
    to: user.email,
    subject: "계정을 삭제해 주세요",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">계정 삭제 확인</h2>
        <p>안녕하세요 ${user.name}님,</p>
        <p>떠나신다니 아쉽습니다! 아래 버튼을 클릭하여 계정 삭제를 확인해 주세요:</p>
        <a href="${url}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">삭제 확인</a>
        <p>계정이 없으신 경우 이 이메일을 무시하세요.</p>
        <p>이 링크는 24시간 후에 만료됩니다.</p>
        <p>감사합니다.</p>
      </div>
    `,
    text: `안녕하세요 ${user.name}님,\n\n떠나신다니 아쉽습니다! 아래 링크를 클릭하여 계정 삭제를 확인해 주세요: ${url}\n\n계정이 없으신 경우 이 이메일을 무시하세요.\n\n이 링크는 24시간 후에 만료됩니다.\n\n감사합니다.`,
  });
}
