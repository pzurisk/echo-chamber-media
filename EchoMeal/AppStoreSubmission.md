# MealTime by Echo Chamber, App Store Submission Pack

Written 2026-07-23 for submission on 2026-07-24. Everything below was checked against Apple's current published docs. Each factual claim has its source URL in parentheses. Follow it top to bottom.

One heads up before the checklist. Unlisted approval is a separate request that can take from a few business days to a couple of weeks, and Apple does not publish a guaranteed turnaround (https://developer.apple.com/support/unlisted-app-distribution/, plus developer reports at https://developer.apple.com/forums/thread/702893). The plan below handles that by using manual release, so the app never appears in public search while you wait.

---

## 1. The plan for tomorrow

Do these in order. Total hands-on time is about 1 to 2 hours.

1. **Publish the two web pages first.** Apple checks that the support URL and privacy policy URL actually load. Put a simple support page at https://echochambermedia.com/mealtime/support and a privacy policy at https://echochambermedia.com/mealtime/privacy before you submit. The privacy policy must say what data the app handles, that spoken input is transcribed on the phone, that the transcript and meal preferences are sent to Anthropic to generate plans, that meal data is stored in iCloud (CloudKit) under a household code, how long data is kept, and how to contact you to delete it (https://developer.apple.com/app-store/review/guidelines/ section 5.1.1).
2. **Confirm the uploaded build actually works for a stranger.** The reviewer launches with no household and no setup. Install the TestFlight build on a phone that has never used the app, tap "Start our household", speak a few dinner ideas, and confirm a plan generates. If the Claude connection in the build is dead (a rate limited API key, or a proxy that is not deployed, see Proxy/README.md, App Store builds should use the proxy), the app will look broken and get rejected under 2.1 (https://developer.apple.com/app-store/review/guidelines/ section 2.1).
3. **Open App Store Connect, go to the MealTime by Echo Chamber app record, version 1.1.** Fill in all metadata from Section 2 below (name, subtitle, promotional text, description, keywords, support URL, privacy policy URL, categories).
4. **Upload screenshots** from Section 5.
5. **Fill in App Privacy** using Section 3. This is under the App Privacy tab, separate from the version page.
6. **Fill in the Age Rating questionnaire** using Section 4. Apple replaced the old tiers in 2025, so expect more questions than older guides show (https://developer.apple.com/news/?id=ks775ehf).
7. **Set pricing and availability to free and publicly available.** Do not pick private Apple Business Manager distribution. Unlisted apps must be set up as publicly available first; the unlisted request is what hides them (https://developer.apple.com/support/unlisted-app-distribution/).
8. **Export compliance is already handled.** The build declares ITSAppUsesNonExemptEncryption false in its Info.plist, so App Store Connect will not ask encryption questions at submission (https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance). Details in the note at the end of this file.
9. **Paste the review notes** from Section 6 into the "Notes" field in the App Review Information box. Leave the demo account fields blank; the app has no login, so no demo account is required. Apple only requires demo credentials for apps with login features (https://developer.apple.com/app-store/review/guidelines/ section 2.1).
10. **Set release to "Manually release this version".** This matters. If review approves the app before your unlisted request is approved, automatic release would put it in public search. Manual release keeps it approved but not live until you press Release.
11. **Press Submit for Review.**
12. **Immediately after submitting, file the unlisted app request** using Section 7. Apple requires the app to be either already on the App Store or submitted to App Review before you file the request, so right after submission is the correct moment (https://developer.apple.com/support/unlisted-app-distribution/).
13. **Wait.** Expect review to take 1 to 5 days for a first submission (see the timeline note below). Expect the unlisted decision separately, typically within about a week but sometimes longer.
14. **When both are approved, press Release.** Apple generates the unlisted link, or your normal App Store link simply works as the direct link. Share it with your partner and you are done.

**Timeline reality check.** Apple's official claim is that 90 percent of submissions are reviewed in under 24 hours (https://developer.apple.com/app-store/review/). That figure mostly reflects updates from established apps. In 2026 the queue has grown, and brand new apps commonly wait 2 to 5 days, with some outliers longer (developer reports, for example https://developer.apple.com/forums/thread/816818). So: submitting tomorrow is right, but plan on having the link in hand within one to two weeks, not tomorrow night.

---

## 2. Copy-paste metadata

**App name:** MealTime by Echo Chamber

**Subtitle** (27 characters, limit is 30):
Speak dinner. Get the week.

**Promotional text** (can be changed anytime without review):
Say what sounds good this week. MealTime turns it into a week of dinners and one grocery list, shared between your two phones.

**Description:**

MealTime is a small meal planner built for one household. Two phones, one plan.

Talk instead of type. Tap the mic and say what you are craving, what is in the fridge, or what your week looks like. MealTime listens on your phone using Apple speech recognition, then uses Anthropic's Claude AI to turn it into a full week of dinners and a single combined grocery list.

Both of you see the same plan. Enter the same household code on two phones and the week, the recipes, and the list stay in sync through iCloud. Check off groceries at the store and the other phone updates.

What it does:
- Speak your cravings, budget, and taste notes
- Get five weeknight dinner ideas with simple recipes
- One grocery list for the whole week, sorted for shopping
- Every generated recipe saved automatically in the Recipe Box, favorites one tap away
- Syncs between two phones with a private household code

What it does not do: no accounts, no ads, no tracking, no subscriptions. Free.

Made by a two-person household in Las Vegas that got tired of the "what do you want for dinner" standoff.

Note: generating a weekly plan sends your spoken request (as text, never audio) and your saved taste notes to Anthropic's Claude API. See the privacy policy for details.

**Keywords** (91 characters, limit is 100):
meal planner,dinner,weekly meals,grocery list,household,recipes,voice,cooking,shopping list

**Support URL:** https://echochambermedia.com/mealtime/support
**Privacy policy URL:** https://echochambermedia.com/mealtime/privacy
**Primary category:** Food & Drink
**Secondary category:** Lifestyle
**Copyright:** 2026 Echo Chamber Media

---

## 3. App Privacy answers

Background on the rules. Apple defines "collect" as transmitting data off the device in a way that lets you or your third-party partners access it for longer than needed to service the request in real time, and you must declare data your third-party partners receive as if it were your own (https://developer.apple.com/app-store/app-privacy-details/).

How that maps to MealTime, honestly:

- **Voice audio** never leaves the phone. Apple's on-device speech recognition transcribes it locally. Under Apple's definition, audio is NOT collected. Do not declare Audio Data.
- **The transcript, budget, taste notes, and meal history** are sent to Anthropic's API and stored in CloudKit under the household code. That is off-device and retained, so it IS collected. It is free-form user input, which Apple maps to "Other User Content" (https://developer.apple.com/app-store/app-privacy-details/).
- **Not linked to identity** is defensible because there are no accounts, no names, no emails, no device IDs sent, and the household code is a random shared code, not a person. Apple's test is whether direct identifiers are absent and you make no attempt to re-link data to a user, which holds here (https://developer.apple.com/app-store/app-privacy-details/).
- **Not used for tracking** because nothing is combined with third-party data for ads and nothing goes to data brokers (https://developer.apple.com/app-store/app-privacy-details/).

The exact clicks in the App Privacy section:

1. "Do you or your third-party partners collect data from this app?" → **Yes, we collect data from this app.** (Anthropic and CloudKit both receive user content.)
2. Data types: check **User Content → Other User Content** only. Leave everything else unchecked (no Contact Info, no Location, no Identifiers, no Usage Data, no Diagnostics, no Audio Data).
3. For Other User Content, usage: check **App Functionality** only.
4. "Is this data linked to the user's identity?" → **No.**
5. "Do you or your third-party partners use this data for tracking purposes?" → **No.**

Optional belt-and-suspenders choice: if you want to be maximally conservative you may also declare **Identifiers → User ID** (for the household code) with the same answers (App Functionality, not linked, no tracking). It is defensible either way; the code identifies a shared household record, not a person. Declaring only Other User Content is the accurate minimal answer.

The resulting label will read "Data Not Linked to You: Other User Content", which is truthful and looks fine for a household app.

---

## 4. Age rating answers

Apple replaced the old 12+ and 17+ tiers in 2025. The tiers are now 4+, 9+, 13+, 16+, and 18+, and the questionnaire gained mandatory questions about in-app controls, capabilities, medical and wellness content, and violent themes (https://developer.apple.com/news/?id=ks775ehf and https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions).

Answers for MealTime:

- Every content descriptor (violence, sexual content, profanity, horror, gambling, alcohol/tobacco/drugs references, medical or treatment information, etc.): **None**.
- Unrestricted web access: **No**.
- Gambling or contests: **No**.
- User-generated content or messaging between users: **No.** (Two phones sharing one private meal plan by a pre-shared code is not a public UGC or messaging feature.)
- Parental controls or in-app content controls: **No / Not applicable**.
- In July 2026 Apple also added social media capability questions, defined as the ability to redistribute, amplify, or interact with user-generated content through a social feed or similar discovery. Answer **No**; MealTime has no feed and no discovery. These answers become mandatory for all submissions in September 2026, so answer them now (https://developer.apple.com/news/?id=tlur8uvi).

Expected result: **4+**.

---

## 5. Screenshots

The app is iPhone-only, so **iPad screenshots are not required** (https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/). One warning: this is only true if the Xcode project targets iPhone only. If the build's device family includes iPad, App Store Connect will demand a 13 inch iPad set too. If it asks for iPad shots, that is why.

What Apple requires (https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/):

- **One set for the 6.9 inch iPhone display, portrait 1320 x 2868 pixels.** If you cannot produce 6.9 inch shots, a 6.5 inch set (1284 x 2778) is accepted instead.
- Minimum 1 screenshot, maximum 10. Smaller iPhone sizes auto-scale from this set.
- JPEG or PNG, no transparency.

Take exactly 4, in this order:

1. **Speak tab**, mid-listening if possible, showing spoken dinner ideas.
2. **Week tab**, a full generated week of dinners.
3. **A recipe detail** screen, something that looks appetizing.
4. **List tab**, the grocery list with a few items checked off.

Easiest way to take them:

- Best: an iPhone 16 Pro Max or 17 Pro Max (any 6.9 inch iPhone). Take normal screenshots (side button + volume up). They come out at exactly 1320 x 2868.
- No 6.9 inch phone? Open the project in Xcode, run the app in the **iPhone 16 Pro Max simulator**, and press Cmd+S in the simulator for each screen. Simulator screenshots are the right size and Apple accepts them.
- Optional polish: screenshot around 9:41 AM with full battery and Wi-Fi for the classic clean status bar. Not required, plain honest screenshots are fine for an unlisted app.

---

## 6. Review notes (paste into App Review Information → Notes)

> MealTime is a private household meal planner intended for UNLISTED distribution (a request will be filed via the unlisted app form right after this submission). No account or login exists anywhere in the app, so no demo credentials are needed. To review: on first launch tap "Start our household" (this creates a new household instantly, nothing to enter). Go to the Speak tab, allow the microphone permission, and say a few dinner ideas out loud, for example "something with chicken, one pasta night, keep it around a hundred dollars." Speech is transcribed on device by Apple's speech framework; audio never leaves the phone. Tap to generate: the app sends the text transcript and preferences to Anthropic's Claude API to build the week, which can take up to a minute on a slow connection. The Week, Recipe, and List tabs then populate. Household sync between two phones uses the CloudKit public database keyed by a random private household code, with silent push for updates; a second device is not needed to review any functionality. The app is free with no ads, no tracking, no analytics SDKs, and no in-app purchases.

---

## 7. Unlisted distribution request

**Form:** https://developer.apple.com/contact/request/unlisted-app/

**When:** immediately after you press Submit for Review. Apple requires the app to be either already on the App Store or "ready for final distribution" and submitted to App Review; requests for apps still in beta or not yet submitted are declined (https://developer.apple.com/support/unlisted-app-distribution/). Also mention the unlisted intent in your review notes (already included in Section 6), which the same page recommends.

**Turnaround:** Apple does not publish one. Developer reports range from a few business days to a week, with occasional multi-week outliers, and Apple support cannot track progress mid-request (https://developer.apple.com/forums/thread/702893). That is why the plan uses manual release.

**What unlisted means once granted:** the app is fully on the App Store but only reachable by direct link. It never appears in search, charts, categories, or recommendations. The link is generated on approval (or your existing App Store link keeps working) and works in all App Store regions (https://developer.apple.com/support/unlisted-app-distribution/).

**Honest risk note:** Apple's examples of unlisted use cases are limited audiences like employees, partners, research studies, and event attendees (https://developer.apple.com/support/unlisted-app-distribution/). A two-person family app is a limited audience but not one of the listed examples, so there is a real chance Apple asks questions or declines. If declined, nothing is lost: you can keep the version unreleased and stay on TestFlight, or release it publicly anyway (with no marketing, a niche household app is effectively invisible in search).

**Paste-ready justification for the form:**

> MealTime is a household meal planning app built by Echo Chamber Media for the developer's own family. It lets exactly one household (the developer and his partner, on two phones) speak dinner ideas and receive a shared weekly dinner plan and grocery list. It is intentionally not designed, marketed, or supported for a general audience: there are no accounts, no ads, no purchases, and no plans for public promotion of any kind. Access is coordinated by a private household code shared in person. We are requesting unlisted distribution so the app can be installed by this specific, limited audience through a direct link only, without appearing in App Store search, charts, or recommendations. The app is complete, fully functional for reviewers without any credentials, and has been submitted to App Review.

---

## 8. What Apple might push back on

1. **5.1.2(i): sharing personal data with third-party AI.** In November 2025 Apple updated the guidelines to require that apps clearly disclose when personal data is shared with third parties "including with third-party AI" and obtain explicit permission before doing so (https://developer.apple.com/app-store/review/guidelines/ section 5.1.2(i), announced at https://developer.apple.com/news/?id=ey6d8onl). This is already handled in the app: a one-time notice sheet appears before the first plan generation (covering the transcript, budget, taste notes, and meal history going to Anthropic's Claude, with a link to the privacy policy), and planning only proceeds after the user accepts. The acceptance is remembered on the device. Together with the disclosure in the description and the privacy policy, this satisfies 5.1.2(i). If a rejection cites it anyway, point the reviewer to the notice sheet on the Speak tab (it shows on any fresh install before the first generation).

2. **2.1 completeness: the plan generation fails for the reviewer.** The reviewer starts with an empty household on a fresh device. If the bundled Anthropic API key is missing, expired, or rate limited, generation fails and the app gets rejected as broken (https://developer.apple.com/app-store/review/guidelines/ section 2.1). Fix: verify on a clean device before submitting (step 2 of the plan), make sure the Claude connection in the shipped build works (the deployed proxy from Proxy/README.md for App Store builds, and whatever key it holds has credit), and make sure a network error shows a friendly retry message rather than a dead spinner.

3. **The unlisted request itself is declined or slow.** Unlisted approval is a separate human decision with no published turnaround, and small personal apps are not among Apple's listed examples (https://developer.apple.com/support/unlisted-app-distribution/). Fix: manual release protects you either way; if declined, reply explaining the limited audience again, or simply release publicly with zero marketing, or stay on TestFlight (builds last 90 days and can be renewed with each new build).

Minor things that will not block you but are worth knowing: the mic and speech purpose strings are already in the build and clearly describe their use, which is what 5.1.1 requires, and the Speak tab should keep a clear visual indication while listening, which guideline 2.5.14 requires for any app that records (https://developer.apple.com/app-store/review/guidelines/).

---

## Note on export compliance (already done, for your records)

The app uses only standard HTTPS (Apple's built-in TLS via URLSession) to reach Anthropic and CloudKit, and no custom cryptography. The build sets ITSAppUsesNonExemptEncryption to false in Info.plist, which pre-answers the encryption questions so App Store Connect will not prompt you at submission (https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance and https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations). The annual self-classification report to the US Bureau of Industry and Security applies to apps that ship their own non-exempt cryptography; an app that only calls the encryption built into iOS is exempt and has no report to file (https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations). France's extra declaration rules target security products (secure storage, secure communications, antivirus) and do not apply to a meal planner (https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance).
