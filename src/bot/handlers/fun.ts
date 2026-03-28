import { Bot } from "grammy";
import { getRandom } from "../../lib/utils";
import { getGiphy } from "../../lib/http";
import { sakariNames, sakariResponses, randomQuote } from "../../config/phrases";

let games: Record<string, string> = {};
let date = new Date().toLocaleDateString();

export function register(bot: Bot): void {
  bot.command("hyva", async ctx => {
    const e = getRandom(100);
    const excl = getRandom(100);
    await ctx.reply("Hyvä Vade" + "e".repeat(e) + "!".repeat(excl));
  });

  bot.command("isit", async ctx => {
    const t = getRandom(100);
    const excl = getRandom(100);
    await ctx.reply("Hyvä isi" + "t".repeat(t) + "!".repeat(excl));
  });

  bot.command("kukakirjaa", async ctx => {
    if (!ctx.match) return ctx.reply("Anna pelaajat välilyönnillä eroteltuna.");
    const players = ctx.match.split(" ");
    const winner = players[getRandom(players.length)];
    await ctx.reply("🎵 On arvontalaulun aika! 🎵");
    setTimeout(() => ctx.reply("3"), 1000);
    setTimeout(() => ctx.reply("2"), 2000);
    setTimeout(() => ctx.reply("1"), 3000);
    setTimeout(() => ctx.reply(`🎆🎆🎆   Ja voittaja on ${winner.toUpperCase()}!!! ONNEKSI OLKOON!   🎆🎆🎆`), 4000);
  });

  bot.command("gifplz", async ctx => {
    if (!ctx.match) return ctx.reply("Anna hakusana.");
    const url = `https://api.gfycat.com/v1/gfycats/search?search_text=${ctx.match}`;
    const n = await getGiphy(url);
    if (!n) return;
    const response = JSON.parse(n);
    const images: string[] = response.gfycats.map((g: any) => g.mp4Url);
    await ctx.replyWithVideo(images[getRandom(images.length)]);
  });

  bot.command("hep", async ctx => {
    if (!ctx.match) return ctx.reply("Kerro suunnitelmasi!");
    if (new Date().toLocaleDateString() !== date) {
      games = {};
      date = new Date().toLocaleDateString();
    }
    const username = ctx.from?.username ?? ctx.from?.first_name ?? "tuntematon";
    games[username] = ctx.match;
    await ctx.reply(_todaysGames());
  });

  bot.command("pelei", async ctx => {
    await ctx.reply(_todaysGames());
  });

  bot.command("apua", async ctx => {
    await ctx.reply(`Meikää saa käskyttää seuraavin ja vain seuraavin komennoin!\n
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

  bot.on("message:text", async ctx => {
    const text = ctx.message.text.toLowerCase();
    let said = false;

    if (sakariNames.find(n => text.includes(n.toLowerCase()))) {
      if (getRandom(2) === 1) {
        await ctx.reply(sakariResponses[getRandom(sakariResponses.length)]);
        said = true;
      }
    }

    if (text.includes("jallu") && getRandom(2) === 1 && !said) {
      await ctx.reply("JALLU!");
      said = true;
    }

    if (getRandom(40) === 1 && !said) {
      await ctx.reply(randomQuote[getRandom(randomQuote.length)]);
    }
  });
}

function _todaysGames(): string {
  if (Object.keys(games).length === 0) return "Kukaan ei oo pelaamas tänään??? :'(";
  let str = "Tän päivän gamepläännis ois seuraavanlaisia \n";
  for (const [user, plan] of Object.entries(games)) {
    str += `${user}: ${plan} \n`;
  }
  return str + "Supereit heittoi kaikille!!";
}
