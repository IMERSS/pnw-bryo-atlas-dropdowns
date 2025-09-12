/* eslint-env node */

"use strict";

const {queryGbif} = require("../js/query-gbif-api.js");

const higherTaxa = {};

// const query = await queryGbif("Buckiella undulata", classificationSet);
//const query = await queryGbif("Cololejeunia macounii", classificationSet);
// "Anthelia" Marchantiophyta
// "Bartramia"
// "Tortula"
// "Diplophyllum", "Marchantiophyta"

async function main() {
    const query = await queryGbif("Riccia crinita (trichocarpa)", "Marchantiophyta", higherTaxa, true);
    console.log(query);
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
