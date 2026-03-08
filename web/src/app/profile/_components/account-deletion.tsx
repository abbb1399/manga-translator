"use client";

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { authClient } from "@/lib/auth/auth-client";

export function AccountDeletion() {
  return (
    <BetterAuthActionButton
      requireAreYouSure
      variant="destructive"
      className="w-full"
      successMessage="계정 삭제가 시작되었습니다. 이메일을 확인하여 삭제를 완료해 주세요."
      action={() => authClient.deleteUser({ callbackURL: "/" })}
    >
      계정 영구 삭제
    </BetterAuthActionButton>
  );
}
