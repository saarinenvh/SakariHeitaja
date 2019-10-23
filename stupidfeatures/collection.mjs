import { bot } from "../bot.mjs";
import { getGiphy } from "../async/functions.mjs";
import { getRandom } from "../helpers/helpers.mjs";

// Sends gif from gfycat to channel
export const gifplz = bot.onText(/\/gifplz (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const url = `https://api.gfycat.com/v1/gfycats/search?search_text=${
    match[1]
  }`;
  getGiphy(url).then(n => {
    const response = JSON.parse(n);
    const images = response.gfycats.map(n => n.mp4Url);
    const test = bot.sendVideo(chatId, images[getRandom(images.length)]);
  });
});

// Sends message containing "Hyvä vade" text with random amount of e:s and ! marks.
export const vade = bot.onText(/\/hyva/, (msg, match) => {
  let amount = getRandom(100);
  let str = "Hyvä Vade";
  for (let i = 0; i < amount; i++) {
    str = str.concat("e");
  }
  amount = getRandom(100);
  for (let i = 0; i < amount; i++) {
    str = str.concat("!");
  }
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, str);
});

// Takes a list of names as a parameter and randomly chooses one.
export const kukakirjaa = bot.onText(/\/kukakirjaa (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const players = match[1].split(" ");
  const winner = players[getRandom(players.length)];
  bot.sendMessage(chatId, ` \u{1F3B5} On arvontalaulun aika! \u{1F3B5}`);

  setTimeout(n => {
    bot.sendMessage(chatId, `3`);
  }, 1000);

  setTimeout(n => {
    bot.sendMessage(chatId, `2`);
  }, 2000);

  setTimeout(n => {
    bot.sendMessage(chatId, `1`);
  }, 3000);

  setTimeout(n => {
    bot.sendMessage(
      chatId,
      `\u{1F386}\u{1F386}\u{1F386}   Ja voittaja on ${winner.toUpperCase()}!!! ONNEKSI OLKOON!   \u{1F386}\u{1F386}\u{1F386}`
    );
  }, 4000);
});

// Sends message containing all the commands that bot has
export const helpText = bot.onText(/\/apua/, msg => {
  const chatId = msg.chat.id;
  const helpText = `Meikää saa käskyttää seuraavin ja vain seuraavin komennoin!\n
Kilpailua seurailen seuraavasti:
/follow [metrixId] - Alan seuraamaan kyseistä kisaa ja kommentoin kisan tapahtumia.
/top5 - Kerron seurattavan kisan top-5 tilastot sarjoittain.
/score [Pelaajan nimi metrixissä] - Kerron kyseisen pelaajan tuloksen ja sijoituksen.
/lisaa [Pelaajan nimi metrixissä] - Lisään kyseisen pelaajan seurattaviin pelaajiin.
/lopeta - Lopetan kyseisen kisan seuraamisen.\n
Ja muuta hauskaa mitä hommailen:\n
/kukakirjaa [Pelaajien nimet välimerkein eroteltuna] - Arvon kirjaajan annetuista vaihtoehdoista
/hyva - Kyl te tiiätte! XD
/hep [Vapaa muotoinen teksti] - Tähän voi ilmottaa jos on menossa pelaamaan samana päivänä
/pelei - Listaa kaikki hep huudot`;
  bot.sendMessage(chatId, helpText);
});
