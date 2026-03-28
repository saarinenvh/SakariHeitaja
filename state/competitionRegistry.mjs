/**
 * CompetitionRegistry — replaces the raw global `competitionsToFollow` object.
 *
 * Keyed by chatId → array of Orchestrator instances.
 */
const registry = new Map();

export function add(chatId, orchestrator) {
  if (!registry.has(chatId)) registry.set(chatId, []);
  registry.get(chatId).push(orchestrator);
}

export function getActive(chatId) {
  const all = registry.get(chatId) || [];
  const active = all.filter(o => o.following);
  registry.set(chatId, active);
  return active;
}

export function getAll() {
  return registry;
}

export function find(chatId, competitionId) {
  return getActive(chatId).find(o => o.id === parseInt(competitionId));
}

export function remove(chatId, competitionId) {
  const active = getActive(chatId);
  const idx = active.findIndex(o => o.id === parseInt(competitionId));
  if (idx === -1) return false;
  active[idx].stopFollowing();
  active.splice(idx, 1);
  registry.set(chatId, active);
  return true;
}
