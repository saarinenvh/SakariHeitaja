import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import Logger from "js-logger";
import { loggerSettings } from "./lib/logger";
Logger.useDefaults(loggerSettings);

import { dataSource } from "./db/dataSource";
import { bot } from "./bot/bot";
import * as registry from "./state/competitionRegistry";
import { Orchestrator } from "./features/disc-golf/orchestrator";
import * as competitionService from "./features/disc-golf/services/CompetitionService";
import * as chatRepo from "./db/repositories/ChatRepository";
import { startMorningGreeter } from "./scheduler/morningGreeter";

import { register as registerCompetition } from "./bot/handlers/competition";
import { register as registerPlayers } from "./bot/handlers/players";
import { register as registerScores } from "./bot/handlers/scores";
import { register as registerWeather } from "./bot/handlers/weather";
import { register as registerRecipe } from "./bot/handlers/recipe";
import { register as registerFun } from "./bot/handlers/fun";

registerCompetition(bot);
registerPlayers(bot);
registerScores(bot);
registerWeather(bot);
registerRecipe(bot);
registerFun(bot);  // must be last — its message:text handler swallows remaining messages

// ── New chat handling ─────────────────────────────────────────────────────────

bot.on("message:new_chat_members", ctx => {
  chatRepo.addIfAbsent(ctx.chat.id, ctx.chat.title ?? "");
});

bot.on("message:group_chat_created", ctx => {
  chatRepo.addIfAbsent(ctx.chat.id, ctx.chat.title ?? "");
});

// ── Error handling ────────────────────────────────────────────────────────────

bot.catch(err => {
  Logger.warn(`Bot error: ${err.message}`);
});

// ── Startup ───────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  startMorningGreeter(bot);

  const unfinished = await competitionService.getUnfinished();
  for (const i of unfinished) {
    const orchestrator = await new Orchestrator(i.id, i.metrixId, i.chatId, true).init();
    registry.add(i.chatId, orchestrator);
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();
  await init();
  bot.start();
}

main().catch(err => {
  Logger.error(`Fatal startup error: ${err.message}`);
  process.exit(1);
});
