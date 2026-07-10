import SwiftUI

/// Tab 3. The consolidated grocery list, grouped by section, with a slim
/// budget bar up top. Checked state syncs live between both phones.
struct GroceryListView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.echoBackground.ignoresSafeArea()

                if let plan = appState.plan {
                    VStack(spacing: 0) {
                        BudgetBar(grocery: plan.grocery)
                            .padding(.horizontal)
                            .padding(.top, 4)
                            .padding(.bottom, 10)

                        ScrollView {
                            VStack(alignment: .leading, spacing: 18) {
                                ForEach(plan.orderedSections, id: \.name) { section in
                                    GrocerySectionView(section: section)
                                }

                                if !plan.grocery.notes.isEmpty {
                                    Text(plan.grocery.notes)
                                        .font(.footnote)
                                        .foregroundStyle(Color.echoTextSecondary)
                                        .padding(.horizontal, 4)
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
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
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

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(section.name.uppercased())
                .font(.caption.weight(.bold))
                .tracking(1.2)
                .foregroundStyle(Color.echoTextSecondary)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(Array(section.items.enumerated()), id: \.element.name) { index, item in
                    GroceryRow(sectionName: section.name, item: item)
                    if index < section.items.count - 1 {
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

                Text(String(format: "$%.2f", item.estPrice))
                    .font(.footnote)
                    .foregroundStyle(Color.echoTextSecondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(item.name), \(item.qty)\(checked ? ", checked" : "")")
    }
}
