require('dotenv').config();
const sql = require('postgres');
const db = sql('postgresql://postgres.wrylnvsqoyfrlhiqdzvi:NpRDlsO5P7QZ9OKp@aws-1-eu-west-2.pooler.supabase.com:5432/postgres');

(async () => {
        try {
            const logs = await db`SELECT * FROM userlog;`;
            console.log(logs)
        } catch (err) {
            console.error("Error inserting user:", err);
        } finally {
            await db.end(); // close connection
        }
})();