import db from "../connection.mjs";
import Logger from "js-logger";

export async function fetchChats() {
  return query("SELECT * FROM chats");
}

export async function fetchChat(id) {
  return query(`SELECT * FROM chats WHERE id = '${id}'`);
}

export async function addChatIfUndefined(chatId, chatName) {
  const existing = await fetchChat(chatId);
  if (existing.length > 0) return;
  const data = await query(
    `INSERT INTO chats(id, name) VALUES (${chatId}, '${chatName}')`
  );
  Logger.info(`Added new chat: ${chatId}, ${chatName}`);
  return data;
}

function query(sql) {
  return new Promise((resolve, reject) => {
    db.query(sql, (error, results) => {
      if (error) {
        Logger.error(error);
        reject(error);
      } else {
        resolve(JSON.parse(JSON.stringify(results)));
      }
    });
  });
}
