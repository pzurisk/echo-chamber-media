# Dreamer, MealTime

Standing brief for Dreamer passes on this app. Read this before generating a new
roadmap. Update it in place when a pass runs. Append to the Dreaming Log at the
bottom, do not create a second file.

## What this app is

See [README.md](README.md) for the full feature list and technical setup. Short
version: a two-phone household meal planner. Speak or type what sounds good,
Claude plans the week, one synced grocery list, saved recipes, Cook Mode. Synced
through CloudKit's public database using a household code that is both the invite
key and the encryption key. No accounts, no server-side user data beyond the
Cloudflare Worker relay that fronts the Anthropic key.

## Built so far, V3 complete as of 2026-08-22

- Adventurousness slider (Familiar to Wild card), feeds Claude's system prompt
- Viral recipe web search, opt-in toggle, uses Claude's server-side web search tool
- Leftover-aware pairing: a per-day leftover status (three-state tap on the Week
  card), and Claude gets told which leftovers are still around when planning
- Rotation memory: hard no-repeat on the last 14 days, soft variety pressure on
  the 40 dinners before that
- Full manual pantry (Feature 2): add, mark out, mark restocked, remove. Reversible
  "already have this" tagging on the grocery list, forced client-side so it never
  depends on Claude following the prompt instruction
- Subscription paywall, Cloudflare Worker relay in production fronting the
  Anthropic API key

## What's missing for a real Dreamer pass

No usage telemetry exists. Every idea below is a guess, not a measurement.
Concretely missing:

- No count of plan generations, swaps, or Surprise Me taps per week
- No signal on whether the adventurousness slider ever moves off the default, or
  whether the web search toggle gets used
- No signal on whether leftover check-ins actually get tapped, or sit unused
- No signal on how many households ever open the new Pantry screen at all
- No App Store review or rating feed wired into anything

When real numbers exist (App Store Connect analytics, or in-app counters), rerun
this pass against them instead of guessing.

## First pass, light, no usage data, ranked by lift-to-signal ratio

Ordered so the top of the list is what's cheapest to learn from before what's
expensive to build blind.

1. **Bare-minimum usage counters.** Before anything else, count plan generations,
   swaps, pantry edits, and leftover check-ins per household per week, stored in
   the same synced records that already exist. This is the one item that unblocks
   every other item on this list turning into an actual measurement instead of a
   guess.
2. **A scheduled local notification for the weekly plan.** Push infrastructure
   (CloudKit subscriptions, silent push) is already wired in. A local notification
   asking "plan next week?" on whatever day the household usually does it is a
   small addition on top of entitlements that already exist, not a new system.
3. **Surface the leftover check-in instead of waiting for a tap.** Right now it's
   a manual three-state button on the Week card, easy to forget. A light banner
   on the day itself ("Leftovers from Monday still good?") uses data the app
   already has (`leftoverYield`, `leftoverStatus`) and just moves the prompt from
   passive to active.
4. **Auto-suggest pantry restocks from purchase history.** An item checked off the
   grocery list this week is a natural candidate to offer as "add to pantry?" next
   week, cutting the manual entry Feature 2 currently requires for everything.
5. **Per-step timers in Cook Mode.** `cookTimeMin` already exists on every recipe.
   Cook Mode already isolates one step at a time. A timer button per step is
   mostly UI work on data the model already returns, not a new capability.
6. **Aisle-ordered store mode.** Store mode already exists (checked items hide,
   sections collapse). Ordering those sections by a specific store's real aisle
   layout is a bigger lift, no aisle data exists anywhere yet, and it would need
   to be per-store, so this ranks lower until 1 through 5 show it's worth it.

## Dreaming Log

### 2026-08-22, first pass

Written the same day Feature 2 (pantry) shipped, closing out the V3 handoff scope.
No usage data existed to inform this pass, so it is a light first cut built only
from what's in the codebase, not from measurement. Item 1 above (usage counters)
is the recommended next real step before any of the others get built.
