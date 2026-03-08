"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <SocialAuthButtons />
        </div>
      </DialogContent>
    </Dialog>
  );
}
