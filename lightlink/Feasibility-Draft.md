# LightLink Pi Bridge: Feasibility Draft (Phase 1, partial)

Written: Oct 22, 2026, from a cloud session with no access to the Pi, the Mac, or the lights.
Status: DRAFT, with two decisions locked by Billy on Oct 22 (see section 10). Covers only the web research half of Phase 1. Light inventory, Pi range test, and the final OS decision still need Billy at the Mac.
Source: three Haiku probes (web search and repo pages only). Anything marked "unverified" was not confirmed at a readable source. Nothing below has been tested on hardware.

## 1. The short version

- Neewer is the easiest brand. An open Python library exists that only needs bleak, which is what the Pi would run anyway. Plain BLE writes, no pairing secrets.
- Amaran (the amaran app lights: tubes, F22c, F21c, bulbs) is the biggest fleet and the hardest brand that still has a path. It is a Telink BLE Mesh. Two open projects already drive it, but both are Mac-centric and neither tested Billy's exact models. Keys come out of the amaran desktop app, which Billy can run on the Mac.
- Aputure Sidus Link (600X Pro, 150 bicolor), Nanlite, Hobolite, IVISII: nothing public found. Each needs a packet capture from the iPhone app before anyone can say easy or hard.
- GVM: one Rust project for one model (800D). Billy's two GVM models are unknown, so this is a coin flip until the inventory is done.
- Home Assistant has no integration for any of these six brands. HAOS buys nothing for v1. See section 4.

## 2. Feasibility table

| Brand | Billy's lights (per handoff, unconfirmed) | Known protocol | Existing code | Difficulty | Recommended v1 action |
|---|---|---|---|---|---|
| Neewer | models unknown | Plain BLE GATT writes | `neewer` on PyPI (MIT, bleak only, v0.1.4 Jul 2026, targets TL tubes). taburineagle/NeewerLite-Python (MIT, Linux listed, many models). keefo/neewerlite (Swift, big model database, reference only) | Medium | Build this adapter FIRST to prove the Pi BLE stack. Low risk, fast win |
| Amaran (amaran app) | 3 tubes, F22c, F21c, 9 bulbs | Telink BLE SIG Mesh, proprietary opcode 0x26 over the Mesh Proxy GATT service. Not plain writes | wesbos/amaran-BLE-control (MIT, TypeScript plus ESP32 firmware). R44VC0RP/amcli (Python, macOS only, 2 commits, tested on Halo 60x and T2c) | Hard | Second adapter. Read both repos, port the mesh proxy logic to Python on the Pi. Keys exported from the amaran desktop app on the Mac. Biggest payoff since it is most of the fleet |
| Aputure (Sidus Link) | 600X Pro, 150 bicolor | Unknown. Sidus Mesh, chipset and encryption unverified | None found | Unknown | Capture plan (section 5). Also check whether these two show up in the amaran app. If they do, they may ride the Amaran adapter. Unverified |
| GVM | 2 lights, models unknown | Likely BLE GATT, unverified | Rahel-A/gvm_lights (Rust, MIT, 800D only, bridges to MQTT, Docker with dbus mount, arm64 Dockerfile) | Unknown | Get the model numbers first. If 800D, run gvm_lights as a container. Otherwise capture plan |
| Nanlite (NANLINK 2.0) | models and count unknown | Unknown. Newer fixtures reportedly do direct Bluetooth, older ones need the WS-TB-1 2.4G box (snippet only, unverified) | None found | Unknown | Inventory first. Bluetooth-only lights go to the capture plan. Lights that need the transmitter box are out of scope (no wired or 2.4G hardware wanted) |
| Hobolite | models and count unknown | Unknown. App does on/off, brightness, CCT, firmware updates. BLE assumed, unverified | None. One multi-brand repo lists Hobolite as "planned" with no code | Unknown | Capture plan. Low priority unless the count is high |
| IVISII | models and count unknown | Unknown. Zero web footprint for the brand or app | None | Unknown | Lowest priority. Needs the light's BLE advertised name or FCC ID before any research can continue |

## 3. Recommended brand order (needs Billy's approval)

1. Neewer. Proves the Pi stack in a day. Adapter is mostly glue around an existing library.
2. Amaran. Most of the fleet. Real engineering, but a reference implementation exists.
3. GVM. Cheap if the models match the existing repo, otherwise a capture.
4. Aputure Sidus. Two lights, but the two most expensive ones. Capture.
5. Nanlite. Capture, after the inventory says which lights do direct Bluetooth.
6. Hobolite, then IVISII. Capture, only if count justifies it.

This changes one locked decision: the handoff says "Amaran adapter first." The evidence says Neewer first costs a fraction of Amaran and de-risks the Pi Bluetooth questions (range, connection count, interference with the hotspot) before the hard brand. Billy decides.

## 4. Pi OS and hub: preliminary recommendation

The handoff defaults to Home Assistant OS with a custom service beside it. After research:

- No Home Assistant integration exists for any brand in scope. HA adds nothing to v1 except a dashboard, and the PWA replaces that.
- Amaran needs custom BLE Mesh proxy code. Neewer needs bleak. Both want direct BlueZ access, which is awkward inside HAOS (add-on container, host dbus mapping, 1GB RAM shared with the HA supervisor).
- The on-location hotspot is a must-have. On Raspberry Pi OS that is a few NetworkManager commands. On HAOS it is not a supported feature.
- Read-only filesystem is a built-in option in Raspberry Pi OS (raspi-config overlay FS). HAOS has no equivalent switch.

