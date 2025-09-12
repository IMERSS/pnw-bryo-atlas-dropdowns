/* eslint-env node */

"use strict";

const fs = require("fs");
const path = require("path");
const { stringify } = require("csv-stringify/sync");
const { google } = require("googleapis");

const {readCSV} = require("./utils.js");

const SERVICE_ACCOUNT_KEY_FILE = "pnw-bryo-atlas-e1fb9a5765ea.json";

// === AUTH ===
const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

async function downloadDriveFile(fileId, destPath) {

    const res = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
    );

    return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream(destPath);
        res.data
            .on("end", () => {
                console.log(`Downloaded ${destPath}`);
                resolve();
            })
            .on("error", (err) => {
                reject(new Error(`Error downloading file ${fileId}: ${err.message}`));
            })
            .pipe(dest);
    });
}

// Download first sheet of a Google Spreadsheet as CSV
async function downloadSheet(sheetId, destPath, sheetName = null) {
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

    // If no sheetName given, default to first sheet
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const targetSheet = sheetName || meta.data.sheets[0].properties.title;

    const result = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: targetSheet,
    });

    const rows = result.data.values || [];

    // Convert array-of-arrays to CSV
    const csv = stringify(rows);
    fs.writeFileSync(destPath, csv, "utf8");
    console.log(`Downloaded sheet "${targetSheet}" to ${destPath}`);
}

// Ensure directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function main() {
    // Download CSV files
    await downloadDriveFile("1HFDMBxvYIAr0V_yi8KpoVSmhbWBpVRb1", "tabular_data/GBIF-catalogue.csv");
    // BC Bryo Guide (Google Sheets → first sheet as CSV)
    await downloadSheet("1MG7C7GX1Tl2RO_vHuMwUo8quhzYZd_mElWRnPuNbpj8", "tabular_data/BC_Bryo_Guide.csv");

    const rstart = Date.now();
    // Load GBIF catalogue (tab-delimited)
    const rawGbif = await readCSV("tabular_data/GBIF-catalogue.csv", {
        separator: "\t",
        escape: undefined,
        quote: undefined
    });
    const relapsed = ((Date.now() - rstart) / 1000).toFixed(2);
    console.log(`\nRead ${rawGbif.length} records in ${relapsed} s`);

    // Drop unwanted columns
    const dropCols = [
        "depth",
        "depthAccuracy",
        "occurrenceStatus",
        "stateProvince",
        "countryCode",
        "verbatimScientificName",
        "mediaType",
        "issue"
    ];
    const gbif = rawGbif.map(row => {
        const newRow = { ...row };
        dropCols.forEach(col => delete newRow[col]);
        return newRow;
    });

    // Recode basisOfRecord
    gbif.forEach((row, idx) => {
        const rec = gbif[idx].basisOfRecord;
        if (rec === "PRESERVED_SPECIMEN") {
            row.basisOfRecord = "Herbarium record";
        } else if (rec === "HUMAN_OBSERVATION") {
            row.basisOfRecord = "iNat record";
        } else {
            row.basisOfRecord = rec;
        }
    });

    const taxa = await readCSV("tabular_data/BC_Bryo_Guide.csv");

    // Prepare output folder
    ensureDir("taxa_records");

    const start = Date.now();

    // Iterate over each taxon
    for (const { taxon: taxonName } of taxa) {
        const subset = gbif.filter(row => row.species === taxonName);

        const filePath = path.join("taxa_records", `${taxonName}.csv`);
        const csv = stringify(subset, { header: true });

        fs.writeFileSync(filePath, csv, "utf8");
        console.log(`wrote ${subset.length} lines to file ${filePath}`);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Wrote ${taxa.length} files in ${elapsed} s`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
