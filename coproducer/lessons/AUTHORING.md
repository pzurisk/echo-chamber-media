# Adding a lesson to CoProducer

Lessons live in `lessons/catalog.json`, a JSON array of lesson objects. The
game module loads the whole file at startup, so a new lesson only needs a new
entry here. Invalid entries and duplicate ids are skipped with a warning.

## Shape

```json
{
  "id": "chorus-lift",
  "title": "What makes a chorus feel bigger",
  "body": "The full lesson text.",
  "xp": 20,
  "unlock": { "type": "milestone", "milestone": "verse" }
}
```

- `id`: unique, stable, kebab-case. Changing an id later makes the system treat
  it as a brand new lesson (completion and unlock history are keyed on it).
- `title`: short and plain, no punchlines.
- `body`: 60 to 90 seconds of reading, roughly 120 to 200 words.
- `xp`: granted once on completion. Omitting it defaults to 20.

## Unlock types

- `{ "type": "always" }`: available from the start. Keep only one or two of
  these, they are the on-ramp.
- `{ "type": "milestone", "milestone": "verse" }`: unlocks once that milestone
  is true on any song. Valid milestones: `verse`, `chorus`, `bridge`,
  `arrangement`, `mix`, `export`.
- `{ "type": "suggestion", "kind": "structure" }`: unlocks the first time a
  suggestion of that kind is committed to a clip. Valid kinds:
  `chord-progression`, `structure`, `production`. Omit `kind` to unlock on any
  committed suggestion.

Each lesson fires its unlock notification exactly once, ever. That is tracked
in the user's state file, so re-editing a lesson will not re-notify.

## XP guidance

20 for starter material, 25 for technique lessons unlocked mid-song, 30 for
late-stage mix and export lessons. Keep lesson XP well below milestone XP
(100 to 200), the song progress loop is the primary one.

## Voice rules

Write like a working filmmaker or musician explaining something to a friend.
Specific, confident, zero fluff. Explain any term of art in one clause the
first time it appears, for example "headroom (spare level before clipping)".
No music-theory gatekeeping, the reader may not know what a submediant is and
should never need to. No em dashes anywhere, use periods, commas, or
parentheses. Write ranges as "60 to 90 seconds". No exclamation points, no
hollow taglines, no hype. Every lesson should end with something the reader
can do in the next five minutes.
