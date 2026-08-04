# Style Pack Schema

A style pack is one JSON file per genre in `coproducer/packs/`. The file name is the genre id plus `.json` (for example `deftones.json`). The engine discovers genres by listing this directory, so the file name and the `genre` field must match.

## Legal note (read this before adding or editing any pack)

Packs encode idiomatic patterns only: common chord types, progression shapes, song structures, and production techniques associated with a genre or era. They must never contain transcriptions, riffs, melodies, lyrics, or note-for-note passages from specific copyrighted songs. A four-chord family like I, V, vi, IV is a shared musical idiom. A specific recognizable riff is not. If a progression, structure, or note pattern is traceable to one particular song, it does not belong here. Contributions that copy a real song will be rejected.

## Top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `genre` | string | yes | Genre id. Lowercase letters, digits, and hyphens only. Must equal the file name without `.json`. |
| `tempoRange` | `[number, number]` | yes | Inclusive BPM range, low then high, for example `[80, 100]`. |
| `commonKeys` | string[] | yes | Key strings the rules layer picks from, for example `"Bb minor"`, `"E major"`, `"E phrygian"`. Format: tonic note name (A to G, optional `#` or `b`), one space, mode (`major`, `minor`, or `phrygian`). At least one entry. |
| `chordVocabulary` | string[] | yes | The quality suffixes this genre leans on (see Suffixes below). Documentation for humans and grounding for the LLM. Progressions should stay inside this vocabulary. |
| `progressionTemplates` | object[] | yes | 4 to 6 entries of `{ "name": string, "roman": string[] }`. `name` is a short kebab-case label that should hint at the section it fits (`verse-tension`, `chorus-lift`, `bridge-floating`) because the rules layer matches names against the user's question. `roman` is an array of roman numeral tokens (syntax below), normally 2 to 6 chords. |
| `songStructures` | object[] | yes | 2 to 3 entries of `{ "name": string, "sections": string[] }`. Sections are ordered kebab-case labels. Add qualifiers that carry arrangement meaning (`verse-clean`, `chorus-heavy`, `breakdown-noise`) rather than bare labels when the genre calls for it. |
| `productionNotes` | string[] | yes | 5 to 8 plain sentences of concrete, actionable production guidance. Write them the way a working producer talks. No hype, no hollow taglines, no em dashes. |

No other top-level fields are allowed.

## Roman numeral syntax

Each token in a `roman` array is:

```
[b] NUMERAL [suffix]
```

parsed left to right with no spaces.

### Degrees

`NUMERAL` is one of `I II III IV V VI VII` (uppercase) or `i ii iii iv v vi vii` (lowercase). Mixed case is invalid. Degrees are resolved against the major scale of the key's tonic, whatever the mode. The scale degree intervals in semitones from the tonic are:

| Degree | I | II | III | IV | V | VI | VII |
|---|---|---|---|---|---|---|---|
| Semitones | 0 | 2 | 4 | 5 | 7 | 9 | 11 |

### Case

Uppercase means a major triad base, lowercase means a minor triad base. Case is ignored for suffixes that define the full chord themselves (`5`, `sus2`, `sus4`, `min7`).

### The `b` prefix (borrowed flats)

A leading `b` lowers the chord root by one semitone. This is how borrowed chords are written. Because degrees are major-scale relative, minor-key packs spell the natural-minor chords with flats:

- `bIII` in Bb minor is Db major (the relative major chord)
- `bVI` in Bb minor is Gb major
- `bVII` in Bb minor is Ab major
- `bII` in E phrygian flavored writing is F major (the phrygian b2 move)

Allowed with any numeral, but the idiomatic set is `bII`, `bIII`, `bVI`, `bVII`. There is no `#` prefix.

### Suffixes

The full allowed suffix set, and what each produces on top of the root:

| Suffix | Chord tones (semitones above root) | Meaning |
|---|---|---|
| (none) | major `0 4 7`, minor `0 3 7` | Plain triad, quality from case |
| `5` | `0 7 12` | Power chord: root, fifth, octave. Case irrelevant |
| `sus2` | `0 2 7` | Third replaced by the second. Case irrelevant |
| `sus4` | `0 5 7` | Third replaced by the fourth. Case irrelevant |
| `add9` | triad + `14` | Triad plus the ninth, quality from case |
| `7` | triad + `10` | Triad plus a minor seventh. On uppercase this is a dominant seventh, on lowercase a minor seventh |
| `min7` | `0 3 7 10` | Minor seventh chord regardless of case |
| `maj7` | triad + `11` | Triad plus a major seventh. Normally used on uppercase numerals |
| `maj7#11` | `0 4 7 11 18` | Major seventh chord with a raised eleventh. Use on uppercase or borrowed roots (`bVImaj7#11`) |

Examples: `i`, `IV`, `bVI`, `v7`, `imin7`, `isus2`, `iadd9`, `bVImaj7#11`, `I5`, `bVII5`.

## How packs become sound

`node/engine/theory.js` renders each progression as block chords: every chord becomes simultaneous NoteEvents, 4 beats per chord by default, root placed in the MIDI 48 to 59 range (48 plus the root's pitch class), remaining tones stacked above, velocity 96, unmuted. Keep progressions in the 2 to 6 chord range so rendered clips land at sensible 8 to 24 beat lengths.

## Example

```json
{
  "genre": "example-genre",
  "tempoRange": [80, 100],
  "commonKeys": ["Bb minor", "D minor"],
  "chordVocabulary": ["min7", "maj7#11", "sus2", "add9"],
  "progressionTemplates": [
    { "name": "verse-tension", "roman": ["i", "bVI", "iv", "v"] }
  ],
  "songStructures": [
    {
      "name": "quiet-loud",
      "sections": ["intro", "verse-clean", "prechorus-build", "chorus-heavy", "verse-clean", "chorus-heavy", "bridge-atmospheric", "chorus-heavy-out"]
    }
  ],
  "productionNotes": [
    "Layer a clean guitar and a distorted guitar on the same part and ride the balance between them."
  ]
}
```

## Contribution checklist

1. File name matches the `genre` field.
2. Every roman token parses under the syntax above (run `node --test node/engine/` after adding a pack, the rules tests load every pack in this directory).
3. Progressions and structures are genre idioms, not transcriptions. See the legal note at the top. If you can name the one song a pattern comes from, rewrite it or drop it.
4. Production notes are specific enough to act on inside a session. "Make it atmospheric" is useless. "Send the chorus guitars to a long hall reverb and keep the verse dry" is usable.
5. No em dashes anywhere in the file. Write ranges as "80 to 100".
