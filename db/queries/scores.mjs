import db from "../connection.mjs";
import Logger from "js-logger";

export async function addResults(player_id, chat_id, course_id, competition_id, diff, sum) {
  const data = await query(
    `INSERT INTO scores (player_id, chat_id, course_id, competition_id, diff, sum) VALUES (${player_id}, ${chat_id}, ${course_id}, ${competition_id}, ${diff}, ${sum})`
  );
  Logger.info(`Score for player ${player_id} - added successfully`);
  return data;
}

export async function fetchScoresByCourseName(name, chatId) {
  return query(
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

export async function fetchScoresByCourseId(id, chatId) {
  return query(
    `SELECT S.course_id AS courseId, I.name AS player, C.name AS course, S.sum, S.diff
     FROM scores S
     JOIN courses C ON S.course_id = C.id
     JOIN players I ON S.player_id = I.id
     WHERE S.chat_id = ${chatId} AND C.id = ${id}
     ORDER BY S.diff`
  );
}

export async function addAce(date, player_id, chat_id, course_id, competition_id) {
  const data = await query(
    `INSERT INTO aces (date, player_id, chat_id, course_id, competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`
  );
  Logger.info(`ACE for player ${player_id} - added successfully`);
  return data;
}

export async function addEagle(date, player_id, chat_id, course_id, competition_id) {
  const data = await query(
    `INSERT INTO eagles (date, player_id, chat_id, course_id, competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`
  );
  Logger.info(`EAGLE for player ${player_id} - added successfully`);
  return data;
}

export async function addAlbatross(date, player_id, chat_id, course_id, competition_id) {
  const data = await query(
    `INSERT INTO albatrosses (date, player_id, chat_id, course_id, competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`
  );
  Logger.info(`ALBATROSS for player ${player_id} - added successfully`);
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
