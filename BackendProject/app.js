const fs = require("fs")
require('dotenv').config();
const sql = require('postgres')
const express = require("express")
const path = require("path")
const cors = require("cors")
const fetch = require("node-fetch");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
app.use(cors());
app.use(express.json());
const db = sql(process.env.CONNECTION_STRING);
const JWT_SECRET = process.env.JWT_SECRET


app.get('/api/folder/:folderName/logs', (req, res) => {
    const folderName = req.params.folderName;
    try {
        
        const data = JSON.parse(fs.readFileSync("./Data/files_cache.json", "utf8"));
        const folder1Files = data[folderName];
        console.log(folder1Files);

        
        res.json(folder1Files);
    } catch (err) {
        console.error("Error reading cache:", err);
        res.status(500).json({ error: "Failed to read cached file list" });
    }
});
/*app.get('/api/folder/:folderName/logs', async (req, res) => {
    const folderName = req.params.folderName;
    const repoOwner = 'Yustin1999';
    const repoName = 'LogFiles';
    const branch = 'main';
    const folderPath = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/Logs/${folderName}?ref=${branch}`;
    try {
        const response = await fetch(folderPath);
        
        if (!response.ok) {
            const text = await response.text();
            console.error('GitHub API error response:', text);
            return res.status(response.status).json({ error: text });
        }
        const files = await response.json();
        const txtFiles = files
            .filter(file => file.type === 'file' && path.extname(file.name).toLowerCase() === '.txt')
            .map(file => ({
                name: file.name,
                download_url: file.download_url
            }));
        res.json(txtFiles)
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching folder contents' });
    }

});*/



app.get('/api/folder/:folderName/:filename', async (req, res) => {
    const folderName = req.params.folderName;
    const filename = req.params.filename
    const repoOwner = 'Yustin1999';
    const repoName = 'LogFiles';
    const branch = 'main';
    const folderUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/Logs/${folderName}/${filename}`;

    try {
        const response = await fetch(folderUrl)
        if (!response.ok) {
            return res.status(404).send('File not found on Github')
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'text/plain');

        response.body.pipe(res);
    } catch (err) {
        console.error('Error fetching file:', err)
        res.status(500).send('Error downloading file');
    }

   
});
const PORT = process.env.PORT || 4000;

/*app.get('/api/userdata', (req, res) => {
    const db = new Database("./Data/userdata.db");
    const rows = db.prepare("SELECT * FROM userdata").all();
    res.json(rows);
    db.close();
});*/

app.get('/api/userdata', async (req, res) => {
    

    try {
        const users = await db`SELECT * FROM users
            ORDER BY id ASC;  -- ascending order by ID
        ;`; 
        res.json(users); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

/*app.get('/api/userLogData', (req, res) => {
    const db = new Database("./Data/userlogs.db");
    const rows = db.prepare("SELECT * FROM userlog").all();
    res.json(rows);
    db.close();
});*/
app.get('/api/userLogData', async (req, res) => {
    
    try {
        const logs = await db`SELECT * FROM userlog
            ORDER BY created_at ASC
            LIMIT 15
        ;`;
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database query failed' });
    }
});


/*app.post('/api/updateUser', (req, res) => {
    const db = new Database("./Data/userdata.db");
    const { id, authorization } = req.body; // data from frontend
    console.error(req.body)
    if (id === undefined || authorization === undefined) {
        return res.status(400).json({ error: "Missing id or authorised" });
    }

    try {
        const db = new Database("./Data/userdata.db");

        // UPDATE statement
        const stmt = db.prepare("UPDATE userdata SET authorization = ? WHERE id = ?");
        const info = stmt.run(authorization, id); // run the update

        db.close();

        // info.changes tells you how many rows were updated
        if (info.changes === 0) {
            return res.status(404).json({ error: "No row found with this id" });
        }

        res.json({ success: true, changes: info.changes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
}); */
app.post('/api/updateUser', async (req, res) => {
    
    const { id, is_authorised } = req.body;
    console.log(req.body)
    if (id === undefined || is_authorised === undefined) {
        return res.status(400).json({ error: "Missing id or authorization" });
    }

    try {
        // UPDATE statement
        const result = await db`
            UPDATE users
            SET is_authorised = ${is_authorised}
            WHERE id = ${id}
            RETURNING *;
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: "No row found with this id" });
        }

        res.json({ success: true, updated: result[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (email === undefined || password === undefined) {
        return res.status(400).json({ error: "Invalid credentials" });
    }
    try {
        const user = await db`
          SELECT id, email, password
          FROM userlogin
          WHERE email = ${email}
          LIMIT 1
        `;
       const valid = await bcrypt.compare(password, user[0].password);
        if (!valid) {
            return { success: false, message: 'Invalid credentials' };
        } 
        const token = jwt.sign({ id: user[0].id, email: user[0].email }, JWT_SECRET, {
            expiresIn: "10m",
        });
        res.json({ token });
        console.log("Generated token:", token);    
        

        
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }

});

/*app.get("/api/JWTcheck", authenticateToken, async (req, res) => {
    console.log('Decoded JWT payload:', req.user);

    try {
        // Use values from the token
        const user = await db`
      SELECT id, email
      FROM userlogin
      WHERE id = ${req.user.id}
      LIMIT 1
    `;

        if (!user || user.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            id: user[0].id,
            email: user[0].email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});*/

/*app.post('/api/userLog', (req, res) => {
    const db = new Database("./Data/userlogs.db");
    const { username, email, prevAuth, currentAuth } = req.body;
    console.log("Request body:", req.body);

    if (!username || !email || !prevAuth || !currentAuth) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO userlog (username, email, prevAuth, currentAuth) 
            VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(username, email, prevAuth, currentAuth);

        res.json({ success: true, insertedId: info.lastInsertRowid });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Database error" });
    }
});*/
app.post('/api/userLog', async (req, res) => {
    
    const { username, email, prevAuth, currentAuth } = req.body;

    if (username === undefined || email === undefined || prevAuth === undefined || currentAuth === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // UPDATE statement
        const result = await db`
            INSERT INTO userlog (username, email, prev_auth, current_auth)
            VALUES(${username},${email},${prevAuth},${currentAuth})
            RETURNING *;
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: "No row found with this id" });
        }

        res.json({ success: true, updated: result[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});

