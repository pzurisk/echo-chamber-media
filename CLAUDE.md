# Echo Chamber Media, Project Notes for Claude

Operational memory so future sessions work correctly and don't repeat past mistakes.
Owner: Billy Zurisk, Las Vegas video production company.

## Copywriting rules (ALWAYS. Billy cares about this a lot.)
- NEVER use em dashes anywhere. Not in website copy, blog posts, metadata, page
  titles, alt text, image titles, commit messages, or these notes. Billy has
  flagged this more than once. Use a period, a comma, parentheses, or the word
  "and" instead. Write number ranges as "$2,000 to $5,000", not with a dash.
- Avoid the other AI tells too: hollow taglines, dramatic one-word fragments,
  and generic filler. Follow the echo-chamber-voice skill. Keep copy short,
  specific, plain, and confident, the way a working filmmaker actually talks.
- Blog lives at `src/app/blog/`. Each post is its own folder with a `page.tsx`,
  plus an entry in the `posts` array in `src/app/blog/page.tsx`. Add BlogPosting
  and (where relevant) FAQPage JSON-LD. First pricing-guide post is live.

## How this site is built & deployed
- **Stack:** Next.js 14 (App Router), TypeScript, Tailwind. Source in `src/`.
- **Hosting:** runs on Billy's **Mac mini** ("the Chad", ~192.168.0.195) via `npm run dev`
  launched by double-clicking **"Start Echo Chamber Site.command"** in this folder.
  It serves on the local network at `http://192.168.0.195:3000` and is exposed publicly
  as **echochambermedia.com**. There is NO Vercel/Netlify. Dev mode hot-reloads, so saved
  edits appear after the dev server picks them up; restart the .command to force a clean reload.
- **Repo:** GitHub `pzurisk/echo-chamber-media` (remote `origin`, branch `main`).

## Auto-pull on the mini: KNOWN BROKEN, needs a one-time decision
The launchd job `com.echochamber.autopull` (every 2 minutes) is meant to keep the mini
in sync so pushes go live on their own. It silently died on 2026-07-05 and the mini fell
22 commits behind until someone noticed on 2026-07-26.

**Root cause (confirmed by test, not a guess):** this repo lives in `~/Desktop`, which macOS
protects with TCC. A launchd agent has no Full Disk Access, so every read inside the folder
returns `Operation not permitted`. Git reports that as the misleading
`fatal: not a git repository: '.../.git'`. Writes succeed, reads do not, which is why the
failure looked so strange. The old script also sent stderr to `/dev/null`, so a dead job
and a healthy one produced identical (empty) logs.

**Fixed already:** `scripts/auto-pull.sh` now logs every error instead of discarding it,
names the Full Disk Access cause explicitly, and writes `.auto-pull-heartbeat` on every run
so a dead job is distinguishable from a quiet one. The plist was also rebuilt, since someone
had hand-edited it into a `--git-dir` one-liner that no longer matched the setup script.

**Still needs Billy to pick one (the job cannot work until then):**
1. Grant Full Disk Access to `/bin/zsh` in System Settings > Privacy & Security.
   Least disruptive, but it is a broad grant that covers every shell script on the machine.
2. Move this repo out of `~/Desktop` (for example to `~/Sites/echo-chamber-media`).
   No security grant needed and permanently fixes it, but the site plist, the
   "Start Echo Chamber Site.command" launcher, and these notes all need the new path.

Until then, sync the mini by hand: `git pull --ff-only origin main` in this folder.
Check `.auto-pull.log` and `.auto-pull-heartbeat` to see whether the job is alive.

## Git: IMPORTANT gotchas (these caused real problems, avoid them)
1. **The sandbox CANNOT write to `.git`** (permission denied on index.lock/objects).
   Do ALL git operations (add/commit/push/branch/checkout) via the **Desktop Commander**
   MCP (`start_process`), which runs on Billy's actual Mac. File edits (Read/Write/Edit)
   work fine on the mounted folder; only git writes must go through Desktop Commander.
2. **ALWAYS `git fetch` and check branch sync BEFORE committing.** This repo gets pushed
   to from more than one machine (Billy edits here; commits also arrive from elsewhere).
   The local clone can be behind `origin/main`.
3. **Do NOT lump unrelated work into one commit.** A past mistake: committing pre-existing
   uncommitted redesign work together with new SEO edits, on an old base, created a diverged
   history that was painful to reconcile. Commit ONLY the changes you made, ideally on a
   branch off the latest `origin/main`.
4. When history has diverged, reconcile by branching off `origin/main` and re-applying only
   your unique changes (clean files via `git checkout <yourcommit> -- <paths>`, overlapping
   files by hand), then fast-forward `main`. Don't blind-merge or force-push `main`.

## Known-good config values (don't break these)
- **GA4 Measurement ID:** `G-C2R4NNXYCY` (in `src/app/layout.tsx`). Real, in production. Keep it.
- **Booking:** Google Calendar appointment schedule (NOT Cal.com anymore).
  Link: `https://calendar.app.google/V6EFC7Cv3rJHxAdGA`. Used in `src/sections/Contact.tsx`
  and should be the value in Google Business Profile's booking field.
- **Phone:** (989) 308-1633 · **Sales email:** Echochambermediasales@gmail.com
- **Schema:** use valid schema.org types. `VideoProductionCompany` is NOT a real type, the homepage/service schema must be `LocalBusiness`/`ProfessionalService`, `Service`,
  `FAQPage`, `VideoObject`. NEVER add fake `aggregateRating`/reviews (penalty risk).

## SEO work completed (commit e1c1ff8 on main)
- Fixed invalid sitewide schema → valid LocalBusiness/ProfessionalService.
- Added FAQPage + Service schema to wedding-videography page; removed a fabricated
  50-review aggregateRating (do not reintroduce).
- Added VideoObject schema to the portfolio (uploadDate for the Doritos clip is a
  placeholder `2026-04-02`, update to the real YouTube publish date).
- Added "Related Services" internal links to all 7 service pages.
- Switched all booking CTAs from Cal.com to the Google Calendar link.
- Still TODO from the audit: dedicated `/portfolio` page, replicate the booking on GBP,
  Google Business Profile completion (photos/reviews), and the content/blog plan.

## Other standing context
- A **daily 6 AM calendar brief** scheduled task summarizes Billy's Google Calendar and
  screens every invite for phishing (he was targeted by fake "Free Consultation" bookings
  on the throwaway domain `papershared.online`). Never click links inside calendar invites.
- The "9am/10am Free Consultation" entries that blanket the calendar are the booking page's
  **availability**, not real bookings, they are not deletable as events; narrow the
  appointment schedule to change them. Real bookings show up as normal events.
