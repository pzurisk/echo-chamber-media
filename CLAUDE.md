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
- **Location on the mini:** `/Users/chad/Sites/echo-chamber-media`. There is a
  `~/Desktop/echo-chamber-media` symlink pointing at it. It is NOT stored on the Desktop
  anymore, and it must not go back there (see the auto-pull section for why).
- **Hosting:** runs on Billy's **Mac mini** ("the Chad", ~192.168.0.195) via `npm run dev`.
  It is started automatically by the launchd job `com.echochamber.site` (RunAtLoad plus
  KeepAlive, so it survives reboots and crashes). The **"Start Echo Chamber Site.command"**
  file starts the same thing by hand, but you rarely need it now, and running both at once
  will collide on port 3000.
  It serves on the local network at `http://192.168.0.195:3000` and is exposed publicly
  as **echochambermedia.com**. There is NO Vercel/Netlify. Dev mode hot-reloads, so saved
  edits appear after the dev server picks them up. To force a clean reload:
  `launchctl kickstart -k gui/$(id -u)/com.echochamber.site`.
- **Repo:** GitHub `pzurisk/echo-chamber-media` (remote `origin`, branch `main`).

## Auto-pull on the mini: FIXED 2026-07-26. Do not move this folder back to the Desktop.
The launchd job `com.echochamber.autopull` (every 2 minutes) keeps the mini in sync so
pushes go live on their own. It silently died on 2026-07-05 and the mini fell 22 commits
behind until someone noticed on 2026-07-26.

**Root cause (confirmed by controlled test, not a guess):** the repo used to live in
`~/Desktop`, which macOS protects with TCC. A launchd agent has no Full Disk Access, so
every read inside that folder returned `Operation not permitted`. Git reports that as the
misleading `fatal: not a git repository: '.../.git'`. Writes succeeded and reads did not,
which is why the failure looked so strange. The old script also sent stderr to `/dev/null`,
so a dead job and a healthy one produced identical (empty) logs.

**The fix:** the repo now lives at `/Users/chad/Sites/echo-chamber-media`, which is not
TCC-protected. `~/Desktop/echo-chamber-media` is now a symlink to it, so opening it from the
Desktop still works. **If you ever move this folder back under `~/Desktop`, `~/Documents`, or
`~/Downloads`, auto-pull will silently break again in exactly the same way.**

Also fixed: `scripts/auto-pull.sh` logs every error instead of discarding it, names the Full
Disk Access cause when reads fail, and writes `.auto-pull-heartbeat` on every run so a dead
job is distinguishable from a quiet one. Both plists were rebuilt for the new path (one had
been hand-edited into a `--git-dir` one-liner that no longer matched the setup script).

**Verified end to end:** local was rolled back one commit, and the job pulled it forward on
its own and logged `updated 56aa10f -> 3070c56`.

**To check whether the job is alive:** `cat .auto-pull-heartbeat` (updated every 2 minutes,
even when there is nothing to pull) and `cat .auto-pull.log` (errors and updates only).
To sync by hand: `git pull --ff-only origin main`.

## Git: IMPORTANT gotchas (these caused real problems, avoid them)
1. **Git writes may fail from a sandboxed tool** (permission denied on index.lock/objects).
   If that happens, run git through the **Desktop Commander** MCP (`start_process`) instead.
   Note: this was NOT a problem in the 2026-07-26 session, where ordinary Bash handled
   fetch/pull/commit/push/branch fine from `~/Sites`. Try Bash first and fall back to
   Desktop Commander only if you actually hit a permission error.
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
