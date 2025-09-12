/* eslint-env node */

"use strict";

const csvParser = require("csv-parser");
const csvStringify = require("csv-stringify/sync").stringify;
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const envFile = "env.json";

function execHugo() {
    let hugoCmd = "hugo"; // fallback default

    if (fs.existsSync(envFile)) {
        try {
            const envConfig = JSON.parse(fs.readFileSync(envFile, "utf8"));
            if (envConfig.HUGO_PATH) {
                hugoCmd = envConfig.HUGO_PATH;
            }
        } catch (err) {
            console.error("Failed to read env.json:", err);
        }
    }

    const hugo = spawn(hugoCmd, process.argv.slice(2), { stdio: "inherit" });

    hugo.on("error", (err) => {
        console.error("Failed to start Hugo:", err.message);
        process.exit(1);
    });

    hugo.on("exit", (code) => {
        process.exit(code);
    });
}

/**
 * Read a CSV file into memory using csv-parser.
 * @param {String} filePath - Path to CSV file.
 * @param {Object} [options={}] - Options passed to csv-parser.
 * @return {Promise<Object[]>} - Resolves with array of row objects.
 */
function readCSV(filePath, options = {}) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`CSV file does not exist: ${filePath}`);
    }
    console.log(`Reading CSV from ${filePath}`);

    return new Promise((resolve, reject) => {
        const rows = [];
        const parserOptions = {
            separator: ",",
            mapHeaders: ({ header }) => header ? header.trim() : header,
            ...options
        };

        fs.createReadStream(filePath)
            .pipe(csvParser(parserOptions))
            .on("data", row => {
                rows.push(row);
                if ((rows.length % 1000) === 0) {
                    process.stdout.write(rows.length + "...");
                }
            })
            .on("end", () => {
                console.log("");
                resolve(rows);
            })
            .on("error", reject);
    });
}

function writeCSV(filePath, rows) {
    const csv = csvStringify(rows, { header: true });
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, csv);
}

module.exports = {readCSV, writeCSV, execHugo};
