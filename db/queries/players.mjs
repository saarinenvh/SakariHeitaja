import db from "../connection.mjs";
import Logger from "js-logger";

export async function fetchPlayers() {
  return query("SELECT * FROM players");
}

export async function fetchPlayer(name) {
  return query(`SELECT * FROM players WHERE name='${name}'`);
}

export async function addPlayer(name) {
  const data = await query(
    `INSERT INTO players (name) SELECT * FROM (SELECT '${name}') AS tmp WHERE NOT EXISTS (SELECT * FROM players WHERE name = '${name}')`
  );
  data.affectedRows > 0
    ? Logger.info(`Player: ${name} - added successfully`)
    : Logger.debug(`Player: ${name} - already exists, nothing to do`);
  return data;
}

export async function fetchPlayersLinkedToChat(chatId) {
  return query(
    `SELECT * FROM player_to_chat INNER JOIN players ON player_to_chat.player_id = players.id WHERE chat_id = ${chatId}`
  );
}

export async function addPlayerToChat(playerName, chatId) {
  const players = await fetchPlayer(playerName);
  const player = players[0];
  const data = await query(
    `INSERT INTO player_to_chat(player_id, chat_id) SELECT * FROM (SELECT ${player.id}, ${chatId}) AS tmp WHERE NOT EXISTS (SELECT * FROM player_to_chat WHERE player_id = ${player.id} AND chat_id = ${chatId})`
  );
  data.affectedRows > 0
    ? Logger.info(`Added player ${player.id} to chat ${chatId}`)
    : Logger.info(`Player ${player.id} already in chat ${chatId}`);
  return data;
}

export async function removePlayerFromChat(player, chatId) {
  const data = await query(
    `DELETE FROM player_to_chat WHERE player_id = ${player[0].id}`
  );
  Logger.info(`Player ${player[0].id} removed from chat ${chatId}`);
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
