


const express = require("express")
const path = require("path")
const cors = require("cors")
const fetch = require("node-fetch");
const app = express();
const Database = require("better-sqlite3");
app.use(cors());
app.use(express.json());



//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

app.get('/api/folder/:folderName/logs', async (req, res) => {
    const folderName = req.params.folderName;
    const repoOwner = 'Yustin1999';
    const repoName = 'LogFiles';
    const branch = 'main';
    const folderPath = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/Logs/${folderName}?ref=${branch}`;
    try {
        const response = await fetch(folderPath, {
            headers: {
                'User-Agent': 'Node.js',
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token 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`
            }
        });
    });
        if (!response.ok) {
            const text = await response.text();
            console.error('GitHub API error response:', text);
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

app.get('/api/userdata', (req, res) => {
    const db = new Database("./Data/userdata.db");
    const rows = db.prepare("SELECT * FROM userdata").all();
    res.json(rows);
    db.close();
}); 
app.get('/api/userLogData', (req, res) => {
    const db = new Database("./Data/userlogs.db");
    const rows = db.prepare("SELECT * FROM userlog").all();
    res.json(rows);
    db.close();
});
app.post('/api/updateUser', (req, res) => {
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
}); 

app.post('/api/userLog', (req, res) => {
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
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});

