import SwiftUI
import UIKit

/// One row on the grocery list: either a recipe-driven item or a freeform
/// one with no recipe behind it. Lets one section render both kinds through
/// a single checked/toggle/label surface.
private enum GroceryDisplayItem {
    case recipe(sectionName: String, item: GroceryItem)
    case freeform(FreeformGroceryItem)
}

/// A merged section: the recipe items Claude generated for this category
/// plus any freeform items the household added under it, in that order.
private struct GroceryDisplaySection {
    let name: String
    let items: [GroceryDisplayItem]
}

/// Tab 3. The consolidated grocery list, grouped by section, with a slim
/// budget bar up top. Checked state syncs live between both phones.
struct GroceryListView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSettings = false
    @State private var showAddItem = false
    /// Store mode: show only what is still left to grab. Persisted so it
    /// survives a relaunch in the middle of a shopping trip.
    @AppStorage("storeModeOn") private var storeModeOn = false
    /// Confetti overlay for finishing the whole list. Fired by celebrate()
    /// when the last unchecked item clears, hidden again a few seconds
    /// later by the hide task.
    @State private var showConfetti = false
    @State private var confettiHideTask: Task<Void, Never>?

    /// Recipe sections (in their fixed store-walk order) merged with
    /// freeform items grouped into the same categories. A freeform item in
    /// a category with no recipe items of its own (usually "Other") gets
    /// its own section. Empty sections are dropped.
    private var displaySections: [GroceryDisplaySection] {
        var order = MealPlan.freeformCategories
        let planSections = appState.plan?.orderedSections ?? []
        for section in planSections where !order.contains(section.name) {
            order.append(section.name)
        }

        var itemsByName: [String: [GroceryDisplayItem]] = [:]
        for section in planSections {
            itemsByName[section.name, default: []].append(
                contentsOf: section.items.map { .recipe(sectionName: section.name, item: $0) }
            )
        }
        for item in appState.freeformItems {
            itemsByName[item.category, default: []].append(.freeform(item))
        }

        return order.compactMap { name in
            guard let items = itemsByName[name], !items.isEmpty else { return nil }
            return GroceryDisplaySection(name: name, items: items)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.echoBackground.ignoresSafeArea()

                let sections = displaySections
                if !sections.isEmpty {
                    let totalItems = sections.reduce(0) { $0 + $1.items.count }
                    let remainingItems = sections.reduce(0) { $0 + remainingCount(in: $1) }

                    VStack(spacing: 0) {
                        if let plan = appState.plan {
                            BudgetBar(grocery: plan.grocery)
                                .padding(.horizontal)
                                .padding(.top, 4)
                                .padding(.bottom, 10)
                        }

                        ScrollView {
                            VStack(alignment: .leading, spacing: 18) {
                                if storeModeOn && remainingItems == 0 {
                                    listDoneState
                                } else {
                                    if storeModeOn {
                                        Text("\(remainingItems) of \(totalItems) items left")
                                            .font(.title2.weight(.bold))
                                            .foregroundStyle(Color.echoText)
                                            .padding(.horizontal, 4)
                                    }

                                    ForEach(sections, id: \.name) { section in
                                        if !storeModeOn || remainingCount(in: section) > 0 {
                                            GrocerySectionView(section: section, hideChecked: storeModeOn)
                                        }
                                    }

                                    if let plan = appState.plan, !plan.grocery.notes.isEmpty {
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
                    .onChange(of: remainingItems) { oldValue, newValue in
                        // Fires only on a live change, so opening the tab
                        // on an already-finished list stays quiet.
                        if newValue == 0, oldValue > 0, totalItems > 0 {
                            celebrate()
                        }
                    }
                } else {
                    VStack(spacing: 12) {
                        Image(systemName: "cart")
                            .font(.system(size: 44))
                            .foregroundStyle(Color.echoTextSecondary)
                        Text("No list yet")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(Color.echoText)
                        Text("Plan a week, or add an item, and the list builds itself.")
                            .font(.subheadline)
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                }

                if showConfetti {
                    ConfettiBurst()
                        .ignoresSafeArea()
                        .allowsHitTesting(false)
                        .transition(.opacity)
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
                                    .foregroundStyle(storeModeOn ? Color.echoAccentText : Color.echoTextSecondary)
                            }
                            .accessibilityLabel(storeModeOn ? "Show all items" : "Show remaining items only")
                        }
                        Button {
                            showAddItem = true
                        } label: {
                            Image(systemName: "plus")
                                .foregroundStyle(Color.echoTextSecondary)
                        }
                        .accessibilityLabel("Add item")
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
            .sheet(isPresented: $showAddItem) {
                AddFreeformItemSheet()
            }
        }
    }

    private func isChecked(_ item: GroceryDisplayItem) -> Bool {
        switch item {
        case .recipe(let sectionName, let groceryItem):
            return appState.isChecked(section: sectionName, item: groceryItem.name)
        case .freeform(let freeformItem):
            return appState.isFreeformChecked(freeformItem)
        }
    }

    /// Items in a section not yet checked off. Pantry staples start
    /// checked, so they count as already handled, same as the rows show.
    private func remainingCount(in section: GroceryDisplaySection) -> Int {
        section.items.filter { !isChecked($0) }.count
    }

    /// Full-list celebration: a success thump and a confetti burst over
    /// the list. Runs in either mode (store mode has its own done screen
    /// underneath). The hide task is replaced on a re-fire so a quick
    /// uncheck and re-check restarts the clock cleanly.
    private func celebrate() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        withAnimation(.easeIn(duration: 0.2)) { showConfetti = true }
        confettiHideTask?.cancel()
        confettiHideTask = Task {
            try? await Task.sleep(nanoseconds: 3_500_000_000)
            guard !Task.isCancelled else { return }
            withAnimation(.easeOut(duration: 0.6)) { showConfetti = false }
        }
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
                .foregroundStyle(Color.echoText)
            Text("Tap the cart up top to see the full list again.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
    }
}

// MARK: - Add freeform item

/// The "add item" entry point: a name and a category, for anything with no
/// recipe behind it. Separate from the recipe-driven flow on purpose.
private struct AddFreeformItemSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var category = "Other"

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Item, like paper towels", text: $name)
                        .onSubmit(add)
                    Picker("Category", selection: $category) {
                        ForEach(MealPlan.freeformCategories, id: \.self) { name in
                            Text(name).tag(name)
                        }
                    }
                }
            }
            .navigationTitle("Add Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add", action: add)
                        .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
    }

    private func add() {
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        appState.addFreeformItem(name: name, category: category)
        dismiss()
    }
}

