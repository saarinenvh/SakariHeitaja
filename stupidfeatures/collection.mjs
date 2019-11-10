import { bot } from "../bot.mjs";
import { getGiphy, getData } from "../async/functions.mjs";
import * as Helpers from "../helpers/helpers.mjs";
import { weatherEmojis } from "../responses/default.mjs";

// Sends gif from gfycat to channel
export const gifplz = bot.onText(/\/gifplz (.+)/, (msg, match) => {
  sendGifphy(match[1], msg.chat.id);
});

export function sendGifphy(str, chatId) {
  const url = `https://api.gfycat.com/v1/gfycats/search?search_text=${str}`;
  getGiphy(url).then(n => {
    const response = JSON.parse(n);
    const images = response.gfycats.map(n => n.mp4Url);
    const test = bot.sendVideo(
      chatId,
      images[Helpers.getRandom(images.length)]
    );
  });
}

// Sends message containing "Hyvä vade" text with random amount of e:s and ! marks.
export const vade = bot.onText(/\/hyva/, (msg, match) => {
  let amount = Helpers.getRandom(100);
  let str = "Hyvä Vade";
  for (let i = 0; i < amount; i++) {
    str = str.concat("e");
  }
  amount = Helpers.getRandom(100);
  for (let i = 0; i < amount; i++) {
    str = str.concat("!");
  }
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, str);
});

//Fathers day easter egg
export const hyva = bot.onText(/\/isit/, (msg, match) => {
  let amount = Helpers.getRandom(100);
  let str = "Hyvä isi";
  for (let i = 0; i < amount; i++) {
    str = str.concat("t");
  }
  amount = Helpers.getRandom(100);
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
  const winner = players[Helpers.getRandom(players.length)];
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

// Sends message about weather at wanted city given by parameter to the chat that given in id
export async function sendWeatherMessage(city, chatId) {
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=fi&apikey=${process.env.OPENWEATHERMAP_APIKEY}`; // eslint-disable-line
  const response = await getData(url);
  if (response.cod === "404") {
    bot.sendMessage(
      chatId,
      `Mikä vitun ${city}? - Eihän tommosta mestaa oo ees olemassakaa.`
    );
  } else {
    bot.sendMessage(chatId, createWeatherMessage(response), {
      parse_mode: "HTML"
    });
  }
}

function createWeatherMessage(data) {
  let message = `${weatherEmojis[data.weather[0].main]} ${
    data.name
  } <b>${Math.round(data.main.temp * 10) / 10}${String.fromCharCode(
    176
  )}C</b> ${weatherEmojis[data.weather[0].main]} \n`;
  message += `Tällä hetkellä siis <b>${data.weather[0].description}</b>.\n`;
  message += `Tuulta puskis <b>${data.wind.speed} m/s</b>.\n`;
  message += `Aurinko nousee <b>${Helpers.createDate(
    data.sys.sunrise
  )}</b> \u{1f305}\n`;
  message += `Aurinko laskee <b>${Helpers.createDate(
    data.sys.sunset
  )}</b> \u{1f307}\n`;
  return message;
}

export async function createAndSendRecipeMessage(chatId) {
  const url =
    "https://api.s-cloud.fi/sok/aws/recipes-delivery/recipes-delivery/v1/recipes?fields=name%2Cdescription%2Cmedia%2Ccategories%2CusageRights%2Cpublisher%2CcookTime%2Cingredients%2Csteps&channel=yhteishyva&client_id=444c050f-ac71-43f9-9f37-c5cbda4c1cbb&environment=master&language=fi&limit=100";
  let data = await getData(url);
  let dish = data.results[Helpers.getRandom(data.results.length)];
  let message = `${dish.name} ${dish.cookTime}min\n\n`;
  message += dish.description + "\n\n";
  dish.ingredients.forEach(n => {
    if (Object.keys(n).includes("ingredientTitle")) {
      message += n["ingredientTitle"] + "\n";
    } else {
      message += n.name + "\n";
      n.ingredients.forEach(i => (message += i["ingredientTitle"] + "\n"));
    }
  });
  message += "\n";
  dish.steps.forEach((n, i) => {
    message += `${i + 1}. ${n.body} \n`;
  });
  bot.sendMessage(chatId, message);
  bot.sendPhoto(chatId, dish.media[0].file.url.substring(2));
}
