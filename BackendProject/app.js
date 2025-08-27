
//import { fileURLToPath } from "url";

const express = require("express")
const path = require("path")
const cors = require("cors")
const fetch = require("node-fetch");
const app = express();

app.use(cors());


app.get('/api/folder/:folderName/logs', async (req, res) => {
    const folderName = req.params.folderName;
    const repoOwner = 'Yustin1999';
    const repoName = 'LogFiles';
    const branch = 'main';
    const folderPath = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/Logs/${folderName}?ref=${branch}`;
    try {
        const response = await fetch(folderPath);
        if (!response.ok) return res.status(500).json({ error: 'Cannot fetch folder from GitHub' });
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
    const folderUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/Logs/${folderName}/${filename}?ref=${branch}`;

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

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});

