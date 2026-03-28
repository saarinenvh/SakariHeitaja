import { Bot } from "grammy";
import { sendWeatherMessage } from "../lib/weather";
import { searchGiphy } from "../lib/giphy";
import { getRandom, formatDate } from "../lib/utils";
import { randomGoodMorning, giphySearchWords, citys } from "../config/phrases";
import Logger from "js-logger";
import { HTML_OPTIONS } from "../config/bot";

export function startMorningGreeter(bot: Bot): void {
  const chatId = process.env.MORNING_CHAT_ID;
  if (!chatId) {
    Logger.info("MORNING_CHAT_ID not set, skipping morning greeting");
    return;
  }

  const now = new Date();
  let millisTill09 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0).getTime() - now.getTime();
  if (millisTill09 < 0) millisTill09 += 86400000;

  Logger.info(`MS to next morning ${millisTill09}`);

  setTimeout(async () => {
    const greeting = randomGoodMorning[getRandom(randomGoodMorning.length)];
    const message = `${greeting}Kello on <b>${formatDate(new Date())}</b> & tämmöstä keliä ois sit tänää taas luvassa.`;

    await bot.api.sendMessage(parseInt(chatId), message, HTML_OPTIONS);
    await sendWeatherMessage(citys[getRandom(citys.length)], parseInt(chatId), bot.api);
    await bot.api.sendMessage(parseInt(chatId), "Ja tästä päivä käyntiin!");
    const gifUrl = await searchGiphy(giphySearchWords[getRandom(giphySearchWords.length)]);
    if (gifUrl) await bot.api.sendVideo(parseInt(chatId), gifUrl);
    
    startMorningGreeter(bot);
  }, millisTill09);
}
