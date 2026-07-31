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
        .tint(.echoRed)
        // Generation errors surface here, above whichever tab is open, so a
        // failure is never missed just because the Speak tab is not showing.
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
                .tint(.echoRed)
            Text("Planning your week...")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.white)
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
        .foregroundStyle(.orange)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .echoCardStyle()
        .padding(.horizontal)
    }
}
