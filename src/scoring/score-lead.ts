import { DEFAULT_WEIGHTS } from "../config/constants.js";
import type { Lead, Prospect, WebsiteInspection, SearchConfig } from "../types/business.js";
import { hasOwnDomain } from "../enrichment/detect-domain.js";
import { DEFAULT_PRIORITY } from "../config/constants.js";
import type { PriorityThresholds } from "./read-weights.js";

export type ScoreWeights = typeof DEFAULT_WEIGHTS;

export function scoreLead(prospect: Prospect, inspection: WebsiteInspection | null, search: SearchConfig, weights: ScoreWeights = DEFAULT_WEIGHTS, now = new Date(), thresholds: PriorityThresholds = DEFAULT_PRIORITY): Lead {
  const ownDomain = hasOwnDomain(prospect.website);
  let score = 0;
  if (prospect.isAdvertisement === true) score += weights.googleAds;
  if (!prospect.website) score += weights.badOrMissingSite;
  if (prospect.reviewCount !== null && prospect.reviewCount >= 50) score += weights.reviews50Plus;
  if (inspection?.hasWhatsappLink) score += weights.whatsappAvailable;
  if (search.highValue === "Sim") score += weights.highValueProduct;
  const priorityLabel = score >= thresholds.priority ? "PRIORIDADE" : score >= thresholds.high ? "ALTO" : score >= thresholds.medium ? "MÉDIO" : "BAIXO";
  let problem = "Revisar presença digital manualmente.";
  if (prospect.isAdvertisement === true && !prospect.website) problem = "Encontrado como anúncio no Google Maps e não possui site informado no perfil.";
  else if ((prospect.reviewCount ?? 0) >= 50 && !prospect.website) problem = `Empresa com ${prospect.reviewCount} avaliações no Google, mas sem site informado no perfil.`;
  else if (prospect.website && inspection?.reachable && !inspection.hasWhatsappLink) problem = "Possui site, mas nenhum acesso direto ao WhatsApp foi encontrado na página inicial.";
  else if (prospect.website && inspection?.reachable && !inspection.hasViewport) problem = "A página inicial não possui meta viewport detectável, indicando necessidade de revisão mobile.";
  let offer: Lead["offer"] = "Avaliar";
  if (!prospect.website && prospect.isAdvertisement === true) offer = "Captação";
  else if (!prospect.website && prospect.isAdvertisement !== true) offer = "Presença";
  else if (prospect.website && prospect.isAdvertisement === true) offer = "Captação";
  return { ...prospect, inspection, hasOwnDomain: ownDomain, problem, score, priorityLabel, offer, discoveredAt: now };
}
