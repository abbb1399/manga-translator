"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/auth-client";
import Link from "next/link";

export function Header() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const { data: session } = authClient.useSession();

  function handleSignOut() {
    return authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/") },
    });
  }

  return (
    <header className="border-b px-4 h-14 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        Manga Translator
      </Link>
      <div className="flex items-center">
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage
                  src={session.user.image ?? undefined}
                  alt={session.user.name}
                />
                <AvatarFallback>{session.user.name[0]}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">프로필</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <BetterAuthActionButton
                  variant="ghost"
                  className="w-full justify-start h-auto p-0 text-sm"
                  action={handleSignOut}
                >
                  로그아웃
                </BetterAuthActionButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button size="sm" onClick={() => setLoginOpen(true)}>
              로그인
            </Button>
            <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
          </>
        )}
      </div>
    </header>
  );
}
