# MealTime (code folder: EchoMeal)

The app's name on the phone is MealTime. The code folder, Xcode project,
and bundle ID keep the original EchoMeal naming so nothing breaks
(renaming a bundle ID would orphan the CloudKit container and everyone's
data). Only the display name and user-facing text say MealTime.

A private iOS app for Billy and Melissa. Speak your dinner cravings, get a
full week of dinners, one checkable grocery list, and saved recipes, all
synced live between both phones through CloudKit. Distributed through
TestFlight and, as of this round, prepared for an unlisted App Store
release.

## What it does

- **Speak tab.** One big red button. Tap once to talk, tap again when done
  (no auto-stop). Apple's Speech framework transcribes, then the transcript
  goes to Claude (claude-sonnet-5) to plan the week, along with taste notes
  the app learns over time (favorites, repeat cuisines, recent dinners).
  A Surprise Me button plans a week from the taste notes alone, and a
  typed input option covers loud rooms or a dead mic.
- **Week tab.** One card per dinner, 3 to 7 nights depending on the
  dinners-per-week setting. Tap for the full recipe. Heart a recipe to
  save it to Favorites. Rate a meal 1 to 5 stars after cooking it: 4 and
  5 stars pull future plans toward it, 1 and 2 stars mean it never gets
  suggested again. A trash button clears the whole week on both phones;
  the recipes stay saved in the Recipe Box.
- **Swap one night.** Swipe a dinner on the Week tab (or long press it)
  to swap just that night, by voice, typing, or a surprise pick. The rest
  of the week stays exactly as it was, the grocery list updates for the
  new dinner, and your check-offs stay checked.
- **Cook Mode.** A Start cooking button on every recipe opens a full
  screen, one giant step at a time view: tap the right side to advance,
  the left to go back, with an ingredients checklist up front. The screen
  stays awake the whole time, and it ends with the star rating.
- **Recipe Box.** Every generated recipe is archived automatically, newest
  first, and nothing is ever removed on its own. Deleting is manual only,
  from the Recipe Box screen (the books icon on the Week tab), by swipe or
  Edit mode, always with a confirmation first. Searchable by title.
  Favorites has no confirmation: swipe (or use Edit) to remove one, and
  the heart on the recipe brings it back any time.
- **Keep pins.** Pin any recipe (from the Recipe Box, a swipe, or the pin
  in the recipe detail toolbar) to lock that exact dinner into the next
  generated week. Claude places pinned dinners on sensible days, invents
  only the remaining nights, and the grocery list covers everything. Pins
  survive week after week until unpinned.
- **List tab.** One consolidated grocery list grouped Proteins, Produce,
  Pantry, Dairy, Bread, Sauces, with a budget bar up top. Pantry staples
  start pre-checked. Checking an item syncs to the other phone. The app
  also cross-checks the list against every recipe's ingredients and adds
  anything missing to a "From recipes" section, so the list is always
  complete. A cart button turns on store mode: checked items hide, done
  sections collapse, and a big "9 of 27 items left" count leads the page.
- **Settings.** Budget target, dinners per week, pantry staples, household
  code (view it, share it, start a new household, or join a different one).
  Pantry staples are the things the household always has at home (rice,
  olive oil, soy sauce). Claude leaves them off the grocery list and out of
  the budget estimate, and the list they live on syncs between both phones
  like everything else.

## Project layout

```
EchoMeal/
  project.yml                  XcodeGen definition (optional)
  Secrets.example.xcconfig     Template. Copy to Secrets.xcconfig (gitignored)
  EchoMeal/
    EchoMealApp.swift          App entry, push registration
    Info.plist                 Usage descriptions, background modes, API key slot
    EchoMeal.entitlements      CloudKit + push entitlements
    Theme.swift                Colors and card styling
    Config/HouseholdConfig.swift   Household code storage, generation, migration + container ID
    Models/MealPlanModels.swift    Codable types matching Claude's JSON schema
    Services/SpeechRecorder.swift  Mic + SFSpeechRecognizer, tap to start and stop
    Services/ClaudeService.swift   Anthropic Messages API call + JSON parsing
    Services/CloudKitStore.swift   Public-database records + subscriptions
    State/AppState.swift           App-wide state, sync, local cache
    Views/                     Onboarding, Speak, Week, RecipeDetail, CookMode, Favorites, RecipeBox, List, Settings
```

