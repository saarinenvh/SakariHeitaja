import { Orchestrator } from "../../game/orchestrator.mjs";
import * as competitionDb from "../../db/queries/competitions.mjs";
import * as chatDb from "../../db/queries/chats.mjs";
import * as registry from "../../state/competitionRegistry.mjs";

export function register(bot) {
  bot.onText(/\/follow (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const metrixId = match[1].match(/\d+/)[0];

    await chatDb.addChatIfUndefined(chatId, msg.chat.title);
    bot.sendMessage(chatId, "Okei, aletaan kattoo vähä kiekkogolffii (c) Ian Andersson");

    const result = await competitionDb.addCompetition(chatId, metrixId);
    const orchestrator = await new Orchestrator(result.insertId, metrixId, chatId).init();
    registry.add(chatId, orchestrator);
  });

  bot.onText(/\/lopeta (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const competitionId = match[1];

    const removed = registry.remove(chatId, competitionId);
    if (removed) {
      await competitionDb.deleteCompetition(competitionId);
      bot.sendMessage(chatId, "No olihan se kivaa taas, jatketaan ens kerralla.");
    } else {
      bot.sendMessage(chatId, "Eihän tommost kisaa ookkaa! URPå!");
    }
  });

  bot.onText(/\/pelit/, (msg) => {
    const chatId = msg.chat.id;
    const active = registry.getActive(chatId);

    let message = "";
    if (active.length > 0) {
      message = "Tällä hetkellä tuijotetaan kivikovana seuraavia blejä.\n\n";
      active.forEach(o => {
        message += `${o.id}: ${o.data.Competition.Name}, ${o.trackedPlayers.length} sankari(a). https://discgolfmetrix.com/${o.metrixId}\n`;
      });
    } else {
      message = "Eihän tässä nyt taas mitään ole käynnissä...";
    }
    bot.sendMessage(chatId, message, { parse_mode: "HTML", disable_web_page_preview: true });
  });

  bot.onText(/\/top5$/, (msg) => {
    const chatId = msg.chat.id;
    const active = registry.getActive(chatId);
    if (active.length > 0) {
      bot.sendMessage(chatId, "Jaa, vai että minkäs kisan top tulokset haluut? Kokeile vaik /pelit komentoo ja lisää kisan id /top5 komennon perään. Aasi!");
    } else {
      bot.sendMessage(chatId, "Varmaa pitäis jotai kisaa seuratakki.");
    }
  });

  bot.onText(/\/top5 (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const orchestrator = registry.find(chatId, match[1]);
    if (orchestrator) {
      orchestrator.createTopList();
    } else {
      bot.sendMessage(chatId, "Varmaa pitäis jotai kisaa seuratakki.");
    }
  });

  bot.onText(/\/score (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const active = registry.getActive(chatId);
    const player = active.length > 0
      ? active[0].getScoreByPlayerName(match[1])
      : null;

    const message = player
      ? `${player.Name} on tuloksessa ${player.Diff} ja sijalla ${player.OrderNumber}! Hienosti`
      : "Eihän tommone äijä oo ees jäällä, urpo";

    bot.sendMessage(chatId, message);
  });
}
