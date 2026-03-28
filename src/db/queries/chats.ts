import { query } from "../connection";
import Logger from "js-logger";

export interface Chat {
  id: number;
  name: string;
}

export async function fetchChats(): Promise<Chat[]> {
  return query<Chat[]>("SELECT * FROM chats");
}

export async function fetchChat(id: number): Promise<Chat[]> {
  return query<Chat[]>(`SELECT * FROM chats WHERE id = '${id}'`);
}

export async function addChatIfUndefined(chatId: number, chatName: string): Promise<void> {
  const existing = await fetchChat(chatId);
  if (existing.length > 0) return;
  await query(`INSERT INTO chats(id, name) VALUES (${chatId}, '${chatName}')`);
  Logger.info(`Added new chat: ${chatId}, ${chatName}`);
}
