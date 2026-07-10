import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
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
        .tint(.echoRed)
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
