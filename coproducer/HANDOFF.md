# CoProducer, handoff to terminal

Written 2026-08-04, cloud session, for the next Claude Code terminal session
(likely on Billy's Mac mini) to pick this up. The cloud session that built
this hit its API session limit partway through the multi-agent build, so
read this before doing anything else. All the actual work described below
is already committed and pushed, this file is a map of what is done, what
is not, and what to run next.

## What this is

CoProducer, a Max for Live device, Duolingo for music production, described
in full in [SPEC.md](SPEC.md). The interface contract every module was built
against is [docs/CONTRACT.md](docs/CONTRACT.md). Read both before changing
anything, they are the source of truth, not this file.

## How this got built

Spec Section 7 asked for an orchestrator plus four parallel sub-agents (M4L
and LOM, UI, Genre and AI, Gamification), each owning a strict set of paths
against the shared contract. That ran in the cloud session. Three of the
four sub-agents hit "You've hit your session limit, resets 12:30am (UTC)"
right near the end of their work, not at the start, so the failures look
worse than the actual gap turned out to be. Here is the real state of each
piece, verified by hand after the failures (tests run, files read, not just
trusted from agent self-reports):

| Area | Owner | Status |
|---|---|---|
| `packs/` + `node/engine/` | Genre and AI agent | **Finished cleanly.** Agent completed and self-reported in full, no gaps found. |
| `device/` + `node/lom/` + `node/main.js` | M4L and LOM agent | **Functionally complete**, all code written and tested. The agent died before writing `device/BUILD.md`, the doc pointing at how to build the `.amxd` and run the round trip test in Live. I (the orchestrator) wrote that file by hand after the fact, reading the actual patcher and bridge code to keep it accurate. |
| `node/game/` + `lessons/` | Gamification agent | **Finished cleanly.** All code and tests present, `lessons/catalog.json` has 9 lessons. One thing worth knowing: `node/game/index.js` has a small guarded shim (`NODE_TEST_CONTEXT`) the agent added to work around a Node test-runner quirk in this sandbox (see below). It does not affect production behavior, only `node --test` invocations. |
| `ui/` | UI agent | **Finished cleanly**, build succeeds, `ui/dist/` exists with relative asset paths (`./assets/...`), correct for `jweb`'s `file://` loading. The agent died right before its own final em-dash self-scan; I ran that scan across the whole tree by hand afterward and found nothing left in its files. |

Net: this is a complete v1 per SPEC Section 6's build order, not a
partial build. The only genuinely untested surface is the parts that can
only run inside real Ableton Live (see "What cannot be verified here"
below), which was always going to be true no matter how the build went.

## What I verified by hand (do not re-trust agent self-reports blindly)

- `cd coproducer && npm test`: **81 tests, 0 failures** (engine, game, lom,
  main all covered).
- `cd coproducer/ui && npm test`: **16 tests, 0 failures**.
- `cd coproducer/ui && npm run build`: succeeds, `ui/dist/index.html`
  references its JS/CSS with relative paths.
- Repo-wide em dash scan (`—`/`–`) across every `.js`/`.jsx`/`.json`/`.md`/
  `.maxpat` file in `coproducer/`, excluding `node_modules`/`dist`: clean.
  The only hits were inside `node/game/game.test.js`, which is itself
  asserting lesson text contains no em dash, that is correct, not a leak.
- `device/CoProducer.maxpat` parses as valid JSON (Max patcher files are
  JSON) and its object graph matches what `device/BUILD.md` describes
  (`node.script`, `js lom-bridge.js`, the `live.text` round trip button,
  `jweb` with a `loadbang` pointing at `../ui/dist/index.html`).
- `npm run security-audit` from the **repo root** (`/home/user/echo-chamber-media`,
  or wherever this clone lives on your machine) passes. This does not scan
  `coproducer/` (it only checks the Next.js site's headers, CSP, and tracked
  `.env` files), but Billy's standing order is to run it before every push
  regardless of what changed, so it was run and it is green.
- No `.env` file is tracked by git. `coproducer/.env.example` has the real
  key format, the actual `.env` stays gitignored.

## A Node quirk worth knowing about, in case it follows you

In this sandbox's Node build (v22.22.2), `node --test <directory>/` did
**not** recurse into subdirectories and run their `*.test.js` files the way
the Node docs describe. Instead it tried to `require()` the directory
itself and crashed with `MODULE_NOT_FOUND`. Passing explicit file globs
works correctly:

```
node --test node/engine/*.test.js node/game/*.test.js node/lom/*.test.js node/main.test.js
```

`package.json`'s `test` script has already been fixed to use this form. If
your local Node behaves differently (this may well be sandbox-specific),
`node --test node/` might just work there too, no harm in trying, but the
explicit form in `package.json` is the one that is confirmed to run every
test file. The gamification agent independently ran into the same issue
one directory level down and left a small workaround comment in
`node/game/index.js`, that comment explains itself.

## What cannot be verified outside Ableton Live

This was always the one part no amount of cloud-session work could close:

1. Opening `device/CoProducer.maxpat` in Max and saving it as
   `CoProducer.amxd`.
2. Dropping the device on a MIDI track and confirming `node.script`
   auto-starts (`CoProducer node backend ready on port 7400` in the Max
   window).
3. Confirming `jweb` actually renders the built UI from
   `ui/dist/index.html`.
4. Clicking the **Run LOM round trip** button and confirming a `PASS`, this
   is the SPEC Section 5 risk 2 check (note timing and quantization quirks
   in LiveAPI's note-writing calls).

Full step by step instructions, including what each likely failure mode
means, are in [device/BUILD.md](device/BUILD.md). Do this before trusting
the suggestion pipeline (`suggest.commit`) for anything real. Do not skip
straight to using the device.

## Exact next steps for this terminal session

1. Confirm you are on branch `claude/coproducer-handoff-spec-5n9ac9` and it
   is up to date with `origin` (`git fetch origin claude/coproducer-handoff-spec-5n9ac9 && git status`).
2. `cd coproducer && npm install` if `node_modules` is not already there
   (it is gitignored).
3. `cp .env.example .env` and put a real `ANTHROPIC_API_KEY` in it if you
   want Claude-backed suggestions. Without a key, `node/engine/claude.js`
   returns `null` and the engine falls back to the rule-based layer
   automatically, nothing breaks, suggestions just come straight from the
   style packs instead.
4. `cd ui && npm install && npm run build` (only needed if `ui/dist` is
   missing or you changed UI source, it is already built and committed as
   of this handoff, `ui/dist` is gitignored though, so a fresh clone needs
   this step).
5. Follow [device/BUILD.md](device/BUILD.md) inside Ableton Live: build the
   `.amxd`, load it, run the round trip test, confirm `PASS`.
6. Only after a real `PASS`: use the device for real, or start extending it
   (more genre packs, more lessons, tuning suggestion quality).

## Open items, not blockers, just not done

- Only one genre pack round-trip has been exercised through the LLM path in
  a real session (none have, the API key was never exercised end-to-end in
  this cloud build since there is no Live instance here to actually commit
  a suggestion into a clip). The rule-based fallback path is fully tested;
  the Claude-backed path is unit-tested with a stubbed `askClaude`, but not
  yet run against the live API with a real key inside a real Live session.
- No fourth genre pack beyond the three in SPEC Section 3 (Deftones, NIN,
  pop punk). Adding one means: a new `packs/<genre>.json` following
  `packs/SCHEMA.md`, nothing else needs to change, `engine.listGenres()`
  reads the directory.
- Gamification currently ships one milestone set per song (verse, chorus,
  bridge, arrangement, mix, export) and 9 lessons. More lessons can be
  added straight to `lessons/catalog.json` following
  `lessons/AUTHORING.md`.

## Do not re-run the multi-agent build

Everything Section 7 asked for is done. If something needs fixing, fix it
directly, there is no need to re-delegate to fresh sub-agents against the
same contract, that would just recreate work that already exists and
passed its tests.
