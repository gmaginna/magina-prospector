import "dotenv/config";
import fs from "node:fs";
import { z } from "zod";

const schema = z.object({
  APIFY_TOKEN: z.string().min(1),
  GOOGLE_SHEET_ID: z.string().min(1),
  GOOGLE_SERVICE_ACCOUNT_FILE: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON_B64: z.string().optional(),
  MAX_SEARCHES_PER_RUN: z.coerce.number().int().positive().max(4).default(4),
  MAX_RESULTS_PER_SEARCH: z.coerce.number().int().positive().max(20).default(20),
  MAX_NEW_LEADS_PER_RUN: z.coerce.number().int().positive().max(100).default(30),
  WEBSITE_CONCURRENCY: z.coerce.number().int().positive().max(5).default(5),
  HTTP_TIMEOUT_MS: z.coerce.number().int().positive().max(10_000).default(10_000),
  AUTOMATION_VERSION: z.string().default("1.0.0"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ENABLE_GOOGLE_ADS_ENRICHMENT: z.string().default("false"),
  ENABLE_META_ADS_ENRICHMENT: z.string().default("false"),
}).superRefine((value, ctx) => {
  if (!value.GOOGLE_SERVICE_ACCOUNT_FILE && !value.GOOGLE_SERVICE_ACCOUNT_JSON_B64) {
    ctx.addIssue({ code: "custom", message: "Configure GOOGLE_SERVICE_ACCOUNT_JSON_B64 ou GOOGLE_SERVICE_ACCOUNT_FILE" });
  }
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  const env = schema.parse(process.env);
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON_B64) {
    try { JSON.parse(Buffer.from(env.GOOGLE_SERVICE_ACCOUNT_JSON_B64, "base64").toString("utf8")); }
    catch { throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON_B64 não contém um JSON válido em base64"); }
  } else if (!fs.existsSync(env.GOOGLE_SERVICE_ACCOUNT_FILE!)) {
    throw new Error(`Arquivo de service account não encontrado: ${env.GOOGLE_SERVICE_ACCOUNT_FILE}`);
  }
  return env;
}
