import SwiftUI

/// Tab 3. The consolidated grocery list, grouped by section, with a slim
/// budget bar up top. Checked state syncs live between both phones.
struct GroceryListView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSettings = false
    /// Store mode: show only what is still left to grab. Persisted so it
    /// survives a relaunch in the middle of a shopping trip.
    @AppStorage("storeModeOn") private var storeModeOn = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.echoBackground.ignoresSafeArea()

                if let plan = appState.plan {
                    let totalItems = plan.grocery.sections.reduce(0) { $0 + $1.items.count }
                    let remainingItems = plan.orderedSections.reduce(0) { $0 + remainingCount(in: $1) }

                    VStack(spacing: 0) {
                        BudgetBar(grocery: plan.grocery)
                            .padding(.horizontal)
                            .padding(.top, 4)
                            .padding(.bottom, 10)

                        ScrollView {
                            VStack(alignment: .leading, spacing: 18) {
                                if storeModeOn && remainingItems == 0 {
                                    listDoneState
                                } else {
                                    if storeModeOn {
                                        Text("\(remainingItems) of \(totalItems) items left")
                                            .font(.title2.weight(.bold))
                                            .foregroundStyle(.white)
                                            .padding(.horizontal, 4)
                                    }

                                    ForEach(plan.orderedSections, id: \.name) { section in
                                        if !storeModeOn || remainingCount(in: section) > 0 {
                                            GrocerySectionView(section: section, hideChecked: storeModeOn)
                                        }
                                    }

                                    if !plan.grocery.notes.isEmpty {
                                        Text(plan.grocery.notes)
                                            .font(.footnote)
                                            .foregroundStyle(Color.echoTextSecondary)
                                            .padding(.horizontal, 4)
                                    }
                                }
                            }
                            .padding(.horizontal)
                            .padding(.bottom, 24)
                        }
                    }
                } else {
                    VStack(spacing: 12) {
                        Image(systemName: "cart")
                            .font(.system(size: 44))
                            .foregroundStyle(Color.echoTextSecondary)
                        Text("No list yet")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)
                        Text("Plan a week first and the list builds itself.")
                            .font(.subheadline)
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                }
            }
            .navigationTitle("Grocery List")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 16) {
                        if appState.plan != nil {
                            Button {
                                storeModeOn.toggle()
                            } label: {
                                Image(systemName: storeModeOn ? "cart.fill" : "cart")
                                    .foregroundStyle(storeModeOn ? Color.echoRed : Color.echoTextSecondary)
                            }
                            .accessibilityLabel(storeModeOn ? "Show all items" : "Show remaining items only")
                        }
                        Button {
                            showSettings = true
                        } label: {
                            Image(systemName: "gearshape")
                                .foregroundStyle(Color.echoTextSecondary)
                        }
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
    }

    /// Items in a section not yet checked off. Pantry staples start
    /// checked, so they count as already handled, same as the rows show.
    private func remainingCount(in section: GrocerySection) -> Int {
        section.items.filter { !appState.isChecked(section: section.name, item: $0.name) }.count
    }

    /// Friendly full-cart state shown in store mode instead of an empty
    /// screen once every item is checked.
    private var listDoneState: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 44))
                .foregroundStyle(Color.echoGreen)
            Text("List done. Go home and cook.")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
            Text("Tap the cart up top to see the full list again.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
    }
}

// MARK: - Budget bar

/// Estimated total against the target, and how far under or over.
struct BudgetBar: View {
    let grocery: Grocery

    private var fraction: Double {
        guard grocery.budgetTarget > 0 else { return 0 }
        return min(grocery.estimatedTotal / grocery.budgetTarget, 1.0)
    }

    private var isOver: Bool { grocery.estimatedTotal > grocery.budgetTarget }

    private var deltaText: String {
        let delta = abs(grocery.budgetTarget - grocery.estimatedTotal)
        let amount = String(format: "$%.0f", delta)
        return isOver ? "\(amount) over" : "\(amount) under"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(String(format: "Estimated $%.0f of $%.0f", grocery.estimatedTotal, grocery.budgetTarget))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                Spacer()
                Text(deltaText)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(isOver ? Color.echoRed : Color.echoGreen)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.10))
                    Capsule()
                        .fill(isOver ? Color.echoRed : Color.echoGreen)
                        .frame(width: max(geo.size.width * fraction, 6))
                }
            }
            .frame(height: 8)

            if grocery.pantryCredit > 0 {
                Text(String(format: "Pantry items you already own save about $%.0f.", grocery.pantryCredit))
                    .font(.caption)
                    .foregroundStyle(Color.echoTextSecondary)
            }
        }
        .padding(14)
        .echoCardStyle()
    }
}

// MARK: - Sections and rows

struct GrocerySectionView: View {
    @EnvironmentObject private var appState: AppState
    let section: GrocerySection
    /// Store mode: checked items drop out of the section entirely.
    var hideChecked: Bool = false

    private var visibleItems: [GroceryItem] {
        guard hideChecked else { return section.items }
        return section.items.filter {
            !appState.isChecked(section: section.name, item: $0.name)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(section.name.uppercased())
                .font(.caption.weight(.bold))
                .tracking(1.2)
                .foregroundStyle(Color.echoTextSecondary)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                // Keyed by position, not name, so two same-named items in
                // one section (possible in model output) cannot collide.
                ForEach(Array(visibleItems.enumerated()), id: \.offset) { index, item in
                    GroceryRow(sectionName: section.name, item: item)
                    if index < visibleItems.count - 1 {
                        Divider().overlay(Color.echoCardBorder)
                    }
                }
            }
            .echoCardStyle()
        }
    }
}

/// One checkbox row. Big touch target, clear checked state, fast to tap
/// through in a store.
struct GroceryRow: View {
    @EnvironmentObject private var appState: AppState
    let sectionName: String
    let item: GroceryItem

    private var checked: Bool {
        appState.isChecked(section: sectionName, item: item.name)
    }

    var body: some View {
        Button {
            appState.toggle(section: sectionName, item: item.name)
        } label: {
            HStack(spacing: 14) {
                Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(checked ? Color.echoGreen : Color.echoTextSecondary)

                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name)
                        .font(.body.weight(.medium))
                        .foregroundStyle(checked ? Color.echoTextSecondary : .white)
                        .strikethrough(checked, color: Color.echoTextSecondary)
                    HStack(spacing: 8) {
                        Text(item.qty)
                        if item.pantry {
                            Text("pantry")
                                .padding(.horizontal, 6)
                                .padding(.vertical, 1)
                                .background(Capsule().fill(Color.white.opacity(0.08)))
                        }
                    }
                    .font(.caption)
                    .foregroundStyle(Color.echoTextSecondary)
                }

                Spacer()

                // Items added by the recipe reconciliation carry estPrice 0
                // on purpose; a "$0.00" label would just read as broken.
                if item.estPrice > 0 {
                    Text(String(format: "$%.2f", item.estPrice))
                        .font(.footnote)
                        .foregroundStyle(Color.echoTextSecondary)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(item.name), \(item.qty)")
        .accessibilityValue(checked ? "checked" : "not checked")
        .accessibilityAddTraits(.isButton)
    }
}
