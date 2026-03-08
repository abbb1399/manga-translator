"use client";

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const { data: session } = authClient.useSession();

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
                  action={() => authClient.signOut()}
                >
                  로그아웃
                </BetterAuthActionButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">로그인</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>로그인</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <SocialAuthButtons />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  );
}
