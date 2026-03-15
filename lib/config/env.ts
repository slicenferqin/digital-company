import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  TAVILY_API_KEY: z.string().min(1).optional(),
  EXA_API_KEY: z.string().min(1).optional()
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    EXA_API_KEY: process.env.EXA_API_KEY
  });

  return cachedEnv;
}
