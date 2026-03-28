import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import Logger from "js-logger";
import { loggerSettings } from "./lib/logger.mjs";

Logger.useDefaults(loggerSettings);
dotenv.config();

process.on("unhandledRejection", err => {
  Logger.warn(`Unhandled rejection: ${err.message}`);
});

import { bot } from "./bot/bot.mjs";
import * as registry from "./state/competitionRegistry.mjs";
import { Orchestrator } from "./game/orchestrator.mjs";
import * as competitionDb from "./db/queries/competitions.mjs";
import * as chatDb from "./db/queries/chats.mjs";
import * as scoreDb from "./db/queries/scores.mjs";
import { startMorningGreeter } from "./scheduler/morningGreeter.mjs";

import { register as registerCompetition } from "./bot/handlers/competition.mjs";
import { register as registerPlayers } from "./bot/handlers/players.mjs";
import { register as registerWeather } from "./bot/handlers/weather.mjs";
import { register as registerRecipe } from "./bot/handlers/recipe.mjs";
import { register as registerFun } from "./bot/handlers/fun.mjs";

registerCompetition(bot);
registerPlayers(bot);
registerWeather(bot);
registerRecipe(bot);
registerFun(bot);

// ── Score history ─────────────────────────────────────────────────────────────

bot.onText(/\/tulokset (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const param = match[1];
  if (!isNaN(param)) {
    scoreDb.fetchScoresByCourseId(param, chatId).then(scores => _sendScores(scores, chatId));
  } else {
    scoreDb.fetchScoresByCourseName(param, chatId).then(scores => {
      if (scores[0]?.count > 1) {
        const list = [...new Set(scores.map(s => `<b>${s.courseId}</b>: ${s.course}\n`))].join("");
        bot.sendMessage(chatId, `Voisitko vittu ystävällisesti vähän tarkemmin ilmottaa, et mitä kenttää tarkotat.. Saatana.\n\nValitse esim näistä:\n${list}`, { parse_mode: "HTML" });
      } else {
        _sendScores(scores, chatId);
      }
    });
  }
});

function _sendScores(scores, chatId) {
  if (scores.length === 0) {
    bot.sendMessage(chatId, "Eip löytyny tuloksia tolla hakusanalla :'(((", { parse_mode: "HTML" });
    return;
  }
  const top = scores.sort((a, b) => a.diff - b.diff).slice(0, 10);
  const rows = top.map((n, i) => `${i + 1}\t\t\t\t${n.player}\t\t\t\t${n.diff}\n`).join("");
  const message = `Dodiin, kovimmista kovimmat on sit paukutellu tällästä menee, semi säälittävää mutta... Ei tässä muuta vois odottaakkaan.\n\n********\t\t${top[0].course}\t\t********\n\n<code>Sija\tNimi\t\t\t\t\t\t\t\t\t\t\t\t\tTulos\n${rows}</code>`;
  bot.sendMessage(chatId, message, { parse_mode: "HTML" });
}

// ── New chat handling ─────────────────────────────────────────────────────────

bot.on("message", msg => {
  const keys = Object.keys(msg);
  if (keys.includes("new_chat_participant") || keys.includes("group_chat_created")) {
    chatDb.addChatIfUndefined(msg.chat.id, msg.chat.title);
  }
});

// ── Startup ───────────────────────────────────────────────────────────────────

async function init() {
  startMorningGreeter(bot);

  const unfinished = await competitionDb.fetchUnfinishedCompetitions();
  for (const i of unfinished) {
    const orchestrator = await new Orchestrator(i.id, i.metrix_id, i.chat_id, true).init();
    registry.add(i.chat_id, orchestrator);
  }
}

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(5000, "127.0.0.1", () => init());
