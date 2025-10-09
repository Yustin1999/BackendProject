const fs = require("fs")
require('dotenv').config();
const sql = require('postgres')
const express = require("express")
const path = require("path")
const cors = require("cors")
const fetch = require("node-fetch");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { group } = require("console");
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

app.get('/api/archive', (req, res) => {
    
    try {
        const data = JSON.parse(fs.readFileSync("./Data/files_cache.json", "utf8"));
        const keys = Object.keys(data);
        const groupedData = [];
        const length = data[keys[0]].length; 
        for (let i = 0; i < length; i++) {
            const group = [];
            for (let key of keys) {
                group.push(data[key][i]);
            }
            groupedData.push(group);
        }

        res.json(groupedData);
        //res.json(data);
        console.log(groupedData);
    } catch (err) {
        console.error("Error reading cache:", err);
        res.status(500).json({ error: "Failed to read cached file list" });
    }
});

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

