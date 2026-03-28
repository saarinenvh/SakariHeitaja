import { Bot } from "grammy";
import { Orchestrator } from "../../features/disc-golf/orchestrator";
import * as competitionService from "../../features/disc-golf/services/CompetitionService";
import * as registry from "../../state/competitionRegistry";

export function register(bot: Bot): void {
  bot.command("follow", async ctx => {
    if (!ctx.match) return ctx.reply("Anna metrixId komennon perään. Esim: /follow 12345");
    const metrixId = ctx.match.match(/\d+/)?.[0];
    if (!metrixId) return ctx.reply("Ei löydy numeroa viestistä, urpo.");

    const chatId = ctx.chat.id;
    const result = await competitionService.start(chatId, ctx.chat.title ?? "", metrixId);
    await ctx.reply("Okei, aletaan kattoo vähä kiekkogolffii (c) Ian Andersson");

    const orchestrator = await new Orchestrator(result.insertId, metrixId, chatId).init();
    registry.add(chatId, orchestrator);
  });

  bot.command("lopeta", async ctx => {
    if (!ctx.match) return ctx.reply("Anna kisan id. Esim: /lopeta 42");
    const chatId = ctx.chat.id;
    const removed = registry.remove(chatId, ctx.match.trim());
    if (removed) {
      await competitionService.remove(ctx.match.trim());
      await ctx.reply("No olihan se kivaa taas, jatketaan ens kerralla.");
    } else {
      await ctx.reply("Eihän tommost kisaa ookkaa! URPå!");
    }
  });

  bot.command("pelit", async ctx => {
    const chatId = ctx.chat.id;
    const active = registry.getActive(chatId);

    let message: string;
    if (active.length > 0) {
      message = "Tällä hetkellä tuijotetaan kivikovana seuraavia blejä.\n\n";
      for (const o of active) {
        message += `${o.id}: ${o.data!.Competition.Name}, ${o.trackedPlayers.length} sankari(a). https://discgolfmetrix.com/${o.metrixId}\n`;
      }
    } else {
      message = "Eihän tässä nyt taas mitään ole käynnissä...";
    }
    await ctx.reply(message, { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
  });

  bot.command("top5", async ctx => {
    const chatId = ctx.chat.id;
    const active = registry.getActive(chatId);
    if (!ctx.match) {
      await ctx.reply(
        active.length > 0
          ? "Jaa, vai että minkäs kisan top tulokset haluut? Kokeile vaik /pelit komentoo ja lisää kisan id /top5 komennon perään. Aasi!"
          : "Varmaa pitäis jotai kisaa seuratakki."
      );
      return;
    }
    const orchestrator = registry.find(chatId, ctx.match.trim());
    orchestrator
      ? orchestrator.createTopList()
      : await ctx.reply("Varmaa pitäis jotai kisaa seuratakki.");
  });

  bot.command("score", async ctx => {
    const chatId = ctx.chat.id;
    const active = registry.getActive(chatId);
    const player = ctx.match && active.length > 0
      ? active[0].getScoreByPlayerName(ctx.match.trim())
      : null;

    await ctx.reply(
      player
        ? `${player.Name} on tuloksessa ${player.Diff} ja sijalla ${player.OrderNumber}! Hienosti`
        : "Eihän tommone äijä oo ees jäällä, urpo"
    );
  });
}
