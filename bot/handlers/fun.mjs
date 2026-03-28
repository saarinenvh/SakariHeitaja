import { getRandom } from "../../lib/utils.mjs";
import { getGiphy } from "../../lib/http.mjs";
import { sakariNames, sakariResponses, randomQuote } from "../../config/phrases.mjs";

let games = {};
let date = new Date().toLocaleDateString();

export function register(bot) {
  bot.onText(/\/hyva/, (msg) => {
    const chatId = msg.chat.id;
    let str = "Hyvä Vade";
    const e = getRandom(100);
    const excl = getRandom(100);
    str += "e".repeat(e) + "!".repeat(excl);
    bot.sendMessage(chatId, str);
  });

  bot.onText(/\/isit/, (msg) => {
    const chatId = msg.chat.id;
    let str = "Hyvä isi";
    const t = getRandom(100);
    const excl = getRandom(100);
    str += "t".repeat(t) + "!".repeat(excl);
    bot.sendMessage(chatId, str);
  });

  bot.onText(/\/kukakirjaa (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const players = match[1].split(" ");
    const winner = players[getRandom(players.length)];
    bot.sendMessage(chatId, "🎵 On arvontalaulun aika! 🎵");
    setTimeout(() => bot.sendMessage(chatId, "3"), 1000);
    setTimeout(() => bot.sendMessage(chatId, "2"), 2000);
    setTimeout(() => bot.sendMessage(chatId, "1"), 3000);
    setTimeout(() => bot.sendMessage(chatId, `🎆🎆🎆   Ja voittaja on ${winner.toUpperCase()}!!! ONNEKSI OLKOON!   🎆🎆🎆`), 4000);
  });

  bot.onText(/\/gifplz (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const url = `https://api.gfycat.com/v1/gfycats/search?search_text=${match[1]}`;
    getGiphy(url).then(n => {
      const response = JSON.parse(n);
      const images = response.gfycats.map(g => g.mp4Url);
      bot.sendVideo(chatId, images[getRandom(images.length)]);
    });
  });

  bot.onText(/\/hep (.+)/, (msg, match) => {
    if (new Date().toLocaleDateString() !== date) {
      games = {};
      date = new Date().toLocaleDateString();
    }
    games[msg.from.username] = match[1];
    bot.sendMessage(msg.chat.id, _todaysGames());
  });

  bot.onText(/\/pelei/, (msg) => {
    bot.sendMessage(msg.chat.id, _todaysGames());
  });

  bot.onText(/\/apua/, (msg) => {
    bot.sendMessage(msg.chat.id, `Meikää saa käskyttää seuraavin ja vain seuraavin komennoin!\n
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
/pelei - Listaa kaikki hep huudot`);
  });

  bot.on("text", (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const text = msg.text.toLowerCase();
    let said = false;

    if (sakariNames.find(n => text.includes(n.toLowerCase()))) {
      if (getRandom(2) === 1) {
        bot.sendMessage(chatId, sakariResponses[getRandom(sakariResponses.length)]);
        said = true;
      }
    }

    if (text.includes("jallu") && getRandom(2) === 1 && !said) {
      bot.sendMessage(chatId, "JALLU!");
      said = true;
    }

    if (getRandom(40) === 1 && !said) {
      bot.sendMessage(chatId, randomQuote[getRandom(randomQuote.length)]);
    }
  });
}

function _todaysGames() {
  if (Object.keys(games).length === 0) {
    return "Kukaan ei oo pelaamas tänään??? :'(";
  }
  let str = "Tän päivän gamepläännis ois seuraavanlaisia \n";
  for (const [user, plan] of Object.entries(games)) {
    str += `${user}: ${plan} \n`;
  }
  return str + "Supereit heittoi kaikille!!";
}
