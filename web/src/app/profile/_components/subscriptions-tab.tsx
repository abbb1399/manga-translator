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
import { PLAN_TO_PRICE, STRIPE_PLANS } from "@/lib/auth/stripe";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function SubscriptionsTab() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    if (activeOrganization == null) return;

    authClient.subscription
      .list({ query: { referenceId: activeOrganization.id } })
      .then((result) => {
        if (result.error) {
          setSubscriptions([]);
          toast.error("구독 정보를 불러오는데 실패했습니다.");
          return;
        }

        setSubscriptions(result.data);
      });
  }, [activeOrganization]);

  const displayedSubscriptions = activeOrganization ? subscriptions : [];

  const activeSubscription = displayedSubscriptions.find(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );
  const activePlan = STRIPE_PLANS.find(
    (plan) => plan.name === activeSubscription?.plan,
  );

  async function handleBillingPortal() {
    if (activeOrganization == null) {
      return { error: { message: "속한 조직이 없습니다." } };
    }

    const res = await authClient.subscription.billingPortal({
      referenceId: activeOrganization.id,
      returnUrl: window.location.href,
    });

    if (res.error == null) {
      window.location.href = res.data.url;
    }

    return res;
  }

  function handleCancelSubscription() {
    if (activeOrganization == null) {
      return Promise.resolve({ error: { message: "속한 조직이 없습니다." } });
    }

    if (activeSubscription == null) {
      return Promise.resolve({ error: { message: "속한 구독이 없습니다." } });
    }

    return authClient.subscription.cancel({
      subscriptionId: activeSubscription.id,
      referenceId: activeOrganization.id,
      returnUrl: window.location.href,
    });
  }

  function handleSubscriptionChange(plan: string) {
    if (activeOrganization == null) {
      return Promise.resolve({ error: { message: "속한 조직이 없습니다." } });
    }

    return authClient.subscription.upgrade({
      plan,
      subscriptionId: activeSubscription?.id,
      referenceId: activeOrganization.id,
      returnUrl: window.location.href,
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    });
  }

  return (
    <div className="space-y-6">
      {activeSubscription && activePlan && (
        <Card>
          <CardHeader>
            <CardTitle>현재 구독</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold capitalize">
                    {activeSubscription.plan} Plan
                  </h3>
                  {activeSubscription.priceId && (
                    <Badge variant="secondary">
                      {currencyFormatter.format(
                        PLAN_TO_PRICE[activeSubscription.plan],
                      )}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activePlan.limits.projects}개 프로젝트 포함
                </p>
                {activeSubscription.periodEnd && (
                  <p className="text-sm text-muted-foreground">
                    {activeSubscription.cancelAtPeriodEnd
                      ? "취소 예정일: "
                      : "갱신 예정일: "}
                    {activeSubscription.periodEnd.toLocaleDateString()}
                  </p>
                )}
              </div>
              <BetterAuthActionButton
                variant="outline"
                action={handleBillingPortal}
                className="flex items-center gap-2"
              >
                결제 포털
              </BetterAuthActionButton>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {STRIPE_PLANS.map((plan) => (
          <Card key={plan.name} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl capitalize">
                  {plan.name}
                </CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {currencyFormatter.format(PLAN_TO_PRICE[plan.name])}
                  </div>
                </div>
              </div>
              <CardDescription>
                최대 {plan.limits.projects}개 프로젝트
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeSubscription?.plan === plan.name ? (
                activeSubscription.cancelAtPeriodEnd ? (
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
        ))}
      </div>
    </div>
  );
}
