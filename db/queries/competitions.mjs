import db from "../connection.mjs";
import Logger from "js-logger";

export async function fetchUnfinishedCompetitions() {
  return query("SELECT * FROM competitions WHERE finished = false");
}

export async function fetchCompetitionsByChatId(chatId) {
  return query(
    `SELECT * FROM competitions WHERE chat_id = ${chatId} AND finished = false`
  );
}

export async function addCompetition(chatId, metrixId) {
  return query(
    `INSERT INTO competitions (finished, chat_id, metrix_id) VALUES (false, ${chatId}, ${metrixId})`
  );
}

export async function deleteCompetition(competitionId) {
  const data = await query(
    `DELETE FROM competitions WHERE id = ${competitionId}`
  );
  Logger.info(`Competition ${competitionId} removed successfully`);
  return data;
}

export async function markCompetitionFinished(id) {
  return query(`UPDATE competitions SET finished = true WHERE id = ${id}`);
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
