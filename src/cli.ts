import { loadEnv } from "./config/env.js";
import { SheetsClient } from "./sheets/client.js";
import { validateSheet } from "./sheets/validate-sheet.js";
import { bootstrapSheet } from "./sheets/bootstrap-sheet.js";
import { prospect } from "./jobs/prospect.js";
import { acquireRunLock } from "./utils/run-lock.js";
import { hasOption, optionValue } from "./utils/cli-options.js";

async function main(): Promise<void> {
  const command = process.argv[2] ?? "prospect";
  const env = loadEnv();
  const sheets = await SheetsClient.create(env);
  if (command === "validate-sheet") {
    await validateSheet(sheets);
    return;
  }
  if (command === "bootstrap-sheet") {
    const created = await bootstrapSheet(sheets);
    console.log(created.length ? `Bootstrap concluído: ${created.join("; ")}` : "Abas e colunas de rotação já estão prontas; nenhuma alteração foi necessária.");
    return;
  }
  if (command !== "prospect") throw new Error(`Comando desconhecido: ${command}`);
  await validateSheet(sheets);
  const args = process.argv.slice(2);
  const maxOption = optionValue("--max-new-leads", args);
  const maxNewLeads = maxOption ? Number(maxOption) : undefined;
  if (maxNewLeads !== undefined && (!Number.isInteger(maxNewLeads) || maxNewLeads < 1)) throw new Error("--max-new-leads deve ser um inteiro positivo.");
  const resultsOption = optionValue("--max-results", args);
  const maxResults = resultsOption ? Number(resultsOption) : undefined;
  if (maxResults !== undefined && (!Number.isInteger(maxResults) || maxResults < 1)) throw new Error("--max-results deve ser um inteiro positivo.");
  const release = await acquireRunLock();
  try {
    await prospect(sheets, env, {
      dryRun: hasOption("--dry-run", args), maxNewLeads, maxResults,
      city: optionValue("--city", args), niche: optionValue("--niche", args),
    });
  }
  finally { await release(); }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Falha inesperada.";
  console.error(`Magina Prospector falhou: ${message}`);
  process.exitCode = 1;
});