// MARK: - Sections and rows

private struct GrocerySectionView: View {
    @EnvironmentObject private var appState: AppState
    let section: GroceryDisplaySection
    /// Store mode: checked items drop out of the section entirely.
    var hideChecked: Bool = false

    private var visibleItems: [GroceryDisplayItem] {
        guard hideChecked else { return section.items }
        return section.items.filter { !isChecked($0) }
    }

    private func isChecked(_ item: GroceryDisplayItem) -> Bool {
        switch item {
        case .recipe(let sectionName, let groceryItem):
            return appState.isChecked(section: sectionName, item: groceryItem.name)
        case .freeform(let freeformItem):
            return appState.isFreeformChecked(freeformItem)
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
                // Keyed by position, not identity, so two same-named items
                // in one section (possible in model output) cannot collide.
                ForEach(Array(visibleItems.enumerated()), id: \.offset) { index, item in
                    GroceryRow(displayItem: item)
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
private struct GroceryRow: View {
    @EnvironmentObject private var appState: AppState
    let displayItem: GroceryDisplayItem

    private var checked: Bool {
        switch displayItem {
        case .recipe(let sectionName, let item):
            return appState.isChecked(section: sectionName, item: item.name)
        case .freeform(let item):
            return appState.isFreeformChecked(item)
        }
    }

    private var name: String {
        switch displayItem {
        case .recipe(_, let item): return item.name
        case .freeform(let item): return item.name
        }
    }

    /// Quantity line, recipe items only. Freeform items have none.
    private var qty: String? {
        switch displayItem {
        case .recipe(_, let item): return item.qty
        case .freeform: return nil
        }
    }

    private var isPantryTagged: Bool {
        if case .recipe(_, let item) = displayItem { return item.pantry }
        return false
    }

    private var estPrice: Double {
        if case .recipe(_, let item) = displayItem { return item.estPrice }
        return 0
    }

    /// Why this item is on the list: the recipe(s) that use it, or a plain
    /// "added by you" for a freeform item, so the list explains itself
    /// while you're standing in the aisle.
    private var sourceTag: String? {
        switch displayItem {
        case .recipe(_, let item):
            guard let plan = appState.plan else { return nil }
            let tags = plan.recipeTitles(for: item)
            return tags.isEmpty ? nil : tags.joined(separator: " · ")
        case .freeform:
            return "Added by you"
        }
    }

    private func toggle() {
        switch displayItem {
        case .recipe(let sectionName, let item):
            appState.toggle(section: sectionName, item: item.name)
        case .freeform(let item):
            appState.toggleFreeform(item)
        }
    }

    var body: some View {
        Button(action: toggle) {
            HStack(spacing: 14) {
                Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(checked ? Color.echoGreen : Color.echoTextSecondary)
                    .symbolEffect(.bounce, value: checked)

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(name)
                            .font(.body.weight(.medium))
                            .foregroundStyle(checked ? Color.echoTextSecondary : Color.echoText)
                            .strikethrough(checked, color: Color.echoTextSecondary)
                        if case .freeform = displayItem {
                            // Light visual marker so a freeform item reads
                            // as different from a recipe-driven one without
                            // breaking the shopping flow into two lists.
                            Image(systemName: "square.and.pencil")
                                .font(.caption2)
                                .foregroundStyle(Color.echoTextSecondary)
                        }
                    }
                    if let qty {
                        HStack(spacing: 8) {
                            Text(qty)
                            if isPantryTagged {
                                Text("already have this")
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 1)
                                    .background(Capsule().fill(Color.echoFill))
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(Color.echoTextSecondary)
                    }
                    if let sourceTag {
                        Text(sourceTag)
                            .font(.caption2)
                            .foregroundStyle(Color.echoAccentText.opacity(0.9))
                            .lineLimit(2)
                    }
                }

                Spacer()

                // Items added by the recipe reconciliation, and every
                // freeform item, carry estPrice 0 on purpose; a "$0.00"
                // label would just read as broken.
                if estPrice > 0 {
                    Text(String(format: "$%.2f", estPrice))
                        .font(.footnote)
                        .foregroundStyle(Color.echoTextSecondary)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        // Checking off feels like something: a solid thump on check, a
        // lighter tick on uncheck.
        .sensoryFeedback(trigger: checked) { _, isNowChecked in
            isNowChecked ? .impact(weight: .medium) : .impact(weight: .light)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(qty != nil ? "\(name), \(qty!)" : name)
        .accessibilityValue(checked ? "checked" : "not checked")
        .accessibilityAddTraits(.isButton)
        .contextMenu {
            if case .freeform(let item) = displayItem {
                Button("Remove", role: .destructive) {
                    appState.removeFreeformItem(item)
                }
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
                    .foregroundStyle(Color.echoText)
                Spacer()
                // Over budget is honey, not terracotta. Terracotta is the
                // app's accent everywhere else, so an over-budget bar in it
                // would read as decoration instead of a warning.
                Text(deltaText)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(isOver ? Color.echoWarning : Color.echoGreen)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.echoFill)
                    Capsule()
                        .fill(isOver ? Color.echoWarning : Color.echoGreen)
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

// MARK: - Confetti

/// One celebratory burst from the top of the screen, used when the last
/// grocery item is checked off. CAEmitterLayer does the physics; the
/// emitter stops after a beat so it reads as a burst, not endless rain,
/// and the pieces already in the air fall out on their own. Falling
/// jack-o'-lanterns instead of confetti squares, drawn from the emoji so
/// each particle already carries its own color and no per-cell tint
/// is needed.
private struct ConfettiBurst: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.isUserInteractionEnabled = false
        let emitter = CAEmitterLayer()
        emitter.emitterShape = .line
        let width = UIScreen.main.bounds.width
        emitter.emitterPosition = CGPoint(x: width / 2, y: -10)
        emitter.emitterSize = CGSize(width: width, height: 1)
        let cell = CAEmitterCell()
        cell.birthRate = 9
        cell.lifetime = 6
        cell.velocity = 190
        cell.velocityRange = 90
        cell.emissionLongitude = .pi
        cell.emissionRange = .pi / 5
        cell.spin = 3.5
        cell.spinRange = 4
        cell.scale = 0.6
        cell.scaleRange = 0.3
        cell.contents = Self.particle.cgImage
        emitter.emitterCells = [cell]
        view.layer.addSublayer(emitter)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            emitter.birthRate = 0
        }
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {}

    /// A small jack-o'-lantern, drawn from the emoji so it comes with its
    /// own color baked in and needs no per-cell tint.
    private static let particle: UIImage = {
        let size = CGSize(width: 28, height: 28)
        let font = UIFont.systemFont(ofSize: 24)
        return UIGraphicsImageRenderer(size: size).image { _ in
            let string = "🎃" as NSString
            let attributes: [NSAttributedString.Key: Any] = [.font: font]
            let stringSize = string.size(withAttributes: attributes)
            let origin = CGPoint(
                x: (size.width - stringSize.width) / 2,
                y: (size.height - stringSize.height) / 2
            )
            string.draw(at: origin, withAttributes: attributes)
        }
    }()
}
