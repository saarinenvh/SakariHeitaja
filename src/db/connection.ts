import mysql, { MysqlError } from "mysql";
import dotenv from "dotenv";
import Logger from "js-logger";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  acquireTimeout: 10000,
});

export function query<T = any>(sql: string): Promise<T> {
  return new Promise((resolve, reject) => {
    pool.query(sql, (error: MysqlError | null, results: any) => {
      if (error) {
        Logger.error(error);
        reject(error);
      } else {
        resolve(JSON.parse(JSON.stringify(results)));
      }
    });
  });
}

export default pool;
