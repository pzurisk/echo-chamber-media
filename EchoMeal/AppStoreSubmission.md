# MealTime by Echo Chamber, App Store Submission Pack

Rewritten 2026-08-15 for version 1.2 (build 9), the release that adds a paid subscription. Updated 2026-08-16 against the live App Store Connect record. The free version of this document, written 2026-07-23 for 1.1, is in git history if you need it.

**What changed and why it matters.** MealTime used to be free with no purchases. Version 1.2 puts plan generation behind a $4.99 a month auto-renewable subscription with no free trial. That single change touches almost every part of a submission: the App Privacy answers, the description, the review notes, the age rating page, and it adds a whole category of things Apple can reject you for (guideline 3.1). It also adds a hard prerequisite that has nothing to do with code, the Paid Applications Agreement, which involves banking and tax forms and is the slowest thing on this list.

Everything below was checked against Apple's current published docs. Each factual claim has its source URL in parentheses.

---

## 0. Prerequisites, in order, before anything else

These block everything downstream. Do them first.

1. **Sign the Paid Applications Agreement.** App Store Connect → Business → Agreements, Tax, and Banking. You need a bank account and completed tax forms (https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements). Until this agreement is active you cannot sell a subscription, and in-app purchases will not work in testing either.

   You can prove when it goes live without touching the dashboard. Run:

   ```bash
   cd EchoMeal/Proxy
   node test/check-apple-credentials.mjs \
     --key ~/.appstoreconnect/private_keys/SubscriptionKey_RM7RCHMH3N.p8 \
     --key-id RM7RCHMH3N \
     --issuer-id <the issuer ID from the In-App Purchase key page>
   ```

   As of 2026-08-16 that prints `production REJECTED` and `sandbox OK`, which is Apple's behaviour before an app has a live in-app purchase. When production flips to OK, the agreement and the product are both in place.

   The Issuer ID is account-level. The same value works for App Store Connect API keys and In-App Purchase keys, so there is only one to keep track of.

2. **Finish the subscription's metadata.** It already exists in App Store Connect and is incomplete. Section 3 says exactly which fields to change and which product to leave alone.

3. **Use the existing 1.2 record. Do not create a new version.** Confirmed via the App Store Connect API on 2026-08-16: the app (Apple ID 6793247494) has exactly one version record, 1.2, in state `PREPARE_FOR_SUBMISSION`. It has never been released. So MealTime has no public users to migrate and nothing to break: upload build 9 into the existing 1.2 record. The app's `CFBundleShortVersionString` is 1.2 and `CFBundleVersion` is 9 to match.

---

## 1. The order of operations

**Read this section before doing anything.** The app and the relay have to change together, and doing it in the wrong order breaks MealTime on your phone and your partner's.

The relay now refuses any request it cannot tie to a verified subscription. Build 8, which is what is installed today, sends no subscription at all. So:

1. Paid Applications Agreement active (Section 0).
2. Subscription metadata completed in App Store Connect and attached to version 1.2 (Section 3).
3. **Upload build 9 to TestFlight.** Do not deploy the worker yet.
4. **Install build 9 on both phones through TestFlight.** Buy the subscription on each. TestFlight purchases run in Apple's sandbox, so they cost nothing and do not need a real card.
5. **Only now deploy the worker:** `cd EchoMeal/Proxy && npx wrangler deploy`.
6. Generate a plan on both phones and confirm it works.
7. Submit for review (Section 2).
8. After the version is approved and released, set `ALLOW_SANDBOX_SUBSCRIPTIONS = "0"` in `wrangler.toml` and redeploy, so only real paid subscriptions are accepted.

Between steps 3 and 5, build 9 runs against the old relay. That is fine: the app sends a subscription header the old relay ignores.

If you deploy the worker before step 4, both phones lose the ability to generate anything until they are updated. Nothing is lost permanently, but it looks broken.

---

## 2. Submission checklist

Do these in order once Section 0 is done. Hands-on time about 2 hours.

