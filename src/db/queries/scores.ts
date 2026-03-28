import { query } from "../connection";
import Logger from "js-logger";

export interface ScoreRow {
  courseId: number;
  player: string;
  course: string;
  sum: number;
  diff: number;
  count?: number;
}

export async function addResults(
  player_id: number,
  chat_id: number,
  course_id: number,
  competition_id: number,
  diff: number,
  sum: number
): Promise<void> {
  await query(
    `INSERT INTO scores (player_id, chat_id, course_id, competition_id, diff, sum) VALUES (${player_id}, ${chat_id}, ${course_id}, ${competition_id}, ${diff}, ${sum})`
  );
  Logger.info(`Score for player ${player_id} - added successfully`);
}

export async function fetchScoresByCourseName(name: string, chatId: number): Promise<ScoreRow[]> {
  return query<ScoreRow[]>(
    `SELECT S.course_id AS courseId, I.name AS player, C.name AS course, S.sum, S.diff,
      (SELECT COUNT(DISTINCT S2.course_id) FROM scores S2 JOIN courses C2 ON S2.course_id = C2.id
       WHERE S2.chat_id = ${chatId} AND C2.name LIKE '%${name}%') AS count
     FROM scores S
     JOIN players I ON S.player_id = I.id
     JOIN courses C ON S.course_id = C.id
     WHERE S.chat_id = ${chatId} AND C.name LIKE '%${name}%'
     ORDER BY S.diff`
  );
}

export async function fetchScoresByCourseId(id: string | number, chatId: number): Promise<ScoreRow[]> {
  return query<ScoreRow[]>(
    `SELECT S.course_id AS courseId, I.name AS player, C.name AS course, S.sum, S.diff
     FROM scores S
     JOIN courses C ON S.course_id = C.id
     JOIN players I ON S.player_id = I.id
     WHERE S.chat_id = ${chatId} AND C.id = ${id}
     ORDER BY S.diff`
  );
}

export async function addAce(date: string, player_id: number, chat_id: number, course_id: number, competition_id: number): Promise<void> {
  await query(
    `INSERT INTO aces (date, player_id, chat_id, course_id, competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`
  );
  Logger.info(`ACE for player ${player_id} - added successfully`);
}

export async function addEagle(date: string, player_id: number, chat_id: number, course_id: number, competition_id: number): Promise<void> {
  await query(
    `INSERT INTO eagles (date, player_id, chat_id, course_id, competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`
  );
  Logger.info(`EAGLE for player ${player_id} - added successfully`);
}

export async function addAlbatross(date: string, player_id: number, chat_id: number, course_id: number, competition_id: number): Promise<void> {
  await query(
    `INSERT INTO albatrosses (date, player_id, chat_id, course_id, competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`
  );
  Logger.info(`ALBATROSS for player ${player_id} - added successfully`);
}
