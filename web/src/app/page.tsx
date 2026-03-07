"use client";

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import Link from "next/link";

export default function Home() {
  const { data: session, isPending: loading } = authClient.useSession();

  if (loading) {
    return <div>로딩중...</div>;
  }

  return (
    <div className="my-6 px-4 max-w-md mx-auto">
      <div className="text-center space-y-6">
        {session == null ? (
          <>
            <h1 className="text-3xl font-bold">Manga Translator</h1>
            <Button asChild size="lg">
              <Link href="/auth/login">로그인 / 회원가입</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">
              안녕하세요 {session.user.name}님!
            </h1>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/profile">프로필</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/organizations">조직</Link>
              </Button>

              <BetterAuthActionButton
                size="lg"
                variant="destructive"
                action={() => authClient.signOut()}
              >
                로그아웃
              </BetterAuthActionButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
