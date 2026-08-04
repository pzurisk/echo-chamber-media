// XP and level math, matching docs/CONTRACT.md Section 5:
// level = Math.floor(Math.sqrt(xp / 100)) + 1
// so a level starts at 100 * (level - 1)^2 XP and the next one starts at 100 * level^2.
// Pure functions with no DOM, testable with node --test.

export function levelForXp(xp) {
  const safe = Math.max(0, Number(xp) || 0);
  return Math.floor(Math.sqrt(safe / 100)) + 1;
}

export function levelFloor(level) {
  return 100 * (level - 1) * (level - 1);
}

export function nextLevelThreshold(level) {
  return 100 * level * level;
}

export function levelProgress(xp) {
  const safe = Math.max(0, Number(xp) || 0);
  const level = levelForXp(safe);
  const floor = levelFloor(level);
  const ceil = nextLevelThreshold(level);
  const span = ceil - floor;
  const into = safe - floor;
  return {
    level,
    floor,
    ceil,
    into,
    span,
    remaining: ceil - safe,
    fraction: span > 0 ? Math.min(1, into / span) : 0,
  };
}
