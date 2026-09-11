import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(spacing: 0) {
            // Slim banner on every tab while a plan builds, so someone
            // waiting on the Week or List tab still sees progress.
            if appState.phase == .planning {
                PlanningBanner()
                    .transition(.move(edge: .top).combined(with: .opacity))
            }

            TabView(selection: $appState.selectedTab) {
                SpeakView()
                    .tabItem { Label("Speak", systemImage: "mic.fill") }
                    .tag(AppState.Tab.speak)

                WeekView()
                    .tabItem { Label("Week", systemImage: "calendar") }
                    .tag(AppState.Tab.week)

                GroceryListView()
                    .tabItem { Label("List", systemImage: "checklist") }
                    .tag(AppState.Tab.list)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: appState.phase == .planning)
        // Selected tab icons and labels sit on the bar, not on a fill, so
        // they take the readable-on-background terracotta.
        .tint(.echoAccentText)
        // Generation errors surface here, above whichever tab is open, so a
        // failure is never missed just because the Speak tab is not showing.
        // The paywall lives here rather than on the Speak tab because a plan
        // can be asked for from the Week tab too (Swap One Night). AppState
        // raises the flag from the one place all planning goes through, so
        // whichever tab is open, the ask lands.
        .sheet(isPresented: $appState.showPaywall, onDismiss: {
            appState.discardPendingGeneration()
        }) {
            PaywallView {
                appState.resumePendingGeneration()
            }
            .environmentObject(appState.subscriptions)
        }
        // A tapped or scanned mealtime://join link parks its code in
        // pendingJoinCode; nothing switches until this alert's yes. The
        // person taps a link in Messages or scans a QR with the Camera app,
        // so this is the one path into a household wipe that needs no
        // typing, and it used to run silently.
        .alert(
            "Switch households?",
            isPresented: Binding(
                get: { appState.pendingJoinCode != nil },
                set: { if !$0 { appState.cancelPendingJoin() } }
            )
        ) {
            Button("Switch and wipe this phone", role: .destructive) {
                appState.confirmPendingJoin()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This link joins a different household. Your current week, Recipe Box, favorites, pantry, and history leave this phone. They stay in iCloud under your current code, and only that code can bring them back.")
        }
        .alert(
            "Something went wrong",
            isPresented: Binding(
                get: { if case .error = appState.phase { return true } else { return false } },
                set: { if !$0 { appState.clearError() } }
            )
        ) {
            Button("OK") { appState.clearError() }
        } message: {
            if case .error(let message) = appState.phase {
                Text(message)
            }
        }
    }
}

/// One-line progress strip pinned above the tabs while Claude plans.
private struct PlanningBanner: View {
    var body: some View {
        HStack(spacing: 10) {
            ProgressView()
                .controlSize(.small)
                .tint(.echoAccentText)
            Text("Planning your week...")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Color.echoText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color.echoCard.ignoresSafeArea(edges: .top))
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color.echoCardBorder)
                .frame(height: 1)
        }
    }
}

/// Small banner shown when the device is not signed into iCloud.
struct ICloudBanner: View {
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "icloud.slash")
            Text("Sign into iCloud in Settings so your plan syncs to the other phone.")
                .font(.footnote)
        }
        .foregroundStyle(Color.echoWarning)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .echoCardStyle()
        .padding(.horizontal)
    }
}
