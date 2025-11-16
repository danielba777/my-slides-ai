import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    TAVILY_API_KEY: z.string(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    OPENAI_API_KEY: z.string(),
    TOGETHER_AI_API_KEY: z.string(),
    THREE02_AI_KEY: z.string().optional(),
    FAL_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    UNSPLASH_ACCESS_KEY: z.string(),
    STRIPE_SECRET_KEY: z.string().min(1, "Missing STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: z.string().min(1, "Missing STRIPE_WEBHOOK_SECRET"),
    STRIPE_PRICE_STARTER_MONTHLY: z
      .string()
      .min(1, "Missing STRIPE_PRICE_STARTER"),
    STRIPE_PRICE_STARTER_YEARLY: z
      .string()
      .min(1, "Missing STRIPE_PRICE_STARTER"),
    STRIPE_PRICE_GROWTH_MONTHLY: z
      .string()
      .min(1, "Missing STRIPE_PRICE_GROWTH"),
    STRIPE_PRICE_GROWTH_YEARLY: z
      .string()
      .min(1, "Missing STRIPE_PRICE_GROWTH"),
    STRIPE_PRICE_SCALE_MONTHLY: z.string().min(1, "Missing STRIPE_PRICE_SCALE"),
    STRIPE_PRICE_SCALE_YEARLY: z.string().min(1, "Missing STRIPE_PRICE_SCALE"),
    STRIPE_PRICE_UNLIMITED_MONTHLY: z
      .string()
      .min(1, "Missing STRIPE_PRICE_UNLIMITED"),
    STRIPE_PRICE_UNLIMITED_YEARLY: z
      .string()
      .min(1, "Missing STRIPE_PRICE_UNLIMITED"),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    ADMIN_ALLOWED_EMAILS: z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      (str) => process.env.VERCEL_URL ?? str,
      process.env.VERCEL ? z.string() : z.string().url(),
    ),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    SLIDESCOCKPIT_API: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_TIKTOK_POST_MODE: z
      .enum(["inbox", "direct_post"])
      .default("inbox"),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TOGETHER_AI_API_KEY: process.env.TOGETHER_AI_API_KEY,
    THREE02_AI_KEY: process.env.THREE02_AI_KEY,
    FAL_KEY: process.env.FAL_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    SLIDESCOCKPIT_API: process.env.SLIDESCOCKPIT_API,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    STRIPE_PRICE_STARTER_YEARLY: process.env.STRIPE_PRICE_STARTER_YEARLY,
    STRIPE_PRICE_GROWTH_MONTHLY: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    STRIPE_PRICE_GROWTH_YEARLY: process.env.STRIPE_PRICE_GROWTH_YEARLY,
    STRIPE_PRICE_SCALE_MONTHLY: process.env.STRIPE_PRICE_SCALE_MONTHLY,
    STRIPE_PRICE_SCALE_YEARLY: process.env.STRIPE_PRICE_SCALE_YEARLY,
    STRIPE_PRICE_UNLIMITED_MONTHLY: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY,
    STRIPE_PRICE_UNLIMITED_YEARLY: process.env.STRIPE_PRICE_UNLIMITED_YEARLY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    ADMIN_ALLOWED_EMAILS: process.env.ADMIN_ALLOWED_EMAILS,
    NEXT_PUBLIC_TIKTOK_POST_MODE: process.env.NEXT_PUBLIC_TIKTOK_POST_MODE,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
