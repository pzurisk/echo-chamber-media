"use strict";

// Public entry for the gamification module.
// Usage per docs/CONTRACT.md Section 5:
//   const { createGame } = require("./game");
//   const game = createGame({ dataDir, lessonsDir });
// createGame also accepts an optional now() function returning a Date, used
// by tests to make streak day math deterministic.

const { createGame } = require("./game");

module.exports = { createGame };

// Test entry shim. This Node build resolves "node --test node/game/" to this
// index.js instead of scanning the directory for *.test.js files, which would
// silently run zero tests. When this file is executed as a node:test runner
// child (NODE_TEST_CONTEXT is set by the runner, never in normal requires),
// pull the test files in so that command runs the full suite. Requiring this
// module from main.js is unaffected.
if (require.main === module && process.env.NODE_TEST_CONTEXT) {
  require("./store.test.js");
  require("./game.test.js");
}
