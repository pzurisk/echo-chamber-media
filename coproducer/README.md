# CoProducer

A Max for Live device that lives inside Ableton Live, teaches production and theory through bite-size tasks, and helps you get unstuck by generating genre-grounded suggestions (Deftones, Nine Inch Nails, pop punk) as real MIDI clips you can audition immediately.

Personal tool for Billy. Single user, local-first, no accounts.

Full product spec: [SPEC.md](SPEC.md). Interface contract between all components: [docs/CONTRACT.md](docs/CONTRACT.md).

## Layout

| Path | What it is |
|---|---|
| `device/` | Max patcher source, the LOM bridge script, and build instructions for turning it into a `.amxd` |
| `node/` | The Node for Max backend: WebSocket server, LOM wrappers, suggestion engine, game state |
| `packs/` | Genre style packs (JSON) plus their schema. Idiomatic patterns only, never transcriptions of real songs |
| `lessons/` | Micro-lesson catalog and authoring guide |
| `ui/` | The React and Tailwind app rendered inside the device's `jweb` webview |
| `data/` | Runtime user state (XP, streaks, milestones). Gitignored |

## Setup on the Mac

Requirements: Ableton Live 11 or newer with Max for Live (Max 8.5+), Node 18+ on the machine for the UI build.

```
cd coproducer
npm install
cp .env.example .env        # then put the real ANTHROPIC_API_KEY in .env
cd ui
npm install
npm run build               # produces ui/dist, which the device loads
```

Then follow [device/BUILD.md](device/BUILD.md) to open `device/CoProducer.maxpat` in Max, save it as `CoProducer.amxd`, and drop it on a MIDI track. First thing to do inside Live: press the round-trip test button and confirm the 4-note write and read passes before trusting the suggestion pipeline (see SPEC Section 5, risk 2).

No API key? Everything still works. The engine falls back to the rule-based layer, so suggestions come straight from the style packs instead of Claude.

## Tests

Everything that can run without Ableton has tests on the built-in Node runner:

```
cd coproducer
npm test
```

The LOM bridge itself can only be validated inside Live. That checklist lives in `device/BUILD.md`.
