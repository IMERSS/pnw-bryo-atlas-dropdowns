/* eslint-env node */

"use strict";

const {execHugo} = require("./utils.js");

const task = require("./generate-pages.js");

task.then( () => {
    execHugo();
});
