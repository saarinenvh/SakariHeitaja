import { Bot } from "grammy";
import Logger from "js-logger";
import * as scoreService from "../../features/disc-golf/services/ScoreService";
import { ScoreRow } from "../../db/repositories/ScoreRepository";

export function register(bot: Bot): void {
  bot.command("tulokset", async ctx => {
    const param = ctx.match.trim();
    if (!param) return ctx.reply("Anna kentän nimi tai id. Esim: /tulokset Kaatis");
    const chatId = ctx.chat.id;

    try {
      Logger.info(`tulokset called: param="${param}" chatId=${chatId}`);
      if (!isNaN(Number(param))) {
        const scores = await scoreService.getByCourseId(param, chatId);
        Logger.info(`tulokset by id: ${scores.length} rows`);
        await _sendScores(scores, chatId, bot);
      } else {
        const scores = await scoreService.getByCourseName(param, chatId);
        Logger.info(`tulokset by name: ${scores.length} rows, count=${scores[0]?.count}`);
        if (scores[0]?.count && scores[0].count > 1) {
          const list = [...new Set(scores.map(s => `<b>${s.courseId}</b>: ${s.course}\n`))].join("");
          await bot.api.sendMessage(chatId, `Voisitko vittu ystävällisesti vähän tarkemmin ilmottaa, et mitä kenttää tarkotat.. Saatana.\n\nValitse esim näistä:\n${list}`, { parse_mode: "HTML" });
        } else {
          await _sendScores(scores, chatId, bot);
        }
      }
    } catch (err: any) {
      Logger.error(`tulokset error: ${err.message}`);
      await ctx.reply("Jotain meni pieleen tuloksia hakiessa.");
    }
  });
}

async function _sendScores(scores: ScoreRow[], chatId: number, bot: Bot): Promise<void> {
  if (scores.length === 0) {
    await bot.api.sendMessage(chatId, "Eip löytyny tuloksia tolla hakusanalla :'(((", { parse_mode: "HTML" });
    return;
  }
  const top = scores.sort((a, b) => a.diff - b.diff).slice(0, 10);
  const rows = top.map((n, i) => `${i + 1}\t\t\t\t${n.player}\t\t\t\t${n.diff}\n`).join("");
  const message = `Dodiin, kovimmista kovimmat on sit paukutellu tällästä menee, semi säälittävää mutta... Ei tässä muuta vois odottaakkaan.\n\n********\t\t${top[0].course}\t\t********\n\n<code>Sija\tNimi\t\t\t\t\t\t\t\t\t\t\t\t\tTulos\n${rows}</code>`;
  await bot.api.sendMessage(chatId, message, { parse_mode: "HTML" });
}
