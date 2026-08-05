# Signal Chain Teacher

A native macOS app that teaches Billy his five-piece synth rig for film
scoring (Behringer Model D, Mother-32, DFAM, Subharmonicon, Nightfall),
with a Claude-powered teacher that evaluates what he actually patched
instead of a fixed checklist.

Built for the M3 Ultra Mac Studio. Desktop only, no App Store distribution,
no cloud sync between devices.

## Phases shipped

- **Phase 1: Rack view and manual mode.** Five module panels with lock
  state and completion percentage, objectives per module, manual
  complete/incomplete, XP and level tracking, local SwiftData persistence.
- **Phase 2: AI teacher.** "Ask the teacher" on any objective sends what
  Billy patched to Claude, grounded in the objective and his gear list.
  The reply is parsed for met/partial/not met and marks the objective
  complete on a genuine match. Every exchange is logged per module so the
  teacher has context on prior attempts.
- **Phase 3: Quiz and freeform teacher.** The 12-card cue vocabulary bank
  as flashcards, plus a freeform mode where Billy describes a film moment
  and gets a live module/technique suggestion.

Phase 4 (session log export) and Phase 5 (the audio bridge) are not built.
See the original handoff doc for that scope; do not start Phase 5 until
the core teacher loop here has been used for real sessions.

## Setup

1. Install [XcodeGen](https://github.com/yonaskolb/XcodeGen) if you don't
   have it: `brew install xcodegen`.
2. From this folder, run `xcodegen generate`. This produces
   `SignalChainTeacher.xcodeproj` (gitignored, regenerate it any time
   `project.yml` changes instead of hand-editing project settings).
3. Open the generated project in Xcode and run it (⌘R). First launch
   seeds the curriculum and cue vocabulary automatically.

### Anthropic API key (needed for Phase 2 and 3's teacher features)

The rack view, objectives, and manual complete/incomplete all work with no
key. The AI teacher needs one.

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign
   in (or create an account).
2. Open **API Keys** in the left sidebar and create a new key.
3. Anthropic API usage is billed separately from a claude.ai subscription;
   add a payment method under **Billing** if the account does not have one
   yet. Usage here is light (short text exchanges), so cost should be
   minimal, but there is no free tier without billing set up.
4. Run the app, open **Settings** (gear icon in the sidebar toolbar),
   paste the key into the API Key field, and click **Save to Keychain**.

The key is stored in the macOS Keychain under the item
`SignalChainTeacher-APIKey`. It is never written to source, a config
file, or a log, and it is not committed to this repo. `ClaudeTeacherService`
reads it from Keychain at call time only.

The model id used is `claude-sonnet-5`, current as of this build. Model
names change; check [docs.claude.com](https://docs.claude.com) before
assuming that string is still current if the teacher starts erroring on
model not found.

## Project layout

```
SignalChainTeacher/
  project.yml                    XcodeGen definition
  SignalChainTeacher/
    SignalChainTeacherApp.swift   App entry, SwiftData container, seeding
    Models/                       SwiftData models (Module, Objective, ...)
    Content/SeedContent.swift     Curriculum + cue vocabulary, ported from
                                  signal-chain-content.json. Edit here to
                                  change the curriculum, not in the views.
    Support/
      Theme.swift                 Rack colors per module, fonts
      XPCalculator.swift          XP thresholds and totals
      KeychainService.swift       API key storage
    Services/ClaudeTeacherService.swift   Messages API calls, persona prompt
    Views/                        RootView, ModuleDetailView, AskTeacherSheet,
                                  QuizView, FreeformTeacherSheet, SettingsView
```

## Known follow-ups

- **Oswald font.** The HTML artifact used Oswald for module labels.
  `Theme.displayFont` approximates it with a heavy system weight for now.
  To match exactly, add the Oswald `.ttf` files (OFL licensed, from Google
  Fonts) to `Assets`, register them in `project.yml` via
  `INFOPLIST_KEY_ATSApplicationFontsPath` or a fonts resource, and swap
  `Theme.displayFont` to reference them by name.
- **App icon.** `Assets.xcassets` has no `AppIcon` set yet. Add one before
  distributing outside Xcode's own Run.
- Phase 4 (session log export, DEADCHORD notes integration) and Phase 5
  (the audio bridge) are open scope, not started.
