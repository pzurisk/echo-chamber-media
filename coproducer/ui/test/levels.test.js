import test from "node:test";
import assert from "node:assert/strict";
import {
  levelForXp,
  levelFloor,
  nextLevelThreshold,
  levelProgress,
} from "../src/lib/levels.js";

test("levelForXp matches the contract formula", () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(399), 2);
  assert.equal(levelForXp(400), 3);
  assert.equal(levelForXp(900), 4);
  assert.equal(levelForXp(-50), 1);
  assert.equal(levelForXp(undefined), 1);
});

test("level thresholds are 100 times level squared", () => {
  assert.equal(nextLevelThreshold(1), 100);
  assert.equal(nextLevelThreshold(2), 400);
  assert.equal(nextLevelThreshold(3), 900);
  assert.equal(levelFloor(1), 0);
  assert.equal(levelFloor(2), 100);
  assert.equal(levelFloor(3), 400);
});

test("levelProgress reports position inside the current level", () => {
  const p = levelProgress(340);
  assert.equal(p.level, 2);
  assert.equal(p.floor, 100);
  assert.equal(p.ceil, 400);
  assert.equal(p.into, 240);
  assert.equal(p.span, 300);
  assert.equal(p.remaining, 60);
  assert.ok(Math.abs(p.fraction - 0.8) < 1e-9);
});

test("levelProgress at an exact threshold starts the new level at zero", () => {
  const p = levelProgress(400);
  assert.equal(p.level, 3);
  assert.equal(p.into, 0);
  assert.equal(p.fraction, 0);
});
