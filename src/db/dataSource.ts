import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { DataSource } from "typeorm";
import { Player } from "./entities/Player";
import { Chat } from "./entities/Chat";
import { Competition } from "./entities/Competition";
import { Course } from "./entities/Course";
import { PlayerToChat } from "./entities/PlayerToChat";
import { Score } from "./entities/Score";
import { Ace } from "./entities/Ace";
import { Eagle } from "./entities/Eagle";
import { Albatross } from "./entities/Albatross";

export const dataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [Player, Chat, Competition, Course, PlayerToChat, Score, Ace, Eagle, Albatross],
});
