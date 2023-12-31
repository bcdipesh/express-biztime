/** Database setup for BizTime. */

const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = "postgresql://postgres:pgAdmin@localhost:5432/biztime_test";
} else {
  DB_URI = "postgresql://postgres:pgAdmin@localhost:5432/biztime";
}

const db = new Client({
  connectionString: DB_URI,
});

db.connect();

module.exports = db;
