"use strict";

// Public entry point for the suggestion engine (docs/CONTRACT.md Section 5).
// main.js should require this file and use only what it exports.

const { createEngine } = require("./engine");

module.exports = { createEngine };
