import mysql from "./db.mjs";
import Logger from "js-logger";
import { loggerSettings } from "../logger.mjs";
Logger.useDefaults(loggerSettings);

export async function fetchPlayers() {
  let data = await new Promise((res, rej) => {
    mysql.query("SELECT * FROM players", function(error, results, fields) {
      if (error) {
        Logger.info(error);
      } else {
        res(results);
      }
    });
  });
  return JSON.parse(JSON.stringify(data));
}

export async function fetchPlayer(name) {
  let data = await new Promise((res, rej) => {
    mysql.query(`SELECT * FROM players WHERE name='${name}'`, function(
      error,
      results,
      fields
    ) {
      if (error) {
        Logger.info(error);
      } else {
        res(results);
      }
    });
  });
  return JSON.parse(JSON.stringify(data));
}

export async function addPlayer(name, chatId) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO players (name) SELECT * FROM (SELECT '${name}') AS tmp WHERE NOT EXISTS (SELECT * FROM players WHERE name = '${name}')`,
      async function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
          results.affectedRows > 0
            ? Logger.info(`Player: ${name} - added succesfully`)
            : Logger.debug(`Player: ${name} - already exists, nothing to do`);
        }
      }
    );
  });
  return data;
}

export async function fetchPlayersLinkedToChat(chatId) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `SELECT * FROM player_to_chat INNER JOIN players ON player_to_chat.player_id=players.id WHERE chat_id = ${chatId}`,
      function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
        }
      }
    );
  });
  return JSON.parse(JSON.stringify(data));
}

export async function fetchChat(id) {
  let data = await new Promise((res, rej) => {
    mysql.query(`SELECT * FROM chats WHERE id = '${id}'`, function(
      error,
      results,
      fields
    ) {
      if (error) {
        Logger.info(error);
      } else {
        res(results);
      }
    });
  });
  return JSON.parse(JSON.stringify(data));
}

export async function fetchChats() {
  let data = await new Promise((res, rej) => {
    mysql.query("SELECT * FROM chats", function(error, results, fields) {
      if (error) {
        Logger.info(error);
      } else {
        res(results);
      }
    });
  });
  return JSON.parse(JSON.stringify(data));
}

export async function addChatIfUndefined(chatId, chatName) {
  let exists = await fetchChat(chatId);
  if (exists.length === 0) {
    let data = await new Promise((res, rej) => {
      mysql.query(
        `INSERT INTO chats(id, name) VALUES (${chatId}, '${chatName}')`,
        function(error, results, fields) {
          if (error) {
            Logger.error(error);
          } else {
            res(results);
            Logger.info(`Added new chat: ${chatId}, ${chatName}`);
          }
        }
      );
    });
    return JSON.parse(JSON.stringify(data));
  }
}

export async function addPlayerToPlayerToChat(playerName, chatId) {
  const player = await fetchPlayer(playerName);
  const data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO player_to_chat(player_id, chat_id) SELECT * FROM (SELECT ${player[0].id}, ${chatId}) AS tmp WHERE NOT EXISTS (SELECT * FROM player_to_chat WHERE player_id = ${player[0].id} AND chat_id = ${chatId})`,
      function(error, results, fields) {
        if (error) {
          Logger.error(error);
        } else {
          res(results);
          results.affectedRows > 0
            ? Logger.info(`Added player ${player[0].id} to Chat ${chatId}`)
            : Logger.info(
                `Player ${player[0].id} already in the chat: ${chatId}`
              );
        }
      }
    );
  });
  return JSON.parse(JSON.stringify(data));
}

export async function deletePlayerFromPlayerToChat(player, chatId) {
  const data = await new Promise((res, rej) => {
    mysql.query(
      `DELETE FROM player_to_chat WHERE player_id = ${player[0].id}`,
      function(error, results, fields) {
        if (error) {
          Logger.error(error);
        } else {
          res(results);
          Logger.info(`Player ${player[0].id} removed from chat ${chatId}`);
        }
      }
    );
  });
  return JSON.parse(JSON.stringify(data));
}

export async function fetchUnfinishedCompetitions() {
  const data = await new Promise((res, rej) => {
    mysql.query(`SELECT * FROM competitions WHERE finished = false`, function(
      error,
      results,
      fields
    ) {
      if (error) {
        Logger.error(error);
      } else {
        res(results);
      }
    });
  });
  return JSON.parse(JSON.stringify(data));
}

export async function fetchCompetitionsByChatId(chatId) {
  const data = await new Promise((res, rej) => {
    mysql.query(
      `SELECT * FROM competitions WHERE chat_id = ${chatId} AND finished = false`,
      function(error, results, fields) {
        if (error) {
          Logger.error(error);
        } else {
          res(results);
        }
      }
    );
  });
  return JSON.parse(JSON.stringify(data));
}

