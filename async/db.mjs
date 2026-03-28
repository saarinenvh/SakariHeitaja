import mysql from "mysql";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST, // eslint-disable-line
  user: process.env.DB_USERNAME, // eslint-disable-line
  password: process.env.DB_PASSWORD, // eslint-disable-line
  database: process.env.DB_NAME, // eslint-disable-line
  connectionLimit: 10,
  acquireTimeout: 10000,
});

export default pool;
