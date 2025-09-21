const Database = require("better-sqlite3");
const db = new Database('./users.db');


const insert = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");

// Example values
const email = "alice@example.com";
const passwordHash = "hashedpassword123";


const result = insert.run(email, passwordHash)

db.close();