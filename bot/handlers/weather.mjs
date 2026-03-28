import { sendWeatherMessage } from "../../lib/weather.mjs";
import { citys } from "../../config/phrases.mjs";
import { getRandom } from "../../lib/utils.mjs";

export function register(bot) {
  bot.onText(/\/saa (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Oiskohan nyt hyvä hetki puhua säästä?");
    await sendWeatherMessage(match[1], chatId, bot);
  });

  bot.onText(/\/randomsaa/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Oiskohan nyt hyvä hetki puhua säästä?");
    await sendWeatherMessage(citys[getRandom(citys.length)], chatId, bot);
  });
}
