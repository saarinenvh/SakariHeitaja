import { Bot } from "grammy";
import * as playerService from "../../features/disc-golf/services/PlayerService";

export function register(bot: Bot): void {
  bot.command("lisaa", async ctx => {
    if (!ctx.match) return ctx.reply("Anna pelaajan nimi. Esim: /lisaa Matti Meikäläinen");
    const chatId = ctx.chat.id;
    try {
      const result = await playerService.addToGroup(ctx.match, chatId);
      await ctx.reply(
        result.added
          ? `Pelaaja ${ctx.match} lisätty seurattaviin pelaajiin.`
          : `Pelaaja ${ctx.match} on jo seurattavissa pelaajissa.`
      );
    } catch {
      await ctx.reply("Jotain meni pieleen pelaajan lisäämisessä.");
    }
  });

  bot.command("poista", async ctx => {
    if (!ctx.match) return ctx.reply("Anna pelaajan nimi. Esim: /poista Matti Meikäläinen");
    const chatId = ctx.chat.id;
    try {
      const result = await playerService.removeFromGroup(ctx.match, chatId);
      if (!result.found) return ctx.reply(`Pelaajaa ${ctx.match} ei löytynyt järjestelmästä`);
      await ctx.reply(
        result.removed
          ? `Pelaaja ${ctx.match} poistettu seurattavista pelaajista.`
          : `Pelaajaa ${ctx.match} ei löytynyt seurattavista pelaajista`
      );
    } catch {
      await ctx.reply("Jotain meni pieleen pelaajan poistamisessa.");
    }
  });

  bot.command("pelaajat", async ctx => {
    const players = await playerService.getGroupPlayers(ctx.chat.id);
    let message = "Seuraan seuraavia pelaajia: \n";
    players.forEach(p => (message += `${p.name} \n`));
    await ctx.reply(message);
  });
}
