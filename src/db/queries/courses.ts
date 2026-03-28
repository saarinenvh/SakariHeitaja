import { query } from "../connection";
import Logger from "js-logger";

export interface Course {
  id: number;
  name: string;
}

export async function fetchCourse(name: string): Promise<Course[]> {
  return query<Course[]>(`SELECT * FROM courses WHERE name='${name}'`);
}

export async function addCourse(name: string): Promise<void> {
  const data = await query<{ affectedRows: number }>(
    `INSERT INTO courses (name) SELECT * FROM (SELECT '${name}') AS tmp WHERE NOT EXISTS (SELECT * FROM courses WHERE name = '${name}')`
  );
  data.affectedRows > 0
    ? Logger.info(`Course: ${name} - added successfully`)
    : Logger.debug(`Course: ${name} - already exists, nothing to do`);
}
