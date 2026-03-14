"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { useEffect, useState } from "react";
import { Subscription } from "@better-auth/stripe";
import { toast } from "sonner";
import { PLAN_CONFIG, PLAN_TO_PRICE, STRIPE_PLANS } from "@/lib/auth/stripe";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type UsageInfo = {
  used: number;
  limit: number;
  plan: string;
  remaining: number;
};


export function SubscriptionsTab() {
  const { data: session } = authClient.useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  useEffect(() => {
    if (session == null) return;

    // 구독 정보: 개인 사용자 기준 (referenceId = userId)
    authClient.subscription
      .list({ query: { referenceId: session.user.id } })
      .then((result) => {
        if (result.error) {
          setSubscriptions([]);
          return;
        }
        setSubscriptions(result.data);
      });

    // 이번 달 사용량 조회
    fetch("/api/translate")
      .then((r) => r.json())
      .then((data) => {
        if (data.used !== undefined) setUsage(data);
      })
      .catch(() => {});
  }, [session]);

  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );
  const activePlanName = (activeSubscription?.plan ?? "free") as keyof typeof PLAN_CONFIG;
  const activePlanConfig = PLAN_CONFIG[activePlanName] ?? PLAN_CONFIG.free;

  async function handleBillingPortal() {
    if (!session) return { error: { message: "로그인이 필요합니다." } };

    const res = await authClient.subscription.billingPortal({
      referenceId: session.user.id,
      returnUrl: window.location.href,
    });

    if (res.error == null) {
      window.location.href = res.data.url;
    }

    return res;
  }

  function handleCancelSubscription() {
    if (!session) {
      return Promise.resolve({ error: { message: "로그인이 필요합니다." } });
    }
    if (!activeSubscription) {
      return Promise.resolve({ error: { message: "활성 구독이 없습니다." } });
    }

    return authClient.subscription.cancel({
      subscriptionId: activeSubscription.id,
      referenceId: session.user.id,
      returnUrl: window.location.href,
    });
  }

  function handleSubscriptionChange(plan: string) {
    if (!session) {
      return Promise.resolve({ error: { message: "로그인이 필요합니다." } });
    }

    return authClient.subscription.upgrade({
      plan,
      subscriptionId: activeSubscription?.id,
      referenceId: session.user.id,
      returnUrl: window.location.href,
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    });
  }

  const usedPages = usage?.used ?? 0;
  const limitPages = usage?.limit ?? activePlanConfig.pages;
  const usagePercent = Math.min(100, Math.round((usedPages / limitPages) * 100));

  return (
    <div className="space-y-6">
      {/* 현재 구독 + 사용량 */}
      <Card>
        <CardHeader>
          <CardTitle>현재 플랜</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold capitalize">
                  {activePlanName} Plan
                </h3>
                <Badge variant={activePlanName === "free" ? "secondary" : "default"}>
                  {activePlanName === "free"
                    ? "무료"
                    : currencyFormatter.format(PLAN_TO_PRICE[activePlanName]) + "/월"}
                </Badge>
              </div>
{activeSubscription?.periodEnd && (
                <p className="text-sm text-muted-foreground">
                  {activeSubscription.cancelAtPeriodEnd
                    ? "취소 예정일: "
                    : "갱신 예정일: "}
                  {activeSubscription.periodEnd.toLocaleDateString()}
                </p>
              )}
            </div>
            {activeSubscription && (
              <BetterAuthActionButton
                variant="outline"
                action={handleBillingPortal}
                className="flex items-center gap-2"
              >
                결제 포털
              </BetterAuthActionButton>
            )}
          </div>

          {/* 이번 달 사용량 */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">이번 달 번역</span>
              <span className="font-medium">
                {usedPages} / {limitPages}장
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 플랜 선택 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Free 플랜 */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Free</CardTitle>
              <div className="text-2xl font-bold">$0</div>
            </div>
            <CardDescription>매월 {PLAN_CONFIG.free.pages}장</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePlanName === "free" ? (
              <Button disabled variant="outline" className="w-full">
                현재 플랜
              </Button>
            ) : (
              <BetterAuthActionButton
                variant="outline"
                className="w-full"
                action={handleCancelSubscription}
              >
                다운그레이드
              </BetterAuthActionButton>
            )}
          </CardContent>
        </Card>

        {/* Basic / Pro 플랜 */}
        {STRIPE_PLANS.map((plan) => {
          const config = PLAN_CONFIG[plan.name as keyof typeof PLAN_CONFIG];
          const isActive = activePlanName === plan.name;
          return (
            <Card key={plan.name} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl capitalize">
                    {plan.name}
                  </CardTitle>
                  <div className="text-2xl font-bold">
                    {currencyFormatter.format(PLAN_TO_PRICE[plan.name])}
                    <span className="text-sm font-normal text-muted-foreground">
                      /월
                    </span>
                  </div>
                </div>
                <CardDescription>매월 {config.pages}장</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isActive ? (
                  activeSubscription?.cancelAtPeriodEnd ? (
                    <Button disabled variant="outline" className="w-full">
                      현재 플랜
                    </Button>
                  ) : (
                    <BetterAuthActionButton
                      variant="destructive"
                      className="w-full"
                      action={handleCancelSubscription}
                    >
                      구독 취소
                    </BetterAuthActionButton>
                  )
                ) : (
                  <BetterAuthActionButton
                    action={() => handleSubscriptionChange(plan.name)}
                    className="w-full"
                  >
                    {activeSubscription == null ? "구독하기" : "플랜 변경"}
                  </BetterAuthActionButton>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
