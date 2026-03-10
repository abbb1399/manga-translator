"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth/auth-client";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { CreateInviteButton } from "./create-invite-button";

export function InvitesTab() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const pendingInvites = activeOrganization?.invitations?.filter(
    (invite) => invite.status === "pending",
  );

  function cancelInvitation(invitationId: string) {
    return authClient.organization.cancelInvitation({ invitationId });
  }

  return (
    <div className="space-y-4">
      <div className="justify-end flex">
        <CreateInviteButton />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이메일</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>만료일</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingInvites?.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell>{invitation.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{invitation.role}</Badge>
              </TableCell>
              <TableCell>
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <BetterAuthActionButton
                  variant="destructive"
                  size="sm"
                  action={() => cancelInvitation(invitation.id)}
                >
                  취소
                </BetterAuthActionButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