## 1. Create the Xcode project

Two ways. Pick one.

**A. XcodeGen (fastest)**

```bash
brew install xcodegen
cd EchoMeal
cp Secrets.example.xcconfig Secrets.xcconfig   # then edit it, see step 2
xcodegen generate
open EchoMeal.xcodeproj
```

**B. Manual in Xcode**

1. Xcode > File > New > Project > iOS App. Product name `EchoMeal`,
   interface SwiftUI, language Swift, bundle ID
   `com.echochambermedia.echomeal`, minimum iOS 17.
2. Delete the template `ContentView.swift` and `EchoMealApp.swift`, then drag
   the whole `EchoMeal/EchoMeal` source folder from Finder into the project
   navigator (check "Copy items if needed" is OFF, add to the EchoMeal target).
3. Target > Build Settings: set `Info.plist File` to `EchoMeal/Info.plist`
   and turn OFF `Generate Info.plist File`.
4. Project > Info > Configurations: set both Debug and Release to use
   `Secrets.xcconfig` (after step 2 below).

## 2. Secrets.xcconfig (where the API key goes)

```bash
cd EchoMeal
cp Secrets.example.xcconfig Secrets.xcconfig
```

Edit `Secrets.xcconfig`:

- `ANTHROPIC_API_KEY` = your key from console.anthropic.com
- `DEVELOPMENT_TEAM` = your Apple Developer Team ID

The key flows: xcconfig -> build setting -> `$(ANTHROPIC_API_KEY)` in
Info.plist -> read at runtime in `ClaudeService.swift` via
`Bundle.main.object(forInfoDictionaryKey: "ANTHROPIC_API_KEY")`.

`Secrets.xcconfig` is already in the repo's `.gitignore`. Keep it that way.

Note on the API call itself: the `anthropic-version` header in
`ClaudeService.swift` is `2023-06-01`. That is the correct, current value
for the Messages API. If you ever see a spec floating around with
`2023-06-06`, that value is wrong and the API will reject it.

## 3. Capabilities and entitlements

With the project open, select the EchoMeal target > Signing & Capabilities:

1. **Signing.** Team = your team, automatic signing on.
2. **+ Capability > iCloud.** Check **CloudKit**. Add container
   `iCloud.com.echochambermedia.echomeal` (create it right there with +).
3. **+ Capability > Push Notifications.** (CloudKit subscriptions deliver
   through silent pushes.)
4. **+ Capability > Background Modes.** Check **Remote notifications**.

If you used XcodeGen, the entitlements file already declares all of this;
Xcode just needs the capabilities toggled so the App ID on Apple's side gets
them too.

## 4. CloudKit setup

The app uses the **public database** with a small set of records keyed by
a per-household code. There is no fixed code anymore. On first launch the
app shows onboarding: one phone taps "Start our household" and gets a
fresh code in the format `MEAL-XXXXXX`, and the other phone joins by
typing that code. The code is visible and changeable in Settings.

There is no legacy migration. An earlier build adopted a fixed household
code that was hardcoded in this repo, which is public, so anyone reading
the source could pull that household's records out of the public
database. That migration is gone and the affected records were deleted.
An install with no code goes through onboarding. Never hardcode a
household code here.

The code works like a house key. Anyone who has it can see and edit the
meal plan, the grocery list, and the saved recipes, so share it only with
your household.

| Record type   | Record name         | Fields                                |
|---------------|---------------------|---------------------------------------|
| HouseholdPlan | `plan-<code>`       | planJSON, householdID, updatedAt      |
| GroceryState  | `grocery-<code>`    | checkedIDs, householdID, updatedAt    |
| Favorites     | `favorites-<code>`  | recipesJSON, householdID, updatedAt   |
| TasteHistory  | `history-<code>`    | historyJSON, householdID, updatedAt   |
| Ratings       | `ratings-<code>`    | ratingsJSON, householdID, updatedAt   |
| RecipeBox     | `recipebox-<code>`  | recipesJSON, keptJSON, householdID, updatedAt |
| Pantry        | `pantry-<code>`     | staplesJSON, householdID, updatedAt   |

Steps:

1. Run the app once on your phone signed into iCloud and generate a plan.
   In the **Development** environment, CloudKit creates the record types
   automatically the first time each record is saved.
