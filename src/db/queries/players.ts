import { query } from "../connection";

export interface Player {
  id: number;
  name: string;
}

export async function fetchPlayers(): Promise<Player[]> {
  return query<Player[]>("SELECT * FROM players");
}

export async function fetchPlayer(name: string): Promise<Player[]> {
  return query<Player[]>(`SELECT * FROM players WHERE name = '${name}'`);
}

export async function addPlayer(name: string): Promise<void> {
  await query(
    `INSERT INTO players (name) SELECT * FROM (SELECT '${name}') AS tmp WHERE NOT EXISTS (SELECT * FROM players WHERE name = '${name}')`
  );
}

export async function fetchPlayersLinkedToChat(chatId: number): Promise<Player[]> {
  return query<Player[]>(
    `SELECT P.id, P.name FROM players P JOIN player_to_chat PTC ON P.id = PTC.player_id WHERE PTC.chat_id = ${chatId}`
  );
}

export async function addPlayerToChat(name: string, chatId: number): Promise<{ affectedRows: number }> {
  const players = await fetchPlayer(name);
  if (!players.length) return { affectedRows: 0 };
  return query(
    `INSERT IGNORE INTO player_to_chat (player_id, chat_id) VALUES (${players[0].id}, ${chatId})`
  );
}

export async function removePlayerFromChat(players: Player[], chatId: number): Promise<{ affectedRows: number }> {
  return query(
    `DELETE FROM player_to_chat WHERE player_id = ${players[0].id} AND chat_id = ${chatId}`
  );
}