1. **Confirm the two web pages still load.** https://echochambermedia.com/mealtime/support and https://echochambermedia.com/mealtime/privacy. Apple checks both (https://developer.apple.com/app-store/review/guidelines/ section 5.1.1).

   **The privacy policy needs updating for this release.** It must now also say that the app sends the App Store subscription's transaction identifier to the planning service, that the service keeps it to count how many plans the subscription has used, and that it is a purchase identifier not tied to a name, email, or account. If the policy does not match the App Privacy answers in Section 4, that is a rejection under 5.1.1 and an easy one for a reviewer to spot.

2. **Confirm the build works for a stranger, including the purchase.** The reviewer starts with no household, no setup, and no subscription. On a phone that has never run MealTime: install, tap "Start our household", tap the mic, speak a few dinner ideas, hit the paywall, complete the sandbox purchase, and confirm a plan generates. Then force quit, reopen, and confirm it still says Active in Settings. If any of that fails the app reads as broken under 2.1 (https://developer.apple.com/app-store/review/guidelines/ section 2.1).

3. **Also test Restore Purchases.** Settings → Subscription → Restore purchases. Apple requires a working restore mechanism and reviewers do check it (guideline 3.1.1).

   **What is already checked for you, and what is not.** Two test suites run without a device:

   ```bash
   cd EchoMeal/Proxy && node test/verify-test.mjs          # 23 tests, the relay
   cd EchoMeal && xcodebuild test -project EchoMeal.xcodeproj -scheme EchoMeal \
     -destination 'id=<a booted simulator>'                 # 3 tests, the paywall
   ```

   The app-side tests catch the failure that costs a whole review cycle: a product ID that does not resolve, which produces a permanently disabled buy button with no error message anywhere. They also assert the paywall has a name, a price, and a one-month period (guideline 3.1.2) and that no introductory offer has appeared.

   They cannot drive an actual purchase. `Product.purchase()` needs a live window scene and hangs in a unit test, and every state-changing `SKTestSession` call fails with `notEntitled` on this Mac's simulator. The header comment in `EchoMealTests/SubscriptionStoreTests.swift` records what was tried so nobody repeats it. **Steps 2 and 3 above are therefore genuinely manual and genuinely necessary.** Do not skip them because the tests are green.

4. **Fill in the version metadata** from Section 5 (name, subtitle, promotional text, description, keywords, URLs, categories).

5. **Set the License Agreement.** App Store Connect → App Information → License Agreement. Use Apple's standard EULA unless you have a reason not to. The app already links to it from the paywall (https://www.apple.com/legal/internet-services/itunes/dev/stdeula/).

6. **Upload screenshots** from Section 7. You need one more than last time: the paywall.

7. **Fill in App Privacy** using Section 4. This is under the App Privacy tab, separate from the version page, and it has a new entry this release.

8. **Fill in the Age Rating questionnaire** using Section 6. Unchanged from 1.1, still 4+.

9. **Pricing: the app itself stays FREE.** Do not put $4.99 on the app. The app is free and the subscription is an in-app purchase. Getting this wrong charges people twice and is a confusing mess to unwind.

10. **Attach the subscription to this version.** On the version page, in the In-App Purchases section, add the MealTime Pro Monthly subscription. A subscription's first review has to ride along with an app version; it will not be reviewed on its own.

11. **Export compliance is NOT handled and blocks this submission.** This line used to say it was, citing `ITSAppUsesNonExemptEncryption` as false. That was true for 1.1 and is false now: 1.2 seals every CloudKit payload with AES-256-GCM, the flag is **true** in `Info.plist`, and the app does **not** qualify for an exemption. That requires a BIS Company Identification Number, then an Encryption Registration Number through SNAP-R, then an annual self-classification report, roughly a week of federal turnaround before the build can move to external testing or review. Do not let a wizard talk you into "yes, exempt" because it makes the upload go through. Step by step in `~/EchoChamberHQ/brain/OUTPUTS/mealtime-export-compliance-chrome-handoff.md`, reasoning in README section 7.

12. **Paste the review notes** from Section 8. Leave demo account fields blank; there is still no login.

13. **Set release to "Manually release this version"** if the unlisted status is still pending. If unlisted is already granted, automatic release is fine.

14. **Submit for Review.**

**Timeline.** Apple claims 90 percent of submissions are reviewed in under 24 hours (https://developer.apple.com/app-store/review/). A version that introduces a first subscription draws more scrutiny than a routine update, so plan on a few days. The Paid Applications Agreement, if you have not started it, is the real long pole: banking and tax verification can take several business days on its own.

---

## 3. Finishing the subscription in App Store Connect

**The subscription already exists. Do not create a new one.** Group **MealTime Pro** (`22310219`) holds two products, both sitting in `MISSING_METADATA`:

| Product ID | Reference name | Duration | US price | Ship it? |
|---|---|---|---|---|
| `com.echochamber.mealtime.pro.annual` | MealTime Pro Annual | 1 year | $39.99 | **Yes** |
| `com.echochamber.mealtime.pro.monthly` | MealTime Pro Monthly | 1 month | $4.99 | **Yes** |

**Product IDs in App Store Connect are permanent and cannot be reused after deletion**, so the code was changed to match these, not the other way around. `SubscriptionStore.productIDs`, `MealTime.storekit`, and `SUBSCRIPTION_PRODUCT_IDS` in `Proxy/worker.js` all carry both strings. If any one of them drifts, the app finds no product and the paywall shows a permanently disabled buy button.

**The annual ships as of 2026-08-17. This reverses the earlier decision recorded here, on purpose.**

The old reasoning: an annual subscriber pays $39.99 for the same 240 plans a monthly subscriber pays $59.88 for, so after Apple's 15 percent and roughly $18 a year of API spend, annual leaves about $16 of margin against monthly's $33.

That arithmetic is correct and the conclusion drawn from it was not, because it compares annual against a monthly subscriber who stays all twelve months. The honest comparison is break-even. Annual clears $33.99 net on day one, guaranteed. Monthly clears $4.24 a month. **Annual wins whenever the average monthly subscriber churns before 8 months**, which for a consumer utility with no free trial is the normal case rather than the exception. It also pulls a year of cash forward and removes eleven chances to cancel.

**The allowance question the old note left open is answered by the relay, not by new code.** The quota key in `worker.js` is `sub-<txnId>-<month>`, per transaction per calendar month, with no product in it. An annual subscriber gets `MONTHLY_GENERATION_CAP` twelve times rather than a yearly bucket. Adding the ID to `SUBSCRIPTION_PRODUCT_IDS` was the entire relay change.

**`MealTime.storekit` does not drive the tests.** Verified by probe on 2026-08-17: the file is a synced configuration, and names, descriptions, and prices all resolve from App Store Connect over the network even though the scheme points at the local file. Setting the annual's display name to "ZZPROBE Annual" and its price to "11.11" changed nothing, and erasing the simulator first ruled out a device cache. So `EchoMealTests/SubscriptionStoreTests` is really asserting against App Store Connect, which is stronger coverage than it looks. The practical rule: **a failing assertion there is fixed in App Store Connect, never by editing the .storekit file.**

**What to fill in on the monthly product**

- Duration: 1 month (already set)
- Price: $4.99 USD, with Apple's automatic equivalents in other regions (already set)
- Free trial or introductory offer: **none**. This is deliberate. A trial hands out 20 plans of API spend per signup to anyone who cancels before day one, and at these margins that is not survivable.
- Family Sharing: **off**
- Tax category: the default for apps and digital services. Not physical goods, not reading material.

**Localization (English, US). Change both of these, the current values are wrong.**

- Display name: `MealTime Pro Monthly`
  Currently `Monthly`. The paywall reads this name straight from StoreKit rather than hardcoding it, so whatever you type here is what a customer sees above the price. "Monthly" on its own does not name the thing being bought, which guideline 3.1.2 asks for.
- Description: `20 new meal plans a month, built by voice for your week.`
  Currently `Weekly dinner plans and one shared grocery list.` That version never states the 20-plan limit, which is the single most important thing a buyer needs to know, and "shared" invites the reading that one subscription covers both phones.

**Never say the subscription is shared.** It belongs to one Apple Account. Two people on the same household code each need their own to generate plans, though both can read whatever either one makes. That claim was removed from the store description and from the paywall itself, where it had said the subscription was "shared with the other phone in your household at no extra cost." It is a refund request and a 2.3.1 misleading-metadata rejection waiting to happen. Do not reintroduce it anywhere.

**Attach both to the version.** On the 1.2 version page, the In-App Purchases and Subscriptions section has to list the annual and the monthly before you submit. A first subscription that is not attached to the version does not get reviewed, and the app ships with a paywall nobody can buy from. The reverse is a guideline 2.1 rejection: an in-app purchase submitted for review that a reviewer cannot find or buy in the app. Both are on the paywall as of 2026-08-17, so both go.

**Review information for the subscription**
- Screenshot: the paywall screen (screenshot 2 from Section 7). Apple requires a screenshot of the purchase UI for every in-app purchase.
- Review notes: `Tap the microphone on the Speak tab and say any dinner ideas out loud, then tap to generate. The paywall appears at that point. The subscription unlocks generating new plans; previously saved plans, recipes, and the grocery list stay readable without one.`

---

## 4. App Privacy answers

Background: Apple defines "collect" as transmitting data off the device in a way that lets you or your third-party partners access it for longer than needed to service the request in real time, and you must declare what your third-party partners receive as if it were your own (https://developer.apple.com/app-store/app-privacy-details/).

How that maps to MealTime:

- **Voice audio** is handed to Apple's speech framework and never touched by MealTime beyond that. The app does not set `requiresOnDeviceRecognition`, on purpose, because forcing it returns empty results on phones that have not downloaded Apple's offline model (see the comment in `Services/SpeechRecorder.swift`). So iOS transcribes on the phone when it can and on Apple's servers when it cannot, and which one happens is Apple's call, not the app's. MealTime never records the audio to disk, never stores it, and never sends it anywhere itself. Apple here is the platform provider, not a third-party partner of ours, so under Apple's definition the app does not collect audio. **Do not declare Audio Data.** If a reviewer asks, say it exactly that way, and do not claim audio never leaves the phone, because that is not true on every device.
- **The transcript, budget, taste notes, and meal history** go to Anthropic's API and into CloudKit under the household code. Off-device and retained, so collected. Free-form user input maps to Other User Content.
- **NEW this release: the subscription's transaction identifier.** The app sends it to the relay with every request. The relay checks it with Apple and keeps it in storage to count the month's plans against it. That is purchase history leaving the device, so it has to be declared. It is a number and nothing else: no name, no email, no account.
- **Not linked to identity** holds because there are no accounts, no names, no emails, no device identifiers sent, and the household code is a random shared code rather than a person (https://developer.apple.com/app-store/app-privacy-details/).
- **Not used for tracking** because nothing is combined with third-party data for advertising and nothing goes to data brokers.

The exact clicks:

1. "Do you or your third-party partners collect data from this app?" → **Yes.**
2. Data types: check **User Content → Other User Content** and **Purchases → Purchase History**. Leave everything else unchecked (no Contact Info, no Location, no Identifiers, no Usage Data, no Diagnostics, no Audio Data).
3. For **both** types, usage: **App Functionality** only.
4. For **both**, "linked to the user's identity?" → **No.**
5. For **both**, "used for tracking?" → **No.**

The resulting label reads "Data Not Linked to You: Purchases, Other User Content."

**Keep this in step with `EchoMeal/PrivacyInfo.xcprivacy`,** which declares the same two types in the binary. If the manifest and these answers disagree, that is exactly the kind of inconsistency review catches on a paid app.

---

## 5. Copy-paste metadata

**App name:** MealTime by Echo Chamber

**Subtitle** (27 characters, limit 30):
Speak dinner. Get the week.

**Promotional text** (changeable anytime without review):
Say what sounds good this week. MealTime turns it into a week of dinners and one grocery list, shared between your two phones.

**Description:**

MealTime is a small meal planner built for one household. Two phones, one plan.

Talk instead of type. Tap the mic and say what you are craving, what is in the fridge, or what your week looks like. MealTime turns what you said into text with Apple's speech recognition, then uses Anthropic's Claude AI to turn it into a full week of dinners and a single combined grocery list.

Both of you see the same plan. Enter the same household code on two phones and the week, the recipes, and the list stay in sync through iCloud. Check off groceries at the store and the other phone updates.

What it does:
- Speak your cravings, budget, and taste notes
- Get five weeknight dinner ideas with simple recipes
- One grocery list for the whole week, sorted for shopping
- Every generated recipe saved automatically in the Recipe Box, favorites one tap away
- Syncs between two phones with a private household code

MealTime Pro, two ways to pay:
- Monthly, $4.99 per month
- Annual, $39.99 per year

Both include 20 new meal plans a month:
- Billed to your Apple Account until you cancel
- Cancel anytime in Settings, at least 24 hours before the next renewal
- No free trial

Building new plans needs the subscription, because every plan costs real money to generate. Your saved week, recipes, and grocery list stay readable whether you subscribe or not. The subscription is tied to your Apple Account, so two people sharing a household code each need their own to generate plans, and both can read whatever either one makes.

No ads. No tracking. No accounts.

Made by a two-person household in Las Vegas that got tired of the "what do you want for dinner" standoff.

Note: generating a weekly plan sends your spoken request (as text, never audio) and your saved taste notes to Anthropic's Claude API. See the privacy policy for details.

Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://echochambermedia.com/mealtime/privacy

**Keywords** (91 characters, limit 100):
meal planner,dinner,weekly meals,grocery list,household,recipes,voice,cooking,shopping list

**Support URL:** https://echochambermedia.com/mealtime/support
**Privacy policy URL:** https://echochambermedia.com/mealtime/privacy
**Primary category:** Food & Drink
**Secondary category:** Lifestyle
**Copyright:** 2026 Echo Chamber Media

**Why the subscription block is in the description.** For auto-renewable subscriptions Apple wants the title, the length, the price, and functional links to the terms of use and privacy policy visible to the customer (guideline 3.1.2, https://developer.apple.com/app-store/review/guidelines/). The app already shows all of it on the paywall before anyone can buy, which is the binding requirement. Putting it in the description too costs nothing and removes an easy reason for a rejection.

---

## 6. Age rating answers

Apple replaced the old 12+ and 17+ tiers in 2025. The tiers are 4+, 9+, 13+, 16+, and 18+, and the questionnaire gained mandatory questions about in-app controls, capabilities, medical and wellness content, and violent themes (https://developer.apple.com/news/?id=ks775ehf and https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions).

- Every content descriptor (violence, sexual content, profanity, horror, gambling, alcohol/tobacco/drugs, medical or treatment information): **None**.
- Unrestricted web access: **No**.
- Gambling or contests: **No**.
- User-generated content or messaging between users: **No.** Two phones sharing one private meal plan via a pre-shared code is not public UGC or messaging.
- Parental controls or in-app content controls: **No / Not applicable**.
- Social media capability questions added July 2026: **No.** No feed, no discovery. Mandatory for all submissions from September 2026, so answer them now (https://developer.apple.com/news/?id=tlur8uvi).

Expected result: **4+**. Adding a subscription does not change the age rating.

---

## 7. Screenshots

The app is iPhone-only, so **iPad screenshots are not required** (https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/). That holds only because the project targets iPhone only (`TARGETED_DEVICE_FAMILY: "1"`, set at target level in `project.yml`). If App Store Connect starts demanding a 13 inch iPad set, that setting got reverted.

Requirements:
- **One set for the 6.9 inch iPhone display, portrait, 1320 x 2868 pixels.** A 6.5 inch set (1284 x 2778) is accepted instead if you cannot produce 6.9.
- Minimum 1, maximum 10. Smaller iPhone sizes auto-scale.
- JPEG or PNG, no transparency.

Take exactly 5, in this order:

1. **Speak tab**, mid-listening, showing spoken dinner ideas.
2. **The paywall.** New and required: this same image is the subscription's review screenshot in Section 3.
3. **Week tab**, a full generated week of dinners.
4. **A recipe detail** screen, something that looks appetizing.
5. **List tab**, the grocery list with a few items checked off.

How:
- Best: any 6.9 inch iPhone (16 Pro Max, 17 Pro Max). Side button plus volume up gives exactly 1320 x 2868.
- Otherwise: run in the **iPhone 17 Pro Max simulator** and press Cmd+S per screen. Right size, and Apple accepts them.
- To reach the paywall in the simulator you need the StoreKit configuration, which the scheme already attaches to the Run action (`MealTime.storekit`). Run from Xcode, not by launching the app some other way, or no products load and the buy button stays disabled.

---

## 8. Review notes (paste into App Review Information → Notes)

> MealTime is a private household meal planner intended for UNLISTED distribution. No account or login exists anywhere in the app, so no demo credentials are needed.
>
> IMPORTANT FOR REVIEW: generating a new meal plan requires an auto-renewable subscription (MealTime Pro Monthly, $4.99/month, no free trial). In the sandbox environment this purchase is free and requires no payment method. If the purchase does not complete, plan generation will correctly refuse and the app will appear to do nothing, so please complete the purchase first.
>
> To review: on first launch tap "Start our household" (this creates a new household instantly, nothing to enter). Go to the Speak tab, allow the microphone permission, and say a few dinner ideas out loud, for example "something with chicken, one pasta night, keep it around a hundred dollars." Tap to generate. The paywall appears, showing the price, the billing period, the auto-renewal terms, how to cancel, and links to the Terms of Use and privacy policy. Complete the sandbox purchase and generation resumes automatically with the request you already spoke. Building the week calls Anthropic's Claude API and can take up to a minute on a slow connection. The Week, Recipe, and List tabs then populate.
>
> Restore Purchases is in Settings under Subscription, alongside the current status and a link to manage or cancel the subscription in the App Store.
>
> Speech is transcribed by Apple's speech framework, on the phone when the device supports it and on Apple's servers when it does not. MealTime never records, stores, or transmits the audio itself; only the resulting text is sent.
>
> The subscription is tied to the Apple Account rather than the household, so it is not shared between the two phones. Saved plans, recipes, and the grocery list remain readable without a subscription; only generating new plans requires one.
>
> Household sync between two phones uses the CloudKit public database keyed by a random private household code, with silent push for updates. A second device is not needed to review any functionality.
>
> There are no ads, no analytics SDKs, and no third-party tracking.

---

## 9. Unlisted distribution

**Form:** https://developer.apple.com/contact/request/unlisted-app/

If unlisted was already granted for an earlier version, you do not need to reapply. Unlisted status attaches to the app, not the version. Skip to the note below.

If it is still pending or was never filed: file it immediately after pressing Submit for Review. Apple requires the app to be already on the App Store or submitted to App Review; requests for apps still in beta are declined (https://developer.apple.com/support/unlisted-app-distribution/). Apple does not publish a turnaround; developer reports range from a few business days to a week, with occasional multi-week outliers (https://developer.apple.com/forums/thread/702893). That is why the plan uses manual release.

**Unlisted and paid coexist fine.** An unlisted app can sell in-app purchases normally. It just never appears in search, charts, categories, or recommendations (https://developer.apple.com/support/unlisted-app-distribution/).

**Paste-ready justification:**

> MealTime is a household meal planning app built by Echo Chamber Media for the developer's own family. It lets one household (the developer and his partner, on two phones) speak dinner ideas and receive a shared weekly dinner plan and grocery list. It is intentionally not designed, marketed, or supported for a general audience: there are no accounts, no ads, and no plans for public promotion of any kind. Access is coordinated by a private household code shared in person. The app includes an auto-renewable subscription solely to cover the per-plan cost of the AI service that generates the plans; it is not a commercial product aimed at the public. We are requesting unlisted distribution so the app can be installed by this specific, limited audience through a direct link only, without appearing in App Store search, charts, or recommendations. The app is complete, fully functional for reviewers, and has been submitted to App Review.

**Honest risk note:** Apple's examples of unlisted use cases are employees, partners, research studies, and event attendees. A two-person family app is a limited audience but not one of the listed examples, so Apple may ask questions or decline. If declined, nothing is lost: keep the version unreleased and stay on TestFlight, or release publicly (with no marketing, a niche household app is effectively invisible).

---

## 10. What Apple might push back on

**New for this release, in rough order of likelihood:**

1. **3.1.1 and 3.1.2, subscription mechanics.** The four things reviewers check: the app discloses title, length, and price before purchase; there is a working Restore Purchases; there is a link out to manage or cancel; and the terms of use link works. All four exist (the paywall covers disclosure and both links, Settings → Subscription covers restore and manage). Test all four on a clean install before submitting, because a rejection here is avoidable and costs a full review cycle.

2. **2.1, the reviewer cannot get past the paywall.** This is the big one. The app now does nothing visible until a purchase completes, so any hitch in the sandbox purchase makes it look broken. Mitigations: the review notes in Section 8 say plainly that the purchase is required and free in sandbox; the subscription must be attached to this version (Section 2, step 10); and the product ID must match exactly. Also make sure the relay is deployed and the Anthropic key has credit, or generation fails right after a successful purchase, which is a worse look than failing before it.

3. **3.1.2(a), the description's subscription disclosure.** Handled in Section 5. Reviewers sometimes want the terms restated in the description even though the binary is what the guideline binds. It costs nothing to have it there.

4. **2.3.1, accurate metadata.** The old description said "no subscriptions. Free." Make sure the version you paste is the one in Section 5, not the old one still sitting in App Store Connect. Shipping a description that contradicts the paywall is a straightforward rejection.

5. **5.1.1, privacy policy mismatch.** The App Privacy answers now include Purchase History (Section 4) and the binary's `PrivacyInfo.xcprivacy` declares it. The published privacy policy has to say so too. Section 2, step 1.

**Carried over from 1.1, still relevant:**

6. **5.1.2(i), sharing personal data with third-party AI.** Apple requires apps to clearly disclose when personal data is shared with third parties "including with third-party AI" and to obtain explicit permission first (https://developer.apple.com/app-store/review/guidelines/ section 5.1.2(i), announced at https://developer.apple.com/news/?id=ey6d8onl). Handled: a one-time notice sheet appears before the first plan generation, covering the transcript, budget, taste notes, and meal history going to Anthropic's Claude, with a link to the privacy policy, and planning proceeds only after acceptance. If a rejection cites it, point the reviewer to that sheet on the Speak tab.

7. **The unlisted request** is a separate human decision with no published turnaround. Section 9.

Minor and non-blocking: the mic and speech purpose strings are in the build and describe their use, which is what 5.1.1 requires, and the Speak tab shows a clear visual indication while listening, which 2.5.14 requires of any app that records.

---

## Note on export compliance (already done, for your records)

The app uses only standard HTTPS (Apple's built-in TLS via URLSession) to reach the relay and CloudKit, and no custom cryptography. `ITSAppUsesNonExemptEncryption` is false in Info.plist, which pre-answers the encryption questions so App Store Connect will not prompt at submission (https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance and https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations).

Adding a subscription does not change this. StoreKit is Apple's framework and the relay call is ordinary TLS.

The annual self-classification report to the US Bureau of Industry and Security applies to apps that ship their own non-exempt cryptography; an app that only calls the encryption built into iOS is exempt and has no report to file. France's extra declaration rules target security products (secure storage, secure communications, antivirus) and do not apply to a meal planner (https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance).
