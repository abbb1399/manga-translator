"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { authClient } from "@/lib/auth/auth-client";
import { UserWithRole } from "better-auth/plugins/admin";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserRow({
  user,
  selfId,
}: {
  user: UserWithRole;
  selfId: string;
}) {
  const { refetch } = authClient.useSession();
  const router = useRouter();
  const isSelf = user.id === selfId;

  function handleImpersonateUser(userId: string) {
    authClient.admin.impersonateUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "사용자 가장에 실패했습니다");
        },
        onSuccess: () => {
          refetch();
          router.push("/");
        },
      },
    );
  }

  function handleBanUser(userId: string) {
    authClient.admin.banUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "사용자 정지에 실패했습니다");
        },
        onSuccess: () => {
          toast.success("사용자가 정지되었습니다");
          router.refresh();
        },
      },
    );
  }

  function handleUnbanUser(userId: string) {
    authClient.admin.unbanUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "사용자 정지 해제에 실패했습니다");
        },
        onSuccess: () => {
          toast.success("사용자 정지가 해제되었습니다");
          router.refresh();
        },
      },
    );
  }

  function handleRevokeSessions(userId: string) {
    authClient.admin.revokeUserSessions(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "세션 취소에 실패했습니다");
        },
        onSuccess: () => {
          toast.success("사용자 세션이 취소되었습니다");
        },
      },
    );
  }

  function handleRemoveUser(userId: string) {
    authClient.admin.removeUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "사용자 삭제에 실패했습니다");
        },
        onSuccess: () => {
          toast.success("사용자가 삭제되었습니다");
          router.refresh();
        },
      },
    );
  }

  return (
    <TableRow key={user.id}>
      <TableCell>
        <div>
          <div className="font-medium">{user.name || "이름 없음"}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <div className="flex items-center gap-2 not-empty:mt-2">
            {user.banned && <Badge variant="destructive">정지됨</Badge>}
            {!user.emailVerified && <Badge variant="outline">미인증</Badge>}
            {isSelf && <Badge>나</Badge>}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>
        {new Date(user.createdAt).toLocaleDateString("ko-KR", {
          timeZone: "Asia/Seoul",
        })}
      </TableCell>
      <TableCell>
        {!isSelf && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => handleImpersonateUser(user.id)}
                >
                  사용자 가장
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRevokeSessions(user.id)}>
                  세션 취소
                </DropdownMenuItem>
                {user.banned ? (
                  <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                    정지 해제
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleBanUser(user.id)}>
                    정지
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />

                <AlertDialogTrigger asChild>
                  <DropdownMenuItem variant="destructive">
                    사용자 삭제
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>사용자 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수
                  없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleRemoveUser(user.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TableCell>
    </TableRow>
  );
}
