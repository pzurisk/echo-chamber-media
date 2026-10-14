import BackgroundTasks
import CloudKit
import SwiftUI
import UIKit

@main
struct EchoMealApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    /// The one AppState for the process. It lives in AppStateHost, not in
    /// this struct alone, so the background processing task (which can launch the
    /// app with no window) tops up the same shelf the UI shows instead of a
    /// second copy.
    @StateObject private var appState = AppStateHost.shared
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
                // The top-up waits for the cloud refresh so a phone that
                // just opened does not stock a shelf the other phone has
                // already filled. Detached so it never holds the UI's task.
                Task {
                    await appState.refreshFromCloud()
                    Task.detached { await ShelfFiller.topUpIfNeeded(state: appState, reason: "foreground") }
                }
                // Catches a subscription cancelled or resubscribed in the
                // App Store while the app sat in the background.
                Task { await appState.subscriptions.refreshEntitlement() }
            }
        }
    }
}

/// Holds the process-wide AppState. See EchoMealApp.appState.
@MainActor
enum AppStateHost {
    static let shared = AppState()
}

/// The shelf top-up as a background processing task. iOS decides when it runs
/// (the 12 hours is only the earliest it may start) and may skip it, so the
/// foreground trigger stays the dependable path. A processing task gets
/// minutes rather than the 30 seconds of an app refresh task, which a
/// 60 to 120 second top-up call needs.
enum ShelfBackgroundTask {
    /// Must match BGTaskSchedulerPermittedIdentifiers in Info.plist. The
    /// prefix is the app's bundle id.
    static let identifier = "com.echochambermedia.echomeal.shelf-topup"
    static let interval: TimeInterval = 12 * 3600

    /// Called once, from application(_:didFinishLaunchingWithOptions:),
    /// before launch finishes, as BGTaskScheduler requires.
    static func register() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: identifier, using: nil) { task in
            guard let processing = task as? BGProcessingTask else {
                task.setTaskCompleted(success: false)
                return
            }
            run(processing)
        }
    }

    /// Asks for the next run. Submitting again replaces the pending request.
    /// Fails harmlessly on the simulator and with background tasks off.
    static func schedule() {
        let request = BGProcessingTaskRequest(identifier: identifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: interval)
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            ShelfFiller.logger.info("Could not schedule the shelf top-up task: \(String(describing: error), privacy: .public)")
        }
    }

    private static func run(_ task: BGProcessingTask) {
        // Next run first, so one failure does not end the chain.
        schedule()
        let work = Task { @MainActor in
            await ShelfFiller.topUpIfNeeded(state: AppStateHost.shared, reason: "background")
            task.setTaskCompleted(success: !Task.isCancelled)
        }
        task.expirationHandler = {
            // Cancelling ends the in-flight request and the loop; the task
            // above then reports completion itself.
            work.cancel()
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
        ShelfBackgroundTask.register()
        ShelfBackgroundTask.schedule()
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
