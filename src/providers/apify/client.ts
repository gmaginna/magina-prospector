import { ApifyClient } from "apify-client";
import type { Env } from "../../config/env.js";
import { ACTOR_ID } from "../../config/constants.js";
import type { SearchConfig } from "../../types/business.js";

export type RawApifyPlace = Record<string, unknown>;
export type ApifySearchResult = { runId: string; items: RawApifyPlace[] };

export class ApifyPlacesProvider {
  private readonly client: ApifyClient;
  constructor(env: Env) { this.client = new ApifyClient({ token: env.APIFY_TOKEN }); }

  async search(search: SearchConfig, limit: number): Promise<ApifySearchResult> {
    const run = await this.client.actor(ACTOR_ID).call({
      searchStringsArray: [search.niche],
      locationQuery: `${search.city}, ${search.state}, Brazil`.replace(/^,\s*/, "").replace(/,\s*,/g, ","),
      maxCrawledPlacesPerSearch: Math.max(1, Math.min(search.maxResults, limit)),
      language: "pt-BR",
      skipClosedPlaces: true,
      maximumLeadsEnrichmentRecords: 0,
      maxCompetitorsToAnalyze: 0,
    });
    if (!run.defaultDatasetId) throw new Error(`Apify run ${run.id} não retornou dataset padrão.`);
    const response = await this.client.dataset(run.defaultDatasetId).listItems({ limit });
    return { runId: run.id, items: response.items as RawApifyPlace[] };
  }
}
