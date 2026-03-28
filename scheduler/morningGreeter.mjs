import { sendWeatherMessage } from "../lib/weather.mjs";
import { getGiphy } from "../lib/http.mjs";
import { getRandom, formatDate } from "../lib/utils.mjs";
import { randomGoodMorning, giphySearchWords, citys } from "../config/phrases.mjs";
import Logger from "js-logger";

async function sendGif(str, chatId, bot) {
  const url = `https://api.gfycat.com/v1/gfycats/search?search_text=${str}`;
  const n = await getGiphy(url);
  const response = JSON.parse(n);
  const images = response.gfycats.map(g => g.mp4Url);
  bot.sendVideo(chatId, images[getRandom(images.length)]);
}

export function startMorningGreeter(bot) {
  const chatId = process.env.MORNING_CHAT_ID;
  if (!chatId) {
    Logger.info("MORNING_CHAT_ID not set, skipping morning greeting");
    return;
  }

  const now = new Date();
  let millisTill09 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0) - now;
  if (millisTill09 < 0) millisTill09 += 86400000;

  Logger.info(`MS to next morning ${millisTill09}`);

  setTimeout(async () => {
    const greeting = randomGoodMorning[getRandom(randomGoodMorning.length)];
    const message = `${greeting}Kello on <b>${formatDate(new Date())}</b> & tämmöstä keliä ois sit tänää taas luvassa.`;
    bot.sendMessage(chatId, message, { parse_mode: "html" });
    await sendWeatherMessage(citys[getRandom(citys.length)], chatId, bot);
    bot.sendMessage(chatId, "Ja tästä päivä käyntiin!");
    await sendGif(giphySearchWords[getRandom(giphySearchWords.length)], chatId, bot);
    startMorningGreeter(bot);
  }, millisTill09);
}
