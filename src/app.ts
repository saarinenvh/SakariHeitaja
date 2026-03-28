import dotenv from "dotenv";
import Logger from "js-logger";
import { loggerSettings } from "./lib/logger";
Logger.useDefaults(loggerSettings);
dotenv.config();

import { bot } from "./bot/bot";
import * as registry from "./state/competitionRegistry";
import { Orchestrator } from "./game/orchestrator";
import * as competitionDb from "./db/queries/competitions";
import * as chatDb from "./db/queries/chats";
import * as scoreDb from "./db/queries/scores";
import { startMorningGreeter } from "./scheduler/morningGreeter";

import { register as registerCompetition } from "./bot/handlers/competition";
import { register as registerPlayers } from "./bot/handlers/players";
import { register as registerWeather } from "./bot/handlers/weather";
import { register as registerRecipe } from "./bot/handlers/recipe";
import { register as registerFun } from "./bot/handlers/fun";

registerCompetition(bot);
registerPlayers(bot);
registerWeather(bot);
registerRecipe(bot);
registerFun(bot);

// ── Score history ─────────────────────────────────────────────────────────────

bot.command("tulokset", async ctx => {
  const param = ctx.match.trim();
  if (!param) return ctx.reply("Anna kentän nimi tai id. Esim: /tulokset Kaatis");
  const chatId = ctx.chat.id;

  if (!isNaN(Number(param))) {
    const scores = await scoreDb.fetchScoresByCourseId(param, chatId);
    await _sendScores(scores, chatId);
  } else {
    const scores = await scoreDb.fetchScoresByCourseName(param, chatId);
    if (scores[0]?.count && scores[0].count > 1) {
      const list = [...new Set(scores.map(s => `<b>${s.courseId}</b>: ${s.course}\n`))].join("");
      await bot.api.sendMessage(chatId, `Voisitko vittu ystävällisesti vähän tarkemmin ilmottaa, et mitä kenttää tarkotat.. Saatana.\n\nValitse esim näistä:\n${list}`, { parse_mode: "HTML" });
    } else {
      await _sendScores(scores, chatId);
    }
  }
});

async function _sendScores(scores: scoreDb.ScoreRow[], chatId: number): Promise<void> {
  if (scores.length === 0) {
    await bot.api.sendMessage(chatId, "Eip löytyny tuloksia tolla hakusanalla :'(((", { parse_mode: "HTML" });
    return;
  }
  const top = scores.sort((a, b) => a.diff - b.diff).slice(0, 10);
  const rows = top.map((n, i) => `${i + 1}\t\t\t\t${n.player}\t\t\t\t${n.diff}\n`).join("");
  const message = `Dodiin, kovimmista kovimmat on sit paukutellu tällästä menee, semi säälittävää mutta... Ei tässä muuta vois odottaakkaan.\n\n********\t\t${top[0].course}\t\t********\n\n<code>Sija\tNimi\t\t\t\t\t\t\t\t\t\t\t\t\tTulos\n${rows}</code>`;
  await bot.api.sendMessage(chatId, message, { parse_mode: "HTML" });
}

// ── New chat handling ─────────────────────────────────────────────────────────

bot.on("message:new_chat_members", ctx => {
  chatDb.addChatIfUndefined(ctx.chat.id, ctx.chat.title ?? "");
});

bot.on("message:group_chat_created", ctx => {
  chatDb.addChatIfUndefined(ctx.chat.id, ctx.chat.title ?? "");
});

// ── Error handling ────────────────────────────────────────────────────────────

bot.catch(err => {
  Logger.warn(`Bot error: ${err.message}`);
});

// ── Startup ───────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  startMorningGreeter(bot);

  const unfinished = await competitionDb.fetchUnfinishedCompetitions();
  for (const i of unfinished) {
    const orchestrator = await new Orchestrator(i.id, i.metrix_id, i.chat_id, true).init();
    registry.add(i.chat_id, orchestrator);
  }
}

async function main(): Promise<void> {
  await init();
  bot.start();
}

main().catch(err => {
  Logger.error(`Fatal startup error: ${err.message}`);
  process.exit(1);
});
