import CloudKit
import SwiftUI
import UIKit

@main
struct EchoMealApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var appState = AppState()
    @Environment(\.scenePhase) private var scenePhase
    /// The household's palette choice from Settings. Defaults to Hearth, so
    /// an install that predates this setting looks exactly as it did before.
    /// This is the only place the app sets a color scheme; every other view
    /// inherits it, including sheets and full screen covers.
    @AppStorage(HouseholdConfig.Keys.themeChoice) private var theme: AppTheme = .hearth
    /// Drives the first-launch onboarding cover. Set once at launch from
    /// AppState.isOnboarded; OnboardingView dismisses the cover itself when
    /// setup is done (after showing the new code, or after a join).
    @State private var needsOnboarding = false

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(appState.subscriptions)
                .preferredColorScheme(theme.colorScheme)
                .fullScreenCover(isPresented: $needsOnboarding) {
                    OnboardingView()
                        .environmentObject(appState)
                }
                .onAppear {
                    needsOnboarding = !appState.isOnboarded
                }
                .onOpenURL { url in
                    // A mealtime://join link, from the QR code the other
                    // phone shows. AppState validates it, so a malformed or
                    // foreign URL changes nothing. With no household yet it
                    // joins right away (and onboarding, if it is up, has
                    // nothing left to ask); with one it parks the code for
                    // RootView's confirmation alert, so a tapped link or a
                    // hostile QR can never wipe this phone silently.
                    if appState.requestJoin(url: url) {
                        needsOnboarding = false
                    }
                }
                .onChange(of: appState.isOnboarded) { _, onboarded in
                    // Delete All My Data, run on this phone or discovered
                    // from the partner's, drops the household mid-session.
                    // The cover used to be decided once at launch, which
                    // stranded the user on a householdless app where every
                    // save was a silent no-op until the next relaunch.
                    // Only the false edge presents the cover: onboarding
                    // dismisses itself when it is done, and dismissing it
                    // here the moment a code exists would skip the screen
                    // that shows the new code big.
                    if !onboarded {
                        needsOnboarding = true
                    }
                }
                .task {
                    // Reads the entitlement and loads the price before
                    // anyone taps the mic, so a subscriber never sees the
                    // paywall flicker past on the way to their week.
                    await appState.subscriptions.refresh()
                }
        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .active {
                appState.recoverIfStuck()
                appState.retryDirtySaves()
                Task { await appState.refreshFromCloud() }
                // Catches a subscription cancelled or resubscribed in the
                // App Store while the app sat in the background.
                Task { await appState.subscriptions.refreshEntitlement() }
            }
        }
    }
}

/// Registers for silent remote notifications and forwards CloudKit pushes
/// to AppState so the UI refreshes when the other phone changes something.
final class AppDelegate: NSObject, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        application.registerForRemoteNotifications()
        return true
    }

    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        if CKNotification(fromRemoteNotificationDictionary: userInfo) != nil {
            NotificationCenter.default.post(name: .cloudDataChanged, object: nil)
            completionHandler(.newData)
        } else {
            completionHandler(.noData)
        }
    }
}
