import type { Lead } from "../types/business.js";
import { EVIDENCE_HEADERS } from "../types/sheet.js";
import { formatDate } from "../utils/date.js";
import { quoteSheet, type SheetsClient } from "./client.js";

export type EvidenceRow = (string | number)[];

export function evidenceFor(lead: Lead, verifiedAt = new Date()): EvidenceRow[] {
  const rows: EvidenceRow[] = [];
  const add = (field: string, value: string | number, source: string, url: string | null, confidence: string, note: string) =>
    rows.push([lead.placeId ?? "", lead.companyName, field, value, source, url ?? "", formatDate(verifiedAt), confidence, note]);
  if (lead.website) add("Website", lead.website, "Google Maps / Apify", lead.mapsUrl, "Alta", "URL informado no perfil do Google Maps");
  else add("Tem site?", "Não", "Google Maps / Apify", lead.mapsUrl, "Alta", "Perfil não informou website");
  if (lead.phone) add("Telefone", lead.phone, "Google Maps / Apify", lead.mapsUrl, "Alta", "Telefone comercial informado no perfil");
  if (lead.reviewCount !== null) add("Avaliações no Google", lead.reviewCount, "Google Maps / Apify", lead.mapsUrl, "Alta", "reviewsCount retornado pelo Actor");
  if (lead.isAdvertisement === true) add("Anuncia no Google?", "Sim", "Google Maps / Apify", lead.mapsUrl, "Alta", "isAdvertisement=true");
  if (lead.hasOwnDomain !== null) add("Tem domínio próprio?", lead.hasOwnDomain ? "Sim" : "Não", lead.website ? "Website" : "Google Maps / Apify", lead.inspection?.finalUrl ?? lead.mapsUrl, lead.website ? "Alta" : "Média", lead.website ? "Domínio verificado via tldts" : "Sem website informado no perfil");
  if (lead.inspection?.reachable) {
    add("WhatsApp fácil?", lead.inspection.hasWhatsappLink ? "Sim" : "Não", "Website", lead.inspection.finalUrl, "Alta", lead.inspection.hasWhatsappLink ? "Link wa.me / api.whatsapp.com detectado" : "Nenhum link de WhatsApp detectado na homepage");
    if (!lead.inspection.hasViewport) add("Funciona bem no celular?", "Não", "Website", lead.inspection.finalUrl, "Alta", "meta viewport ausente na homepage");
    if (lead.inspection.instagramUrl) add("Instagram", lead.inspection.instagramUrl, "Website", lead.inspection.finalUrl, "Alta", "Link de Instagram encontrado na homepage");
  }
  if (lead.instagram) add("Instagram", lead.instagram, "Google Maps / Apify", lead.mapsUrl, "Alta", "Perfil social fornecido pelo Actor");
  add("Problema encontrado", lead.problem, lead.mapsUrl ? "Google Maps / Website" : "Website", lead.inspection?.finalUrl ?? lead.mapsUrl, "Média", "Gerado por regra determinística com os fatos acima");
  return rows;
}

export async function writeEvidence(sheets: SheetsClient, rows: EvidenceRow[][]): Promise<void> {
  if (!rows.length) return;
  const used = (await sheets.read(`${quoteSheet("Evidências")}!A1:I`)).length;
  if (used === 0) await sheets.write(`${quoteSheet("Evidências")}!A1`, [EVIDENCE_HEADERS]);
  const existingRows = await sheets.read(`${quoteSheet("Evidências")}!A1:I`);
  const key = (row: EvidenceRow | string[]) => row.slice(0, 6).map((cell) => String(cell ?? "").trim()).join("|");
  const known = new Set(existingRows.slice(1).map(key));
  const pending = rows.flat().filter((row) => !known.has(key(row)));
  if (pending.length) await sheets.append(`${quoteSheet("Evidências")}!A:I`, pending);
}
