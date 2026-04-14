const mysql = require("mysql2/promise");

// Establish the DB connection
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // Added port configuration
};

// Create a connection pool for better performance and concurrency
// instead of single connection pool maintains multiple open connections to the db
// slightly more memory requirements than single connection
// for production ready use pool
const pool = mysql.createPool(dbConfig);

// Test the database connection on startup
pool.getConnection()
  .then((connection) => {
    console.log("Successfully connected to the MySQL Filess.io Remote database.");
    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

module.exports = pool;
