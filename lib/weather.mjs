import { getData } from "./http.mjs";
import { weatherEmojis } from "../config/phrases.mjs";
import { createDate } from "./utils.mjs";

export async function sendWeatherMessage(city, chatId, bot) {
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=fi&apikey=${process.env.OPENWEATHERMAP_APIKEY}`;
  const response = await getData(url);
  if (!response || response.cod === "404") {
    bot.sendMessage(chatId, `Mikä vitun ${city}? - Eihän tommosta mestaa oo ees olemassakaa.`);
    return;
  }
  bot.sendMessage(chatId, _formatWeather(response), { parse_mode: "HTML" });
}

function _formatWeather(data) {
  const emoji = weatherEmojis[data.weather[0].main] || "";
  let msg = `${emoji} ${data.name} <b>${Math.round(data.main.temp * 10) / 10}°C</b> ${emoji}\n`;
  msg += `Tällä hetkellä siis <b>${data.weather[0].description}</b>.\n`;
  msg += `Tuulta puskis <b>${data.wind.speed} m/s</b>.\n`;
  msg += `Aurinko nousee <b>${createDate(data.sys.sunrise)}</b> 🌅\n`;
  msg += `Aurinko laskee <b>${createDate(data.sys.sunset)}</b> 🌇\n`;
  return msg;
}
