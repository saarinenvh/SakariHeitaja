import mysql from "./db.mjs";
import Logger from "js-logger";
import { loggerSettings } from "./logger.mjs";
Logger.useDefaults(loggerSettings);

export async function fetchPlayers() {
  let data = "";
  mysql.query("SELECT * FROM Players", function(error, results, fields) {
    if (error) throw error;
    data = results;
    return data;
  });
}

export async function fetchPlayer(name) {
  let data = await new Promise((res, rej) => {
    mysql.query(`select * from Players WHERE name='${name}'`, function(
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
      `INSERT INTO Players (name) SELECT * FROM (SELECT '${name}') AS tmp WHERE NOT EXISTS (SELECT * FROM Players WHERE name = '${name}')`,
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

// TODO
export async function fetchPlayersLinkedToChat(chatId) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `select * from PlayerToChat INNER JOIN Players ON PlayerToChat.player_id=Players.id WHERE chat_id = ${chatId}`,
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
    mysql.query(`SELECT * FROM Chats where id = '${id}'`, function(
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
    mysql.query("SELECT * FROM Chats", function(error, results, fields) {
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
        `INSERT INTO Chats(id, name) VALUES (${chatId}, '${chatName}')`,
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
      `INSERT INTO PlayerToChat(player_id, chat_id) SELECT * FROM (SELECT ${player[0].id}, ${chatId}) AS tmp WHERE NOT EXISTS (SELECT * FROM PlayerToChat WHERE player_id = ${player[0].id} AND chat_id = ${chatId})`,
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
      `DELETE FROM PlayerToChat WHERE player_id = ${player[0].id}`,
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
    mysql.query(`SELECT * FROM Competitions where finished = false`, function(
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
      `SELECT * FROM Competitions where chatId = chatId AND finished = false`,
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
      `INSERT INTO Competitions (finished, chatId, metrixId) VALUES (false, ${chatId}, ${metrixId})`,
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
      `DELETE FROM Competitions where id = ${competitionId}`,
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
      `UPDATE Competitions SET finished = true where id = ${id}`,
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
    mysql.query(`select * from Courses WHERE name='${name}'`, function(
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
      `INSERT INTO Courses (name) SELECT * FROM (SELECT '${name}') AS tmp WHERE NOT EXISTS (SELECT * FROM Courses WHERE name = '${name}')`,
      async function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
          results.affectedRows > 0
            ? Logger.info(`Course: ${name} - added succesfully`)
            : Logger.debug(`Course: ${name} - already exists, nothing to do`);
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
      `INSERT INTO Scores (player_id,
        chat_id,
        course_id,
        competition_id,
        diff,
        sum) VALUES (${player_id}, ${chat_id}, ${course_id}, ${competition_id}, ${diff}, ${sum})`,
      async function(error, results, fields) {
        if (error) {
          Logger.info(error);
        } else {
          res(results);
          results.affectedRows > 0
            ? Logger.info(`Score for player: ${player_id} - added succesfully`)
            : Logger.debug(
                `Score for player ${player_id} in competition ${competition_id}- already exists, nothing to do`
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
      `select I.name AS player, C.name as course, S.sum, S.diff, (SELECT COUNT (DISTINCT S2.course_id) from Scores S2 JOIN Courses C2 ON S2.course_id = C2.id where S2.chat_id = ${chatId} AND C2.name LIKE '%${name}%') AS count from Scores S JOIN Players I ON S.player_id = I.id JOIN Courses C ON S.course_id = C.id WHERE chat_id = ${chatId} and C.name LIKE '%${name}%'`,
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

export async function addAce(
  date,
  player_id,
  chat_id,
  course_id,
  competition_id
) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO Aces (date,
        player_id,
        chat_id,
        course_id,
        competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`,
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

export async function addEagle(
  date,
  player_id,
  chat_id,
  course_id,
  competition_id
) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO Eagles (date,
        player_id,
        chat_id,
        course_id,
        competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`,
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

export async function addAlbatross(
  date,
  player_id,
  chat_id,
  course_id,
  competition_id
) {
  let data = await new Promise((res, rej) => {
    mysql.query(
      `INSERT INTO Albatrosses (date,
        player_id,
        chat_id,
        course_id,
        competition_id) VALUES ('${date}', ${player_id}, ${chat_id}, ${course_id}, ${competition_id})`,
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
