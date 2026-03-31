const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const pool = mysql.createPool(dbConfig);

pool.getConnection()
  .then((connection) => {
    console.log("Successfully connected to the MySQL database.");
    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

module.exports = pool;