Options:
A. Reflash to Raspberry Pi OS Lite (64-bit). One Python service (bleak, FastAPI, static PWA). Add Home Assistant Container later only if Billy wants it. Recommended.
B. Keep HAOS. Write the service as a local add-on. Workable, but every one of the four points above gets harder on a Pi 3.
C. Both: HAOS stays on the current card, LightLink goes on a second card (or the 3B+). Zero risk to the existing HA install, and the 3B+ has the same radio, so no loss.

I'd do C now (3B+ on a fresh card, HAOS untouched), which becomes A if Billy later stops caring about HAOS. Billy decides at the Mac, since reflashing touches a device.

## 5. Capture plan for brands with no public protocol (do not start yet)

Billy has iPhone and Mac only. Standard approach:
1. Install Apple's Bluetooth logging profile on the iPhone (from developer.apple.com, Profiles and Logs, "Bluetooth").
2. Open the vendor app, connect to ONE light, do a scripted set of actions: power on, power off, brightness 0 then 50 then 100, CCT min then max. Note the time of each action.
3. Sysdiagnose on the iPhone, pull the .pklg file, open in PacketLogger on the Mac (part of Additional Tools for Xcode).
4. Filter to ATT writes. Match the bytes to the actions by timestamp. For a plain GATT light this gives the command format in one afternoon. For a mesh or encrypted light the payload will look random, which is itself the answer (hard, escalate to Billy).
5. Replay with bleak from the Mac first, then from the Pi.

One brand per capture session. Order: GVM (if not 800D), Aputure Sidus, Nanlite, Hobolite, IVISII.

## 6. Risks confirmed or sharpened by this research

- Pi 3 Bluetooth plus Amaran mesh is the real unknown. Nobody has published a Linux implementation. The wesbos project even built an ESP32 bridge, which hints that a phone or Mac class radio was not enough on its own. A USB Bluetooth adapter (roughly $15 to $25) may be needed. Ask before buying.
- Neewer lights are fragile under command floods (reported by two independent projects). The master dimmer must throttle sends, not spam them on every slider tick.
- The amaran desktop app holds the BLE connection and must be closed before anything else can talk to the lights. Lights must be paired in the app at least once.
- Several Billy models (F22c, F21c, bulbs, tubes) are untested in every repo found. Expect surprises.

## 7. What this session could not do

- Light inventory by model and count (needs the apps on Billy's phone, one question at a time).
- Pi Bluetooth range and connection count test (needs the Pi and Mac).
- Reading the amcli and wesbos source to confirm the Pi path. A Sonnet code agent should do this at the start of Phase 2, roughly 30 minutes.
- Measuring usage against Billy's weekly meter. The three probes used about 260,000 agent tokens plus this session's context. Billy should read the meter himself.

## 8. Progress Log entry (paste into the vault note)

- Oct 22, 2026: Phase 1 web research done from a cloud session. Neewer easy, Amaran hard but has reference code, four brands need captures, HA has no integrations for any of them. Recommended Neewer first, then Amaran, and Raspberry Pi OS on the 3B+ instead of building inside HAOS. Draft saved to the echo-chamber-media repo, branch claude/lightlink-pi-bridge-dq5f2e, lightlink/Feasibility-Draft.md. Billy approved Neewer first and option C (3B+ on a fresh card with Raspberry Pi OS, HAOS untouched). Phase 0 rewritten for option C in section 11. Blocked on: Billy at the Mac for Phase 0 and the light inventory. Next step: Phase 0, then inventory, then Phase 2 starts with the Neewer adapter.

## 10. Decisions locked by Billy (Oct 22, 2026)

- Brand order: Neewer first, then Amaran, then the rest as listed in section 3. Overrides the handoff's "Amaran adapter first."
- Hub: option C. LightLink runs on the Pi 3B+ on a fresh microSD card with Raspberry Pi OS Lite (64-bit). The existing HAOS install on the Pi 3 stays untouched.

## 11. Phase 0, rewritten for option C (Billy at the Mac, no agent spend)

1. Get a spare microSD card, 16GB or larger, class 10 or A1. The current HAOS card is not reused.
2. On the Mac, install Raspberry Pi Imager. Choose Raspberry Pi OS Lite (64-bit). In the settings gear before writing: hostname `lightlink`, enable SSH with a password or the Mac's public key, set the home Wi-Fi so it can also be reached wirelessly, set locale and timezone.
3. Write the card, put it in the 3B+, connect Ethernet to the router, power on, wait two minutes.
4. On the Mac, confirm `ssh <user>@lightlink.local` works. That is the gate.
5. Keep the HAOS Pi 3 running as it is. Nothing changes there.

No long-lived token is needed anymore. Store the Pi login in the password manager, not in notes.

## 9. Source URLs

- https://pypi.org/project/neewer/
- https://github.com/taburineagle/NeewerLite-Python
- https://github.com/keefo/neewerlite
- https://github.com/litui/esphome-components
- https://github.com/wesbos/amaran-BLE-control
- https://github.com/R44VC0RP/amcli
- https://github.com/Rahel-A/gvm_lights
- https://github.com/NoByt3/UniversalContinuouslightControl (Hobolite listed as planned only)
- https://aputure.com/pages/sidus-link (marketing only)
- https://apps.apple.com/app/id1584085006 (NANLINK 2.0 listing)
