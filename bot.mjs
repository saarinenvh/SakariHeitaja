import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.TOKEN; // eslint-disable-line
export const bot = new TelegramBot(token, { polling: true });
