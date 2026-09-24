import type { Prospect, SearchConfig } from "../../types/business.js";
import { asNullableNumber, asNullableString, normalizeText } from "../../utils/normalize.js";
import { fallbackHash } from "../../utils/hash.js";
import type { RawApifyPlace } from "./client.js";

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const direct = asNullableString(value);
    if (direct) return direct;
    if (Array.isArray(value)) {
      const item = value.find((part) => typeof part === "string" && part.trim());
      if (item) return String(item).trim();
    }
  }
  return null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function mapPlace(raw: RawApifyPlace, search: SearchConfig): Prospect | null {
  const companyName = firstString(raw.title, raw.name);
  if (!companyName) return null;
  const address = firstString(raw.address, raw.fullAddress) ?? "";
  const city = firstString(raw.city, raw.cityName) ?? search.city;
  const state = firstString(raw.state, raw.stateName) ?? search.state ?? null;
  const normalizedCity = normalizeText(city);
  const expectedCity = normalizeText(search.city);
  if (normalizedCity && expectedCity && normalizedCity !== expectedCity && !normalizedCity.includes(expectedCity)) return null;
  const phone = firstString(raw.phoneUnformatted, raw.phone);
  const prospect: Prospect = {
    placeId: firstString(raw.placeId, raw.place_id), dedupeHash: "", companyName,
    city: city ?? (address ? search.city : null), state, niche: search.niche,
    website: firstString(raw.website, raw.websiteUrl), phone,
    instagram: firstString(raw.instagram, raw.instagramUrl, raw.instagrams),
    facebook: firstString(raw.facebook, raw.facebookUrl, raw.facebooks),
    mapsUrl: firstString(raw.url, raw.googleMapsUrl, raw.mapsUrl),
    rating: asNullableNumber(raw.totalScore ?? raw.rating),
    reviewCount: asNullableNumber(raw.reviewsCount ?? raw.reviewCount),
    isAdvertisement: booleanOrNull(raw.isAdvertisement),
    permanentlyClosed: raw.permanentlyClosed === true,
    temporarilyClosed: raw.temporarilyClosed === true,
    sourceQuery: search.query,
    rawSource: "google_maps",
  };
  prospect.dedupeHash = fallbackHash(prospect);
  return prospect;
}
