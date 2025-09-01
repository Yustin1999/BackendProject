const Database = require('better-sqlite3');
const path = require('path');

// Open your database file

const db = new Database('./userlogs.db');

// Fetch all rows from the table
const rows = db.prepare("SELECT * FROM userlog").all();

// Print them
console.log("Current userlog table contents:");
console.table(rows);