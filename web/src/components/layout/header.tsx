"use client";

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth/auth-client";
import Link from "next/link";

export function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className="border-b px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        Manga Translator
      </Link>
      <div className="flex items-center">
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session.user.image ?? undefined}
                    alt={session.user.name}
                  />
                  <AvatarFallback>{session.user.name[0]}</AvatarFallback>
                </Avatar>
              </Button>
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
                  action={() => authClient.signOut()}
                >
                  로그아웃
                </BetterAuthActionButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm">
            <Link href="/auth/login">로그인</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
