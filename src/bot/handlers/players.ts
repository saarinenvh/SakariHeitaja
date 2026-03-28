import { Bot } from "grammy";
import * as playerDb from "../../db/queries/players";

export function register(bot: Bot): void {
  bot.command("lisaa", async ctx => {
    if (!ctx.match) return ctx.reply("Anna pelaajan nimi. Esim: /lisaa Matti Meikäläinen");
    const chatId = ctx.chat.id;
    try {
      await playerDb.addPlayer(ctx.match);
      const result = await playerDb.addPlayerToChat(ctx.match, chatId);
      await ctx.reply(
        result.affectedRows > 0
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
      const players = await playerDb.fetchPlayer(ctx.match);
      if (players.length === 0) {
        return ctx.reply(`Pelaajaa ${ctx.match} ei löytynyt järjestelmästä`);
      }
      const result = await playerDb.removePlayerFromChat(players, chatId);
      await ctx.reply(
        result.affectedRows > 0
          ? `Pelaaja ${ctx.match} poistettu seurattavista pelaajista.`
          : `Pelaajaa ${ctx.match} ei löytynyt seurattavista pelaajista`
      );
    } catch {
      await ctx.reply("Jotain meni pieleen pelaajan poistamisessa.");
    }
  });

  bot.command("pelaajat", async ctx => {
    const players = await playerDb.fetchPlayersLinkedToChat(ctx.chat.id);
    let message = "Seuraan seuraavia pelaajia: \n";
    players.forEach(p => (message += `${p.name} \n`));
    await ctx.reply(message);
  });
}
