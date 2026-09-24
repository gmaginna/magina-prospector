import { createHash } from "node:crypto";
import type { Prospect } from "../types/business.js";
import { normalizePhone, normalizeText } from "./normalize.js";

export function fallbackHash(input: Pick<Prospect, "companyName" | "phone" | "city">): string {
  const source = [normalizeText(input.companyName), normalizePhone(input.phone), normalizeText(input.city)].join("|");
  return createHash("sha256").update(source).digest("hex");
}

export function dedupeKey(input: Pick<Prospect, "placeId" | "dedupeHash">): string {
  return input.placeId ? `place:${input.placeId}` : `hash:${input.dedupeHash}`;
}
