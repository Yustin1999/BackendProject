const fs = require("fs")
const fetch = require("node-fetch");

const owner = 'Yustin1999';
const repo = 'LogFiles';
const folders = ["Misc", "Scoreboard", "WSEntry", "WSEntryExit", "WSExit", "WSMachineData"];
const token = process.env.GITHUB_TOKEN; // optional, for private repos or higher rate limit


async function fetchFolderContents(path) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/Logs/${path}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(data)
    return data.map(file => file.name); 
}

async function fetchAllFiles() {
    const allFiles = {};

    for (const folder of folders) {
        const files = await fetchFolderContents(folder);
        allFiles[folder] = files;
    }

    fs.writeFileSync("files_cache.json", JSON.stringify(allFiles, null, 2));
    console.log("File names cached from GitHub!");
}

fetchAllFiles();
