import { StripePlan } from "@better-auth/stripe";

export const FREE_PLAN_PAGES = 10;

export const PLAN_CONFIG = {
  free: {
    pages: FREE_PLAN_PAGES,
    price: 0,
  },
  basic: {
    pages: 100,
    price: 9,
  },
  pro: {
    pages: 500,
    price: 19,
  },
} as const;

export const STRIPE_PLANS = [
  {
    name: "basic",
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
    limits: {
      pages: PLAN_CONFIG.basic.pages,
    },
  },
  {
    name: "pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    limits: {
      pages: PLAN_CONFIG.pro.pages,
    },
  },
] as const satisfies StripePlan[];

export const PLAN_TO_PRICE: Record<string, number> = {
  free: PLAN_CONFIG.free.price,
  basic: PLAN_CONFIG.basic.price,
  pro: PLAN_CONFIG.pro.price,
};
