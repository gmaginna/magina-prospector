export type SearchConfig = {
  niche: string;
  city: string;
  state: string;
  maxResults: number;
  highValue: "Sim" | "Não" | "Não sei";
  priority: number;
  notes: string;
  query: string;
};

export type Prospect = {
  placeId: string | null;
  dedupeHash: string;
  companyName: string;
  city: string | null;
  state: string | null;
  niche: string;
  website: string | null;
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  mapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  isAdvertisement: boolean | null;
  permanentlyClosed: boolean;
  temporarilyClosed: boolean;
  sourceQuery: string;
  rawSource: "google_maps";
};

export type WebsiteInspection = {
  reachable: boolean;
  statusCode: number | null;
  finalUrl: string | null;
  hasHttps: boolean;
  hasViewport: boolean;
  hasWhatsappLink: boolean;
  whatsappLinks: string[];
  hasTelLink: boolean;
  hasForm: boolean;
  instagramUrl: string | null;
  facebookUrl: string | null;
  title: string | null;
  error: string | null;
};

export type Lead = Prospect & {
  inspection: WebsiteInspection | null;
  hasOwnDomain: boolean | null;
  problem: string;
  score: number;
  priorityLabel: string;
  offer: "Captação" | "Presença" | "Avaliar";
  discoveredAt: Date;
};
