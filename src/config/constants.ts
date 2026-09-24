export const ACTOR_ID = "compass/crawler-google-places";
export const TAB = { plans: "Planos", leads: "Leads", search: "Busca", config: "Configuração", evidence: "Evidências", automation: "Automação" } as const;
export const USER_AGENT = "MaginaProspector/1.0 (+https://maginalabs.netlify.app/)";
export const DEFAULT_WEIGHTS = {
  googleAds: 4, metaAds: 2, adNotSpecific: 2, badOrMissingSite: 2,
  reviews50Plus: 2, instagramActive: 1, whatsappAvailable: 1, highValueProduct: 2,
};
export const DEFAULT_PRIORITY = { priority: 13, high: 9, medium: 6 };
