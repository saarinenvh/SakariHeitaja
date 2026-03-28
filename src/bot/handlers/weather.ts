import { Bot } from "grammy";
import { sendWeatherMessage } from "../../lib/weather";
import { citys } from "../../config/phrases";
import { getRandom } from "../../lib/utils";

export function register(bot: Bot): void {
  bot.command("saa", async ctx => {
    if (!ctx.match) return ctx.reply("Anna kaupunki. Esim: /saa Helsinki");
    await ctx.reply("Oiskohan nyt hyvä hetki puhua säästä?");
    await sendWeatherMessage(ctx.match.trim(), ctx.chat.id, bot);
  });

  bot.command("randomsaa", async ctx => {
    await ctx.reply("Oiskohan nyt hyvä hetki puhua säästä?");
    await sendWeatherMessage(citys[getRandom(citys.length)], ctx.chat.id, bot);
  });
}
