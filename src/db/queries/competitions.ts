import { query } from "../connection";
import Logger from "js-logger";

export interface Competition {
  id: number;
  chat_id: number;
  metrix_id: string;
  finished: boolean;
}

export async function fetchUnfinishedCompetitions(): Promise<Competition[]> {
  return query<Competition[]>("SELECT * FROM competitions WHERE finished = false");
}

export async function fetchCompetitionsByChatId(chatId: number): Promise<Competition[]> {
  return query<Competition[]>(
    `SELECT * FROM competitions WHERE chat_id = ${chatId} AND finished = false`
  );
}

export async function addCompetition(chatId: number, metrixId: string): Promise<{ insertId: number }> {
  return query(
    `INSERT INTO competitions (finished, chat_id, metrix_id) VALUES (false, ${chatId}, ${metrixId})`
  );
}

export async function deleteCompetition(competitionId: string | number): Promise<void> {
  await query(`DELETE FROM competitions WHERE id = ${competitionId}`);
  Logger.info(`Competition ${competitionId} removed successfully`);
}

export async function markCompetitionFinished(id: number): Promise<void> {
  await query(`UPDATE competitions SET finished = true WHERE id = ${id}`);
}
