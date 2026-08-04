// lom-bridge.js
// CoProducer LOM bridge. Runs inside a Max [js] object, so this file is
// strict ES5. No const, no let, no arrow functions, no template literals.
//
// Transport B (docs/CONTRACT.md Section 3):
//   In:  [cmd, jsonString] messages from node.script's left outlet.
//        cmd is one of lom_get_session, lom_create_clip, lom_set_notes,
//        lom_get_notes, lom_roundtrip_test. The JSON payload always
//        carries a reqId.
//   Out: outlet(0, "lom_result", jsonString) where the JSON is
//        { reqId, ok: true, data: {...} } or { reqId, ok: false, error: "..." }.
//
// Targets the Live 11+ note API: add_new_notes with note dictionaries,
// get_notes_extended, remove_notes_extended, clip paths like
// "live_set tracks N clip_slots M clip".

inlets = 1;
outlets = 1;

var SCRATCH_CLIP_NAME = "CoProducer RT scratch";
var TIMING_TOLERANCE = 0.001;
var ROUNDTRIP_NOTES = [
  { pitch: 60, startBeats: 0, durationBeats: 0.5, velocity: 100, muted: false },
  { pitch: 63, startBeats: 1, durationBeats: 0.5, velocity: 100, muted: false },
  { pitch: 67, startBeats: 2, durationBeats: 0.5, velocity: 100, muted: false },
  { pitch: 70, startBeats: 3, durationBeats: 0.5, velocity: 100, muted: false }
];

// ---------------------------------------------------------------------------
// JSON fallback. Max 8's js object ships JSON, but older engines may not.
// Belt and suspenders so the bridge never dies on a missing global.
// ---------------------------------------------------------------------------

if (typeof JSON === "undefined") {
  JSON = {};
}

function bridgeEncodeString(s) {
  var out = "\"";
  var i, c, code;
  for (i = 0; i < s.length; i++) {
    c = s.charAt(i);
    code = s.charCodeAt(i);
    if (c === "\"") {
      out += "\\\"";
    } else if (c === "\\") {
      out += "\\\\";
    } else if (c === "\n") {
      out += "\\n";
    } else if (c === "\r") {
      out += "\\r";
    } else if (c === "\t") {
      out += "\\t";
    } else if (code < 32) {
      out += "\\u" + ("000" + code.toString(16)).slice(-4);
    } else {
      out += c;
    }
  }
  return out + "\"";
}

function bridgeEncode(value) {
  var t = typeof value;
  var parts, i, k;
  if (value === null || t === "undefined") {
    return "null";
  }
  if (t === "number") {
    return isFinite(value) ? String(value) : "null";
  }
  if (t === "boolean") {
    return value ? "true" : "false";
  }
  if (t === "string") {
    return bridgeEncodeString(value);
  }
  if (value instanceof Array) {
    parts = [];
    for (i = 0; i < value.length; i++) {
      parts.push(bridgeEncode(value[i]));
    }
    return "[" + parts.join(",") + "]";
  }
  if (t === "object") {
    parts = [];
    for (k in value) {
      if (value.hasOwnProperty(k) && typeof value[k] !== "function" && typeof value[k] !== "undefined") {
        parts.push(bridgeEncodeString(k) + ":" + bridgeEncode(value[k]));
      }
    }
    return "{" + parts.join(",") + "}";
  }
  return "null";
}

if (typeof JSON.stringify !== "function") {
  JSON.stringify = function (value) {
    return bridgeEncode(value);
  };
}