export async function addCompetition(chatId, metrixId) {
  const data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO competitions (finished, chat_id, metrix_id) VALUES (false, ${chatId}, ${metrixId})`,
      function(error, results, fields) {
        if (error) {
          Logger.error(error);
        } else {
          res(results);
        }
      }
    );
  });
  return JSON.parse(JSON.stringify(data));
}

export async function deleteCompetition(competitionId, chatId) {
  const data = await new Promise((res, rej) => {
    mysql.query(
      `DELETE FROM competitions WHERE id = ${competitionId}`,
      function(error, results, fields) {
        if (error) {
          Logger.error(error);
        } else {
          res(results);
          Logger.info(
            `Competition with id ${competitionId} removed succesfully`
          );
        }
      }
    );
  });
  return JSON.parse(JSON.stringify(data));
}

export async function markCompetitionFinished(id) {
  const data = await new Promise((res, rej) => {
    mysql.query(
      `UPDATE competitions SET finished = true WHERE id = ${id}`,
      function(error, results, fields) {
        if (error) {
          Logger.error(error);
        } else {
          res(results);
        }
      }
    );
  });
  return JSON.parse(JSON.stringify(data));
}

export async function fetchCourse(name) {
  let data = await new Promise((res, rej) => {
    mysql.query(`SELECT * FROM courses WHERE name='${name}'`, function(
      error,
      results,
      fields
    ) {
      if (error) {
        Logger.info(error);
      } else {
        res(results);
      }
    });
  });
  return JSON.parse(JSON.stringify(data));
}

export async function addCourse(name) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO courses (name) SELECT * FROM (SELECT '${name}') AS tmp WHERE NOT EXISTS (SELECT * FROM courses WHERE name = '${name}')`,
      async function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
          results.affectedRows > 0
            ? Logger.info(`Course: ${name} - added succesfully`)
            : Logger.debug(`Course: ${name} - already exists, nothing to do.`);
        }
      }
    );
  });
  return data;
}

export async function addResults(
  player_id,
  chat_id,
  course_id,
  competition_id,
  diff,
  sum
) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO scores (player_id, chat_id, course_id, competition_id, diff, sum) VALUES (${player_id}, ${chat_id}, ${course_id}, ${competition_id}, ${diff}, ${sum})`,
      async function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
          results.affectedRows > 0
            ? Logger.info(`Score for player: ${player_id} - added succesfully`)
            : Logger.debug(
                `Score for player ${player_id} in competition ${competition_id} - already exists, nothing to do`
              );
        }
      }
    );
  });
  return data;
}

export async function fetchScoresByCourseName(name, chatId) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `SELECT S.course_id AS courseId, I.name AS player, C.name AS course, S.sum, S.diff,
        (SELECT COUNT(DISTINCT S2.course_id) FROM scores S2 JOIN courses C2 ON S2.course_id = C2.id
         WHERE S2.chat_id = ${chatId} AND C2.name LIKE '%${name}%') AS count
       FROM scores S
       JOIN players I ON S.player_id = I.id
       JOIN courses C ON S.course_id = C.id
       WHERE S.chat_id = ${chatId} AND C.name LIKE '%${name}%'
       ORDER BY S.diff`,
      function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
        }
      }
    );
  });
  return JSON.parse(JSON.stringify(data));
}

export async function fetchScoresByCourseId(id, chatId) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `SELECT S.course_id AS courseId, I.name AS player, C.name AS course, S.sum, S.diff
       FROM scores S
       JOIN courses C ON S.course_id = C.id
       JOIN players I ON S.player_id = I.id
       WHERE S.chat_id = ${chatId} AND C.id = ${id}
       ORDER BY S.diff`,
      function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
        }
      }
    );
  });
  return JSON.parse(JSON.stringify(data));
}

export async function addAce(date, player_id, chat_id, course_id, competition_id) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO aces (date, player_id, chat_id, course_id, competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`,
      async function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
          Logger.info(`ACE for player: ${player_id} - added succesfully`);
        }
      }
    );
  });
  return data;
}

export async function addEagle(date, player_id, chat_id, course_id, competition_id) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO eagles (date, player_id, chat_id, course_id, competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`,
      async function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
          Logger.info(`EAGLE for player: ${player_id} - added succesfully`);
        }
      }
    );
  });
  return data;
}

export async function addAlbatross(date, player_id, chat_id, course_id, competition_id) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO albatrosses (date, player_id, chat_id, course_id, competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`,
      async function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
          Logger.info(`ALBATROSS for player: ${player_id} - added succesfully`);
        }
      }
    );
  });
  return data;
}