2. Open [icloud.developer.apple.com](https://icloud.developer.apple.com),
   pick the `iCloud.com.echochambermedia.echomeal` container.
3. Schema > Indexes: for each of the record types in the table above, add a
   **Queryable** index on `householdID`. This is what lets the
   CKQuerySubscription (live sync push) work. While you are there, also add
   Queryable on `recordName` for each type (harmless, and useful for
   browsing records in the console).
4. **Deploy schema to Production.** CloudKit Console > Deploy Schema
   Changes. TestFlight builds run against the Production environment, so
   this step is required before the TestFlight install will sync. Do it
   again any time the schema changes.

IMPORTANT: the **Pantry** record type (pantry staples) is newer than the
others. Like every record type, it needs the one-time **Queryable index on
`householdID`** from step 3 (save a staple once in Development so CloudKit
creates the type first), and then the schema must be **re-deployed to
Production** (step 4) before TestFlight or App Store builds will sync
pantry staples between phones.

The app registers the subscriptions itself on every launch
(`CloudKitStore.ensureSubscriptions`), so there is nothing to create by
hand. Subscription IDs include the household code, and stale subscriptions
left over from an old code are deleted automatically when a phone starts
or joins a different household.

Both phones must be signed into iCloud (any two Apple IDs, they do not need
to share one). The app shows a banner if iCloud is off.

## 5. Build and run on a physical iPhone

1. Plug in the iPhone (or use Wi-Fi debugging), unlock it, trust the Mac.
2. Pick the phone as the run destination in Xcode's toolbar.
3. Press Run. First time: on the phone, Settings > General > VPN & Device
   Management > trust your developer certificate.
4. On first mic tap, accept the microphone and speech recognition prompts.
5. Speak a few cravings, wait for "Planning your week." to finish, and check
   the Week and List tabs.

## 6. TestFlight walkthrough (both phones)

1. In [App Store Connect](https://appstoreconnect.apple.com) > My Apps >
   **+** > New App. Platform iOS, bundle ID
   `com.echochambermedia.echomeal`, any name (Echo Meal), primary language,
   SKU anything (for example `echomeal-1`).
2. In Xcode: select **Any iOS Device (arm64)** as destination, then
   Product > **Archive**.
3. Organizer window opens. **Distribute App** > **TestFlight & App Store**
   (App Store Connect) > Upload. Automatic signing. Wait for processing
   (10 to 30 minutes, Apple emails you).
4. App Store Connect > Echo Meal > TestFlight tab. The build appears. Answer
   the export compliance question (the Info.plist already declares no
   non-exempt encryption, so it may not even ask).
5. **Internal Testing** > create a group (Household). Add Billy's and
   Melissa's Apple IDs as testers (Users and Access > add them with the
   Customer Support or Developer role first if they are not in the team, or
   just add their emails directly as internal testers if they are). Internal
   testing needs no App Review.
6. Both phones: install **TestFlight** from the App Store, open the invite
   email, tap View in TestFlight, Install.
7. Remember: TestFlight uses the **Production** CloudKit environment, so
   make sure step 4.4 (deploy schema) happened first.
8. Builds expire after 90 days. When it nags, archive and upload again with
   a bumped build number.

Note on push signing: the entitlements file sets aps-environment to
development for device builds. When you archive and upload through the
organizer, Xcode automatically re-signs the build with the production APS
environment, so nothing needs changing by hand there.

## A more secure key setup (built in now)

This is no longer hypothetical. The repo ships a tiny Cloudflare Worker
relay in `Proxy/` that holds the Anthropic key server side. Deployment
steps, key rotation, and the xcconfig gotchas are all in
[Proxy/README.md](Proxy/README.md).

How the app picks a mode: when `CLAUDE_PROXY_URL` is set in
`Secrets.xcconfig`, `ClaudeService` automatically sends requests through
the Worker with no key on the device (plus an `x-app-token` header if
`CLAUDE_PROXY_TOKEN` is set). When it is not set, the app falls back to
calling api.anthropic.com directly with the embedded `ANTHROPIC_API_KEY`,
exactly as before, so nothing breaks until the relay is deployed.

App Store builds should ALWAYS use the proxy, with `ANTHROPIC_API_KEY`
left empty so no key ships in the binary. Anyone who unzips an IPA can
read an embedded key; the relay keeps it server side and lets you rotate
or rate-limit without shipping a new build.
