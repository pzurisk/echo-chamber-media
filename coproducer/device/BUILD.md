# Building and testing the CoProducer device

Requirements: Ableton Live 11 or newer with Max for Live (Max 8.5 or newer).

## 1. Build the UI first

The patcher's `jweb` object loads `../ui/dist/index.html`, so that folder has to
exist before you open the device. From `coproducer/`:

```
npm install
cp .env.example .env    # then put the real ANTHROPIC_API_KEY in .env, optional
cd ui
npm install
npm run build            # produces ui/dist/index.html
```

## 2. Open the patcher and save it as a device

1. In Live, create or open any set, add a MIDI track.
2. In Max (standalone or via Live's "Open Max Editor"), open
   `device/CoProducer.maxpat`.
3. Read the four comment boxes in the patcher, they describe the signal path:
   `node.script` (the Node backend) feeds and is fed by the `js lom-bridge.js`
   object, a `live.text` button sends the round trip test, and a `loadbang`
   points `jweb` at the built UI.
4. `File > Save As...`, choose type `Max for Live Device (*.amxd)`, save it
   as `CoProducer.amxd` next to the `.maxpat` (or wherever you keep devices).
5. Drag `CoProducer.amxd` onto the MIDI track in Live, or drop it from Live's
   browser after adding the folder to a User Library location.

The device auto-starts `node.script ../node/main.js` on load (`@autostart 1`).
Watch the Max window: you should see
`CoProducer node backend ready on port 7400` (or an error if something is
missing, see Troubleshooting below).

## 3. Run the round trip test before trusting anything else

This is the check called out in SPEC.md Section 5, risk 2: note writing
through LiveAPI has known timing and quantization edge cases, so prove the
write and read path works on your machine before building suggestions on
top of it.

1. Click the **Run LOM round trip** button in the device UI (the
   `live.text` object wired to a `roundtrip` message).
2. Watch the Max window. You should see:
   ```
   CoProducer: running the LOM round trip test
   CoProducer round trip PASS: {"ok":true,"written":[...],"read":[...],"clipPath":"...","detail":"all 4 notes matched within 0.001 beats"}
   ```
3. If it prints `FAIL` or `ERROR` instead:
   - `No MIDI track in this set`, add a MIDI track and click again.
   - `No empty clip slot and no existing scratch clip on track N`, free up
     a clip slot on the first MIDI track (the test writes into a clip named
     "CoProducer RT scratch" and reuses it on repeat runs, it never
     overwrites an unrelated clip).
   - Any `pitch`/`start`/`duration` mismatch in `detail`, that is exactly
     the timing/quantization quirk the spec flagged. Note the Live version
     and the mismatch amounts before changing anything downstream.
4. Once you see `PASS`, the LOM bridge is trustworthy and the suggestion
   pipeline (`suggest.commit`, which calls `createClip` then `setNotes`) can
   be used for real.

The test clip it creates/reuses is named "CoProducer RT scratch" so it is
easy to find and delete from Live once you are done checking.

## 4. Troubleshooting

- **jweb stays blank**: the `url ../ui/dist/index.html` message uses a path
  relative to the patcher file. If Max saved the `.amxd` somewhere else, or
  the relative path does not resolve, retype the message box with an
  absolute `file://` path to your built `ui/dist/index.html` and click it.
- **Max window shows `max-api not found, running standalone`**: this means
  `node.script` did not start correctly, or you are running
  `node node/main.js` by hand outside Max. Inside Live this should not
  happen; if it does, check the `node.script` object's args and the Max
  version (Node for Max needs Max 8.5+).
- **`lom_unavailable` or `lom_timeout` errors from the UI**: confirm the
  `js lom-bridge.js` object shows no red border (syntax/load error) in the
  patcher, and that the device is actually loaded on a track inside a real
  Live set, not a bare Max standalone window (`LiveAPI` only exists inside
  Live).
- **Nothing happens on `roundtrip` at all**: click directly on the
  `live.text` button, not the message box behind it, and confirm the patch
  cord from the button runs into the `roundtrip` message box and from there
  into `node.script`'s inlet.

## 5. What is still unverified outside Live

Everything in `node/`, `ui/`, `packs/`, and `lessons/` has automated tests
that run with plain Node (`npm test` from `coproducer/`, see the root
README). The one thing that cannot be tested outside Ableton is this file:
the actual `.amxd` load, the `jweb` embed rendering the built UI, and the
LOM round trip against a real Live set. Do the steps above before relying
on the device for real work.
