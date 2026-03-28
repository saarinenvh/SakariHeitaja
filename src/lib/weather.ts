import { Bot } from "grammy";
import { getData } from "./http";
import { weatherEmojis } from "../config/phrases";
import { createDate } from "./utils";

interface WeatherResponse {
  cod: string | number;
  name: string;
  main: { temp: number };
  weather: { main: string; description: string }[];
  wind: { speed: number };
  sys: { sunrise: number; sunset: number };
}

export async function sendWeatherMessage(city: string, chatId: number, bot: Bot): Promise<void> {
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=fi&apikey=${process.env.OPENWEATHERMAP_APIKEY}`;
  const response = await getData<WeatherResponse>(url);
  if (!response || response.cod === "404") {
    await bot.api.sendMessage(chatId, `Mikä vitun ${city}? - Eihän tommosta mestaa oo ees olemassakaa.`);
    return;
  }
  await bot.api.sendMessage(chatId, _formatWeather(response), { parse_mode: "HTML" });
}

function _formatWeather(data: WeatherResponse): string {
  const emoji = weatherEmojis[data.weather[0].main] ?? "";
  let msg = `${emoji} ${data.name} <b>${Math.round(data.main.temp * 10) / 10}°C</b> ${emoji}\n`;
  msg += `Tällä hetkellä siis <b>${data.weather[0].description}</b>.\n`;
  msg += `Tuulta puskis <b>${data.wind.speed} m/s</b>.\n`;
  msg += `Aurinko nousee <b>${createDate(data.sys.sunrise)}</b> 🌅\n`;
  msg += `Aurinko laskee <b>${createDate(data.sys.sunset)}</b> 🌇\n`;
  return msg;
}
