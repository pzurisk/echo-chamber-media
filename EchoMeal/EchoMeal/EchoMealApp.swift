import CloudKit
import SwiftUI
import UIKit

@main
struct EchoMealApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var appState = AppState()
    @Environment(\.scenePhase) private var scenePhase
    /// Drives the first-launch onboarding cover. Set once at launch from
    /// AppState.isOnboarded; OnboardingView dismisses the cover itself when
    /// setup is done (after showing the new code, or after a join).
    @State private var needsOnboarding = false

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .preferredColorScheme(.dark)
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
