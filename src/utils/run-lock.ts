import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const lockDirectory = path.resolve(".prospector-lock");
const ownerFile = path.join(lockDirectory, "owner.json");

async function reclaimOrphanedLock(): Promise<boolean> {
  let owner: { pid?: number; runLockId?: string };
  try {
    owner = JSON.parse(await fs.readFile(ownerFile, "utf8")) as { pid?: number; runLockId?: string };
  } catch {
    return false;
  }
  if (!Number.isInteger(owner.pid) || !owner.runLockId) return false;

  try {
    process.kill(owner.pid!, 0);
    return false;
  } catch (error) {
    if ((error as { code?: string }).code !== "ESRCH") return false;
  }

  await fs.rm(lockDirectory, { recursive: true, force: false });
  return true;
}

export async function acquireRunLock(): Promise<() => Promise<void>> {
  try { await fs.mkdir(lockDirectory); }
  catch (error) {
    if ((error as { code?: string }).code !== "EEXIST") throw error;
    const reclaimed = await reclaimOrphanedLock();
    if (!reclaimed) throw new Error("Já existe uma execução local do Prospector neste checkout. Confira `.prospector-lock/` antes de tentar novamente.");
    try { await fs.mkdir(lockDirectory); }
    catch { throw new Error("Não foi possível adquirir o lock local; outra execução pode ter iniciado ao mesmo tempo."); }
  }
  const runLockId = randomUUID();
  await fs.writeFile(ownerFile, JSON.stringify({ pid: process.pid, runLockId, startedAt: new Date().toISOString() }), "utf8");
  return async () => {
    try {
      const owner = JSON.parse(await fs.readFile(ownerFile, "utf8")) as { runLockId?: string };
      if (owner.runLockId === runLockId) await fs.rm(lockDirectory, { recursive: true, force: true });
    } catch { /* keep unexpected lock state for manual inspection */ }
  };
}
