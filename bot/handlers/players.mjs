import * as playerDb from "../../db/queries/players.mjs";

export function register(bot) {
  bot.onText(/\/lisaa (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    try {
      await playerDb.addPlayer(match[1]);
      const result = await playerDb.addPlayerToChat(match[1], chatId);
      result.affectedRows > 0
        ? bot.sendMessage(chatId, `Pelaaja ${match[1]} lisätty seurattaviin pelaajiin.`)
        : bot.sendMessage(chatId, `Pelaaja ${match[1]} on jo seurattavissa pelaajissa.`);
    } catch (e) {
      bot.sendMessage(chatId, "Jotain meni pieleen pelaajan lisäämisessä.");
    }
  });

  bot.onText(/\/poista (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    try {
      const players = await playerDb.fetchPlayer(match[1]);
      if (players.length === 0) {
        bot.sendMessage(chatId, `Pelaajaa ${match[1]} ei löytynyt järjestelmästä`);
        return;
      }
      const result = await playerDb.removePlayerFromChat(players, chatId);
      result.affectedRows > 0
        ? bot.sendMessage(chatId, `Pelaaja ${match[1]} poistettu seurattavista pelaajista.`)
        : bot.sendMessage(chatId, `Pelaajaa ${match[1]} ei löytynyt seurattavista pelaajista`);
    } catch (e) {
      bot.sendMessage(chatId, "Jotain meni pieleen pelaajan poistamisessa.");
    }
  });

  bot.onText(/\/pelaajat/, async (msg) => {
    const chatId = msg.chat.id;
    const players = await playerDb.fetchPlayersLinkedToChat(chatId);
    let message = "Seuraan seuraavia pelaajia: \n";
    players.forEach(p => (message += `${p.name} \n`));
    bot.sendMessage(chatId, message);
  });
}
