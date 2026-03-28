import { Orchestrator } from "../features/disc-golf/orchestrator";

const registry = new Map<number, Orchestrator[]>();

export function add(chatId: number, orchestrator: Orchestrator): void {
  if (!registry.has(chatId)) registry.set(chatId, []);
  registry.get(chatId)!.push(orchestrator);
}

export function getActive(chatId: number): Orchestrator[] {
  const active = (registry.get(chatId) ?? []).filter(o => o.following);
  registry.set(chatId, active);
  return active;
}

export function find(chatId: number, competitionId: string | number): Orchestrator | undefined {
  return getActive(chatId).find(o => o.id === parseInt(String(competitionId)));
}

export function remove(chatId: number, competitionId: string | number): boolean {
  const active = getActive(chatId);
  const idx = active.findIndex(o => o.id === parseInt(String(competitionId)));
  if (idx === -1) return false;
  active[idx].stopFollowing();
  active.splice(idx, 1);
  registry.set(chatId, active);
  return true;
}
