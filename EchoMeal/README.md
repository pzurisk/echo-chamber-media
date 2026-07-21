# Echo Meal

A private iOS app for Billy and Melissa. Speak your dinner cravings, get a
full week of dinners, one checkable grocery list, and saved recipes, all
synced live between both phones through CloudKit. Distributed through
TestFlight only. No App Store submission.

## What it does

- **Speak tab.** One big red button. Tap once to talk, tap again when done
  (no auto-stop). Apple's Speech framework transcribes, then the transcript
  goes to Claude (claude-sonnet-5) to plan the week, along with taste notes
  the app learns over time (favorites, repeat cuisines, recent dinners).
  A Surprise Me button plans a week from the taste notes alone.
- **Week tab.** Five dinner cards, Monday through Friday. Tap for the full
  recipe. Heart a recipe to save it to Favorites. Rate a meal 1 to 5 stars
  after cooking it: 4 and 5 stars pull future plans toward it, 1 and 2
  stars mean it never gets suggested again.
- **Recipe Box.** Every generated recipe is archived automatically, newest
  first, and nothing is ever removed on its own. Deleting is manual only,
  from the Recipe Box screen (the books icon on the Week tab), with a
  confirmation first. Searchable by title.
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
  complete.
- **Settings.** Budget target, dinners per week, household code.

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
    Config/HouseholdConfig.swift   Household code + container ID
    Models/MealPlanModels.swift    Codable types matching Claude's JSON schema
    Services/SpeechRecorder.swift  Mic + SFSpeechRecognizer, tap to start and stop
    Services/ClaudeService.swift   Anthropic Messages API call + JSON parsing
    Services/CloudKitStore.swift   Public-database records + subscriptions
    State/AppState.swift           App-wide state, sync, local cache
    Views/                     Speak, Week, RecipeDetail, Favorites, RecipeBox, List, Settings
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
the fixed household code (`ZURISK-KITCHEN` in `HouseholdConfig.swift`):

| Record type   | Record name              | Fields                                |
|---------------|--------------------------|---------------------------------------|
| HouseholdPlan | `plan-ZURISK-KITCHEN`      | planJSON, householdID, updatedAt      |
| GroceryState  | `grocery-ZURISK-KITCHEN`   | checkedIDs, householdID, updatedAt    |
| Favorites     | `favorites-ZURISK-KITCHEN` | recipesJSON, householdID, updatedAt   |
| TasteHistory  | `history-ZURISK-KITCHEN`   | historyJSON, householdID, updatedAt   |
| Ratings       | `ratings-ZURISK-KITCHEN`   | ratingsJSON, householdID, updatedAt   |
| RecipeBox     | `recipebox-ZURISK-KITCHEN` | recipesJSON, keptJSON, householdID, updatedAt |

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

The app registers the subscriptions itself on every launch
(`CloudKitStore.ensureSubscriptions`), so there is nothing to create by hand.

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

## A more secure key setup (recommended eventually)

Two lines, as promised: instead of shipping the Anthropic key inside the
app, put the key in a tiny serverless proxy (a Cloudflare Worker or Vercel
function) that forwards requests to api.anthropic.com, and point
`ClaudeService` at that URL with no key on the device at all. Anyone who
unzips an IPA can read an embedded key; a proxy keeps it server-side and
lets you rotate or rate-limit without shipping a new build.
