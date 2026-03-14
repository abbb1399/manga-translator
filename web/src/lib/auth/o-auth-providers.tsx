import { DiscordIcon, GitHubIcon, GoogleIcon, KakaoIcon } from "@/components/auth/o-auth-icons";
import { ComponentProps, ElementType } from "react";

export const SUPPORTED_OAUTH_PROVIDERS = ["github", "discord", "google", "kakao"] as const;
export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

export const SUPPORTED_OAUTH_PROVIDER_DETAILS: Record<
  SupportedOAuthProvider,
  {
    name: string;
    Icon: ElementType<ComponentProps<"svg">>;
  }
> = {
  discord: {
    name: "Discord",
    Icon: DiscordIcon,
  },
  github: {
    name: "GitHub",
    Icon: GitHubIcon,
  },
  google: {
    name: "Google",
    Icon: GoogleIcon,
  },
  kakao: {
    name: "카카오",
    Icon: KakaoIcon,
  },
};
