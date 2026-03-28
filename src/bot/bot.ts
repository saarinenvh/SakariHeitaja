import { Bot } from "grammy";
import dotenv from "dotenv";
dotenv.config();

export const bot = new Bot(process.env.TOKEN!);
