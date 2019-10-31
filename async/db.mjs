import mysql from "mysql";
import dotenv from "dotenv";
dotenv.config();

let connection = mysql.createConnection({
  host: process.env.DB_HOST, // eslint-disable-line
  user: process.env.DB_USERNAME, // eslint-disable-line
  password: process.env.DB_PASSWORD, // eslint-disable-line
  database: process.env.DB_NAME // eslint-disable-line
});

connection.connect(function(err) {
  if (err) throw err;
});

export default connection;
