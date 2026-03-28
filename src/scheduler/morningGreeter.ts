import { Bot } from "grammy";
import { sendWeatherMessage } from "../lib/weather";
import { getGiphy } from "../lib/http";
import { getRandom, formatDate } from "../lib/utils";
import { randomGoodMorning, giphySearchWords, citys } from "../config/phrases";
import Logger from "js-logger";

async function sendGif(str: string, chatId: number, bot: Bot): Promise<void> {
  const url = `https://api.gfycat.com/v1/gfycats/search?search_text=${str}`;
  const n = await getGiphy(url);
  if (!n) return;
  const response = JSON.parse(n);
  const images: string[] = response.gfycats.map((g: any) => g.mp4Url);
  await bot.api.sendVideo(chatId, images[getRandom(images.length)]);
}

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
    await bot.api.sendMessage(parseInt(chatId), message, { parse_mode: "HTML" });
    await sendWeatherMessage(citys[getRandom(citys.length)], parseInt(chatId), bot);
    await bot.api.sendMessage(parseInt(chatId), "Ja tästä päivä käyntiin!");
    await sendGif(giphySearchWords[getRandom(giphySearchWords.length)], parseInt(chatId), bot);
    startMorningGreeter(bot);
  }, millisTill09);
}
