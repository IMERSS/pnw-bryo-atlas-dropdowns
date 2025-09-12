// drive-public-list.js
const { google } = require("googleapis");
const path = require("path");

// Replace with your API key
const API_KEY = "AIzaSyBv3_4i8kYbzDanp5PhrflNX5aajEWUCkc";

// Public folder ID
const ROOT_FOLDER_ID = "1B1QBo3woWDlQ7L_wG9FEbQhkKfqye_U2";

// Initialize Drive client with API key
const drive = google.drive({ version: "v3", auth: API_KEY });

async function listFolder(folderId, relativePath = "") {
    let pageToken = null;

    do {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: "nextPageToken, files(id, name, mimeType)",
            pageToken,
            pageSize: 1000
        });
        console.log("Got response with ", res.data.files.length, " files");

        for (const file of res.data.files) {
            const relPath = path.join(relativePath, file.name);
            console.log(`${file.id}\t${relPath}`);

            if (file.mimeType === "application/vnd.google-apps.folder") {
                await listFolder(file.id, relPath);
            }
        }

        pageToken = res.data.nextPageToken;
    } while (pageToken);
}

// Run
listFolder(ROOT_FOLDER_ID).catch(console.error);
