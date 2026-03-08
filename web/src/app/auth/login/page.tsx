"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { SocialAuthButtons } from "./_components/social-auth-buttons";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data != null) router.push("/");
    });
  }, [router]);

  return (
    <Card>
      <CardHeader className="text-2xl font-bold">
        <CardTitle>로그인</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <SocialAuthButtons />
      </CardContent>
    </Card>
  );
}
