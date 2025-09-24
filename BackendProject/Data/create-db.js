/*const bcrypt = require("bcrypt");
const Database = require("better-sqlite3");

const db = new Database("./users.db");

const email = "test@example.com";
const plainPassword = "mypassword";

(async () => {
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
        .run(email, passwordHash);

    console.log("Dummy user inserted with hashed password");
})();*/
require('dotenv').config();
const sql = require('postgres');
const db = sql('postgresql://postgres.wrylnvsqoyfrlhiqdzvi:NpRDlsO5P7QZ9OKp@aws-1-eu-west-2.pooler.supabase.com:5432/postgres');
const bcrypt = require("bcrypt");

(async () => {
    try {
        const email = "test@example.com";
        const password = "mypassword";

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert into the DB
        const result = await db`
      INSERT INTO userlogin (email, password)
      VALUES (${email}, ${passwordHash})
      RETURNING *;
    `;

        console.log("Dummy user inserted:", result[0]);
    } catch (err) {
        console.error("Error inserting user:", err);
    } finally {
        await db.end(); // close connection
    }
})();