if (typeof JSON.parse !== "function") {
  // Crockford-style validation, then eval. Only used if the engine has no JSON.
  JSON.parse = function (text) {
    var t = String(text);
    var cleaned = t
      .replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
      .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
      .replace(/(?:^|:|,)(?:\s*\[)+/g, "");
    if (/^[\],:{}\s]*$/.test(cleaned)) {
      return eval("(" + t + ")");
    }
    throw new Error("JSON.parse fallback rejected the input");
  };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function fail(message) {
  throw new Error(message);
}

function firstValue(v) {
  if (v instanceof Array) {
    return v[0];
  }
  return v;
}

function numProp(api, prop) {
  return Number(firstValue(api.get(prop)));
}

function strProp(api, prop) {
  var v = firstValue(api.get(prop));
  if (v === undefined || v === null) {
    return "";
  }
  return String(v);
}

function liveApi(path) {
  var api;
  if (typeof LiveAPI === "undefined") {
    fail("LiveAPI is unavailable. This device only works inside Ableton Live.");
  }
  api = new LiveAPI(path);
  if (!api || api.id == 0) {
    fail("Invalid Live path: " + path);
  }
  return api;
}

function tryLiveApi(path) {
  try {
    return liveApi(path);
  } catch (e) {
    return null;
  }
}

function compareNotes(a, b) {
  if (a.startBeats !== b.startBeats) {
    return a.startBeats - b.startBeats;
  }
  return a.pitch - b.pitch;
}

// Resolve a clip path and confirm it really is a MIDI clip.
function midiClipAt(clipPath) {
  var api, t;
  if (typeof clipPath !== "string" || clipPath === "") {
    fail("Missing clipPath");
  }
  api = liveApi(clipPath);
  t = String(api.type);
  if (t !== "Clip") {
    fail("Path is not a clip: " + clipPath + " (type " + t + ")");
  }
  if (!numProp(api, "is_midi_clip")) {
    fail("Clip is not a MIDI clip: " + clipPath);
  }
  return api;
}

// Read notes via the Live 11 get_notes_extended call and convert the returned
// dictionaries into NoteEvent objects, sorted by start then pitch.
function readNotesFromClip(clipApi, lengthBeats) {
  var span = (typeof lengthBeats === "number" && lengthBeats > 0) ? lengthBeats : 1000000;
  var raw = clipApi.call("get_notes_extended", 0, 128, 0, span);
  var brace, parsed, dicts, notes, i, d;
  if (raw === null || raw === undefined) {
    fail("get_notes_extended returned nothing");
  }
  if (raw instanceof Array) {
    raw = raw.join(" ");
  }
  raw = String(raw);
  brace = raw.indexOf("{");
  if (brace < 0) {
    fail("get_notes_extended returned unexpected data: " + raw);
  }
  parsed = JSON.parse(raw.substring(brace));
  dicts = (parsed && parsed.notes) ? parsed.notes : [];
  notes = [];
  for (i = 0; i < dicts.length; i++) {
    d = dicts[i];
    notes.push({
      pitch: Math.round(Number(d.pitch)),
      startBeats: Number(d.start_time),
      durationBeats: Number(d.duration),
      velocity: Math.round(Number(d.velocity)),
      muted: d.mute ? true : false
    });
  }
  notes.sort(compareNotes);
  return notes;
}

// Replace the clip's contents with the given NoteEvent array using the
// Live 11 note API (remove_notes_extended then add_new_notes).
function writeNotesToClip(clipApi, notes) {
  var dicts = [];
  var i, n;
  for (i = 0; i < notes.length; i++) {
    n = notes[i];
    if (typeof n.pitch !== "number" || n.pitch < 0 || n.pitch > 127) {
      fail("Note " + i + " has a bad pitch (need 0 to 127): " + n.pitch);
    }
    if (typeof n.startBeats !== "number" || n.startBeats < 0) {
      fail("Note " + i + " has a bad startBeats (need 0 or higher): " + n.startBeats);
    }
    if (typeof n.durationBeats !== "number" || n.durationBeats <= 0) {
      fail("Note " + i + " has a bad durationBeats (need above 0): " + n.durationBeats);
    }
    dicts.push({
      pitch: Math.round(Number(n.pitch)),
      start_time: Number(n.startBeats),
      duration: Number(n.durationBeats),
      velocity: (typeof n.velocity === "number" && n.velocity >= 1 && n.velocity <= 127) ? Number(n.velocity) : 100,
      mute: n.muted ? 1 : 0
    });
  }
  clipApi.call("remove_notes_extended", 0, 128, 0, 1000000);
  if (dicts.length > 0) {
    clipApi.call("add_new_notes", { notes: dicts });
  }
}

function findSelection(ls, trackCount) {
  var selected = { trackIndex: -1, sceneIndex: -1 };
  var i, t, sc, sceneCount;
  var selTrack = tryLiveApi("live_set view selected_track");
  var selScene = tryLiveApi("live_set view selected_scene");
  if (selTrack) {
    for (i = 0; i < trackCount; i++) {
      t = tryLiveApi("live_set tracks " + i);
      if (t && String(t.id) === String(selTrack.id)) {
        selected.trackIndex = i;
        break;
      }
    }
  }
  if (selScene) {
    sceneCount = ls.getcount("scenes");
    for (i = 0; i < sceneCount; i++) {
      sc = tryLiveApi("live_set scenes " + i);
      if (sc && String(sc.id) === String(selScene.id)) {
        selected.sceneIndex = i;
        break;
      }
    }
  }
  return selected;
}

// ---------------------------------------------------------------------------
// Command implementations. Each returns the "data" object for an ok reply
// and throws an Error with a plain message on any failure.
// ---------------------------------------------------------------------------

function doGetSession(payload) {
  var ls = liveApi("live_set");
  var snapshot = {};
  var tracks = [];
  var trackCount, i, s, trackPath, trackApi, isMidi, clips, slotCount;
  var slotApi, clipPath, clipApi, lengthBeats, noteCount, setName;

  snapshot.tempo = numProp(ls, "tempo");
  snapshot.timeSignature = {
    numerator: numProp(ls, "signature_numerator"),
    denominator: numProp(ls, "signature_denominator")
  };
  snapshot.isPlaying = numProp(ls, "is_playing") ? true : false;

  setName = "";
  try {
    setName = strProp(ls, "name");
  } catch (e) {
    setName = "";
  }
  snapshot.setName = (setName === "" || setName === "0") ? "Untitled" : setName;

  trackCount = ls.getcount("tracks");
  for (i = 0; i < trackCount; i++) {
    trackPath = "live_set tracks " + i;
    trackApi = liveApi(trackPath);
    isMidi = numProp(trackApi, "has_midi_input") ? true : false;
    clips = [];
    slotCount = trackApi.getcount("clip_slots");
    for (s = 0; s < slotCount; s++) {
      slotApi = liveApi(trackPath + " clip_slots " + s);
      if (!numProp(slotApi, "has_clip")) {
        continue;
      }
      clipPath = trackPath + " clip_slots " + s + " clip";
      clipApi = liveApi(clipPath);
      lengthBeats = numProp(clipApi, "length");
      noteCount = 0;
      if (numProp(clipApi, "is_midi_clip")) {
        try {
          noteCount = readNotesFromClip(clipApi, lengthBeats).length;
        } catch (e2) {
          noteCount = 0;
        }
      }
      clips.push({
        sceneIndex: s,
        name: strProp(clipApi, "name"),
        lengthBeats: lengthBeats,
        noteCount: noteCount,
        clipPath: clipPath
      });
    }
    tracks.push({
      index: i,
      name: strProp(trackApi, "name"),
      isMidi: isMidi,
      clips: clips
    });
  }
  snapshot.tracks = tracks;
  snapshot.selected = findSelection(ls, trackCount);
  return snapshot;
}

function doCreateClip(payload) {
  var trackIndex = payload.trackIndex;
  var sceneIndex = payload.sceneIndex;
  var lengthBeats = payload.lengthBeats;
  var ls, trackCount, trackApi, slotCount, slotPath, slotApi, clipPath;

  if (typeof trackIndex !== "number" || trackIndex < 0 || Math.floor(trackIndex) !== trackIndex) {
    fail("lom_create_clip needs an integer trackIndex of 0 or higher");
  }
  if (typeof sceneIndex !== "number" || sceneIndex < 0 || Math.floor(sceneIndex) !== sceneIndex) {
    fail("lom_create_clip needs an integer sceneIndex of 0 or higher");
  }
  if (typeof lengthBeats !== "number" || lengthBeats <= 0) {
    lengthBeats = 4;
  }

  ls = liveApi("live_set");
  trackCount = ls.getcount("tracks");
  if (trackIndex >= trackCount) {
    fail("trackIndex " + trackIndex + " is out of range, the set has " + trackCount + " tracks");
  }
  trackApi = liveApi("live_set tracks " + trackIndex);
  if (!numProp(trackApi, "has_midi_input")) {
    fail("Track " + trackIndex + " is not a MIDI track");
  }
  slotCount = trackApi.getcount("clip_slots");
  if (sceneIndex >= slotCount) {
    fail("sceneIndex " + sceneIndex + " is out of range, the track has " + slotCount + " scenes. Add a scene in Live and retry.");
  }
  slotPath = "live_set tracks " + trackIndex + " clip_slots " + sceneIndex;
  slotApi = liveApi(slotPath);
  if (numProp(slotApi, "has_clip")) {
    fail("Clip slot already has a clip at " + slotPath + ". The bridge never overwrites, pick an empty scene.");
  }
  slotApi.call("create_clip", lengthBeats);
  clipPath = slotPath + " clip";
  liveApi(clipPath);
  return { clipPath: clipPath, trackIndex: trackIndex, sceneIndex: sceneIndex };
}

function doSetNotes(payload) {
  var clipApi = midiClipAt(payload.clipPath);
  var notes = payload.notes;
  if (!(notes instanceof Array)) {
    fail("lom_set_notes needs a notes array");
  }
  writeNotesToClip(clipApi, notes);
  return { count: notes.length };
}

function doGetNotes(payload) {
  var clipApi = midiClipAt(payload.clipPath);
  var lengthBeats = numProp(clipApi, "length");
  return { notes: readNotesFromClip(clipApi, lengthBeats) };
}

function doRoundtripTest(payload) {
  var ls = liveApi("live_set");
  var trackCount = ls.getcount("tracks");
  var trackIndex = -1;
  var slotIndex = -1;
  var emptyIndex = -1;
  var i, t, trackPath, trackApi, slotCount, slotApi, clipApi, slotPath, clipPath;
  var written, read, problems, w, r, slot, clip;

  for (i = 0; i < trackCount; i++) {
    t = liveApi("live_set tracks " + i);
    if (numProp(t, "has_midi_input")) {
      trackIndex = i;
      break;
    }
  }
  if (trackIndex < 0) {
    fail("No MIDI track in this set. Add a MIDI track and rerun the test.");
  }

  trackPath = "live_set tracks " + trackIndex;
  trackApi = liveApi(trackPath);
  slotCount = trackApi.getcount("clip_slots");
  for (i = 0; i < slotCount; i++) {
    slotApi = liveApi(trackPath + " clip_slots " + i);
    if (numProp(slotApi, "has_clip")) {
      clipApi = liveApi(trackPath + " clip_slots " + i + " clip");
      if (strProp(clipApi, "name") === SCRATCH_CLIP_NAME) {
        slotIndex = i;
        break;
      }
    } else if (emptyIndex < 0) {
      emptyIndex = i;
    }
  }
  if (slotIndex < 0) {
    slotIndex = emptyIndex;
  }
  if (slotIndex < 0) {
    fail("No empty clip slot and no existing scratch clip on track " + trackIndex + ". Free a slot and rerun.");
  }

  slotPath = trackPath + " clip_slots " + slotIndex;
  slot = liveApi(slotPath);
  if (!numProp(slot, "has_clip")) {
    slot.call("create_clip", 4);
  }
  clipPath = slotPath + " clip";
  clip = liveApi(clipPath);
  clip.set("name", SCRATCH_CLIP_NAME);

  written = ROUNDTRIP_NOTES;
  writeNotesToClip(clip, written);
  read = readNotesFromClip(clip, 4);

  problems = [];
  if (read.length !== written.length) {
    problems.push("wrote " + written.length + " notes, read back " + read.length);
  } else {
    for (i = 0; i < written.length; i++) {
      w = written[i];
      r = read[i];
      if (r.pitch !== w.pitch) {
        problems.push("note " + i + ": pitch " + r.pitch + ", expected " + w.pitch);
      }
      if (Math.abs(r.startBeats - w.startBeats) > TIMING_TOLERANCE) {
        problems.push("note " + i + ": start " + r.startBeats + ", expected " + w.startBeats);
      }
      if (Math.abs(r.durationBeats - w.durationBeats) > TIMING_TOLERANCE) {
        problems.push("note " + i + ": duration " + r.durationBeats + ", expected " + w.durationBeats);
      }
    }
  }

  return {
    ok: problems.length === 0,
    written: written,
    read: read,
    clipPath: clipPath,
    detail: problems.length === 0
      ? "all " + written.length + " notes matched within " + TIMING_TOLERANCE + " beats"
      : problems.join("; ")
  };
}

// ---------------------------------------------------------------------------
// Message dispatch
// ---------------------------------------------------------------------------

var COMMANDS = {
  lom_get_session: doGetSession,
  lom_create_clip: doCreateClip,
  lom_set_notes: doSetNotes,
  lom_get_notes: doGetNotes,
  lom_roundtrip_test: doRoundtripTest
};

function sendReply(reqId, ok, data, error) {
  var msg = { reqId: reqId, ok: ok };
  if (ok) {
    msg.data = data;
  } else {
    msg.error = error;
  }
  outlet(0, "lom_result", JSON.stringify(msg));
}

function anything() {
  var cmd = messagename;
  var args = arrayfromargs(arguments);
  // Max may split a symbol containing spaces into multiple atoms.
  // JSON emitted by node has spaces only inside string values, and a
  // single-space rejoin restores those.
  var json = args.join(" ");
  var payload = null;
  var reqId = null;
  var data;

  if (!COMMANDS.hasOwnProperty(cmd)) {
    post("lom-bridge: ignoring unknown command " + cmd + "\n");
    return;
  }
  try {
    payload = JSON.parse(json);
  } catch (e) {
    sendReply(null, false, null, "lom-bridge could not parse the JSON payload for " + cmd);
    return;
  }
  if (!payload || typeof payload !== "object") {
    sendReply(null, false, null, "lom-bridge got a non-object payload for " + cmd);
    return;
  }
  reqId = payload.reqId;
  try {
    data = COMMANDS[cmd](payload);
    sendReply(reqId, true, data, null);
  } catch (e2) {
    sendReply(reqId, false, null, String(e2 && e2.message ? e2.message : e2));
  }
}

// Bang prints a quick health check to the Max window. Handy while debugging.
function bang() {
  var ls;
  if (typeof LiveAPI === "undefined") {
    post("lom-bridge: LiveAPI unavailable, not running inside Live\n");
    return;
  }
  ls = new LiveAPI("live_set");
  if (!ls || ls.id == 0) {
    post("lom-bridge: cannot reach live_set, not running inside Live\n");
    return;
  }
  post("lom-bridge: ready, " + ls.getcount("tracks") + " tracks, tempo " + firstValue(ls.get("tempo")) + "\n");
}
