import db from "../connection.mjs";
import Logger from "js-logger";

export async function fetchCourse(name) {
  return query(`SELECT * FROM courses WHERE name='${name}'`);
}

export async function addCourse(name) {
  const data = await query(
    `INSERT INTO courses (name) SELECT * FROM (SELECT '${name}') AS tmp WHERE NOT EXISTS (SELECT * FROM courses WHERE name = '${name}')`
  );
  data.affectedRows > 0
    ? Logger.info(`Course: ${name} - added successfully`)
    : Logger.debug(`Course: ${name} - already exists, nothing to do`);
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
