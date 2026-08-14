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
                .preferredColorScheme(theme.colorScheme)
                .fullScreenCover(isPresented: $needsOnboarding) {
                    OnboardingView()
                        .environmentObject(appState)
                }
                .onAppear {
                    needsOnboarding = !appState.isOnboarded
                }
        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .active {
                appState.recoverIfStuck()
                appState.retryDirtySaves()
                Task { await appState.refreshFromCloud() }
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
