import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth/auth";
import {
  ArrowLeft,
  Key,
  LinkIcon,
  Loader2Icon,
  Trash2,
  User,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";
// import { ProfileUpdateForm } from "./_components/profile-update-form";
// import { ChangePasswordForm } from "./_components/change-password-form";
// import { SetPasswordButton } from "./_components/set-password-buttont";
import { SessionManagement } from "./_components/session-management";
import { AccountLinking } from "./_components/account-linking";
import { AccountDeletion } from "./_components/account-deletion";
// import { TwoFactorAuth } from "./_components/two-factor-auth";
// import { PasskeyManagement } from "./_components/passkey-management";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session == null) return redirect("/auth/login");

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center mb-6">
          <ArrowLeft className="size-4 mr-2" />
          홈으로
        </Link>

        <div className="flex items-center space-x-4">
          <div className="size-16 bg-muted rounded-full flex items-center justify-center overflow-hidden">
            {session.user.image ? (
              <Image
                width={64}
                height={64}
                src={session.user.image}
                alt="User Avatar"
                className="object-cover"
              />
            ) : (
              <User className="size-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex gap-1 justify-between items-start">
              <h1 className="text-3xl font-bold">
                {session.user.name || "유저 프로필"}
              </h1>
              {/* <Badge>{session.user.role}</Badge> */}
            </div>
            <p className="text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
      </div>

      <Tabs className="space-y-2" defaultValue="profile">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <User />
            <span className="max-sm:hidden">프로필</span>
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Key />
            <span className="max-sm:hidden">세션</span>
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <LinkIcon />
            <span className="max-sm:hidden">계정</span>
          </TabsTrigger>
          <TabsTrigger value="danger">
            <Trash2 />
            <span className="max-sm:hidden">계정 삭제</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent>
              {/* <ProfileUpdateForm user={session.user} /> */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <LoadingSuspense>
            <SessionsTab currentSessionToken={session.session.token} />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value="accounts">
          <LoadingSuspense>
            <LinkedAccountsTab />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                삭제하면 되돌릴 수 없습니다.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AccountDeletion />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function LinkedAccountsTab() {
  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });
  const nonCredentialAccounts = accounts.filter(
    (a) => a.providerId !== "credential",
  );

  return (
    <Card>
      <CardContent>
        <AccountLinking currentAccounts={nonCredentialAccounts} />
      </CardContent>
    </Card>
  );
}
async function SessionsTab({
  currentSessionToken,
}: {
  currentSessionToken: string;
}) {
  const sessions = await auth.api.listSessions({ headers: await headers() });

  return (
    <Card>
      <CardContent>
        <SessionManagement
          sessions={sessions}
          currentSessionToken={currentSessionToken}
        />
      </CardContent>
    </Card>
  );
}

function LoadingSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loader2Icon className="size-20 animate-spin" />}>
      {children}
    </Suspense>
  );
}
