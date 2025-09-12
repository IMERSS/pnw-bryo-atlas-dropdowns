/* eslint-env node */

"use strict";

const fetch = require("node-fetch");
const fetchRanks = ["phylum", "class", "order", "family", "genus"];

const phylumToKey = {};

async function fetchPhylumKey(phylum) {
    const key = phylumToKey[phylum];
    if (!key) {
        const url = `https://api.gbif.org/v2/species/match?scientificName=${phylum}&taxonRank=PHYLUM`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch GBIF for ${phylum}: ${res.status}`);
        }
        const data = await res.json();
        const looked = data.usage.key;
        phylumToKey[phylum] = looked;
        return looked;
    } else {
        return key;
    }
};

const rankMatch = match => (match.synonym ? 1 : 0) + (match.taxonomicStatus === "DOUBTFUL" ? 2 : 0);

async function queryGbif(scientificName, phylum, higherTaxa, verbose) {
    scientificName = scientificName.replace(/ (\(.*\))/g, "");
    const url = `https://api.gbif.org/v2/species/match?scientificName=${encodeURIComponent(scientificName)}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch GBIF for ${scientificName}: ${res.status}`);
    }
    const data = await res.json();
    if (verbose) {
        console.log(data);
    }

    const result = {};
    result.matchType = data.diagnostics.matchType;
    // Some matches are ambiguous/failed - look them up using the slower v1 "search" API to fill in
    if (result.matchType === "NONE" || data.usage.canonicalName !== scientificName) {
        const phylumKey = await fetchPhylumKey(phylum);
        const searchUrl = `https://api.gbif.org/v1/species/search?higherTaxonKey=${phylumKey}&q=${encodeURIComponent(scientificName)}`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) {
            throw new Error(`Failed subsidiary search for ${scientificName}: ${searchRes.status}`);
        }
        const searchData = await searchRes.json();
        // Eliminate anything doubtful and that was not an exact match, and put synonyms to the end
        // Test cases Buckiella and Anthelia
        const filtered = searchData.results.filter(result => result.canonicalName === scientificName)
            .sort((a, b) => rankMatch(a) - rankMatch(b));
        if (verbose) {
            console.log(filtered);
        }
        const first = filtered[0];
        if (first) {
            for (const val of Object.values(first.higherClassificationMap)) {
                higherTaxa[val] = phylum;
            }
            fetchRanks.forEach(fetchRank => result[fetchRank] = first[fetchRank]);

            result.gbifTaxonId = first.key;
            result.matchType = first.taxonomicStatus || "subsidiary";
            result.rank = first.rank;
        }
    } else {
        result.gbifTaxonId = data.usage.key || "";
        result.rank = data.usage.rank || "";

        for (const entry of data.classification) {
            if (entry.name) {
                higherTaxa[entry.name] = phylum;
            }
            const rank = entry.rank.toLowerCase();
            if (fetchRanks.includes(rank)) {
                result[rank] = entry.name;
            }
        }
        // Ensure to query a non-accepted genus that we nonetheless get a match for
        const queriedGenus = data.usage.genericName;
        if (queriedGenus) {
            higherTaxa[queriedGenus] = phylum;
        }
    }
    if (!result.rank) {
        console.log("*** Query for " + scientificName + " did not return rank");
    }

    return result;
}

module.exports = {queryGbif};
