import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { TrackedPlayer } from "../../types/metrix";
import Logger from "js-logger";

const PROFILES_PATH = join(__dirname, "../../bot/system-prompts/player_profiles.json");

export interface PlayerProfile {
  nickname?: string;
  knownFor?: string;
  recentForm: "hot" | "cold" | "steady";
  gamesPlayed: number;
  avgPositionPct: number;
  lastUpdated: string;
}

type ProfileStore = Record<string, Record<string, PlayerProfile>>;

function load(): ProfileStore {
  if (!existsSync(PROFILES_PATH)) return {};
  try {
    return JSON.parse(readFileSync(PROFILES_PATH, "utf-8"));
  } catch {
    Logger.warn("player_profiles.json is corrupted, starting fresh");
    return {};
  }
}

function save(store: ProfileStore): void {
  writeFileSync(PROFILES_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function getProfile(chatId: number, name: string): PlayerProfile | undefined {
  return load()[String(chatId)]?.[name];
}

export function buildProfileSnippet(chatId: number, name: string): string | undefined {
  const profile = getProfile(chatId, name);
  if (!profile) return undefined;

  const parts: string[] = [];

  if (profile.nickname) parts.push(`lempinimeltään ${profile.nickname}`);
  if (profile.knownFor) parts.push(profile.knownFor);

  if (profile.gamesPlayed >= 3) {
    const pct = profile.avgPositionPct;
    if (pct < 0.25)      parts.push("tyypillisesti kärjessä");
    else if (pct < 0.60) parts.push("tavallisesti keskikastissa");
    else                 parts.push("usein häntäpäässä");
  }

  if (profile.recentForm === "hot")  parts.push("viime aikoina hyvässä vireessä");
  if (profile.recentForm === "cold") parts.push("viime aikoina surkea vire");

  if (parts.length === 0) return undefined;
  return parts.join(", ");
}

export function updateProfiles(chatId: number, trackedPlayers: TrackedPlayer[], totalFieldSize: number): void {
  if (totalFieldSize === 0) return;

  const store = load();
  const chatKey = String(chatId);
  if (!store[chatKey]) store[chatKey] = {};

  const today = new Date().toISOString().slice(0, 10);

  for (const player of trackedPlayers) {
    const existing = store[chatKey][player.Name];
    const positionPct = player.OrderNumber / totalFieldSize;

    const prevGames = existing?.gamesPlayed ?? 0;
    const prevAvgPct = existing?.avgPositionPct ?? positionPct;
    const newAvgPct = (prevAvgPct * prevGames + positionPct) / (prevGames + 1);

    const recentForm: PlayerProfile["recentForm"] =
      positionPct < prevAvgPct - 0.15 ? "hot" :
      positionPct > prevAvgPct + 0.15 ? "cold" :
      "steady";

    store[chatKey][player.Name] = {
      ...(existing ?? {}),
      recentForm,
      gamesPlayed: prevGames + 1,
      avgPositionPct: Math.round(newAvgPct * 1000) / 1000,
      lastUpdated: today,
    };
  }

  save(store);
  Logger.info(`Updated player profiles for ${trackedPlayers.length} players (chat ${chatId})`);
}
