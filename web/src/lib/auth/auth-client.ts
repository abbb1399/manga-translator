import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { ac, admin, user } from "@/components/auth/permissions";

export const authClient = createAuthClient({
  plugins: [
    organizationClient(),
    adminClient({
      ac,
      roles: {
        admin,
        user,
      },
    }),
    stripeClient({
      subscription: true,
    }),
  ],
});
