import SwiftUI
import UIKit

/// Tab 3. The consolidated grocery list, grouped by section, with a slim
/// budget bar up top. Checked state syncs live between both phones.
struct GroceryListView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSettings = false
    /// Store mode: show only what is still left to grab. Persisted so it
    /// survives a relaunch in the middle of a shopping trip.
    @AppStorage("storeModeOn") private var storeModeOn = false
    /// Confetti overlay for finishing the whole list. Fired by celebrate()
    /// when the last unchecked item clears, hidden again a few seconds
    /// later by the hide task.
    @State private var showConfetti = false
    @State private var confettiHideTask: Task<Void, Never>?

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
                                            .foregroundStyle(Color.echoText)
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
                        Text("Plan a week first and the list builds itself.")
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
                    .symbolEffect(.bounce, value: checked)

                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name)
                        .font(.body.weight(.medium))
                        .foregroundStyle(checked ? Color.echoTextSecondary : Color.echoText)
                        .strikethrough(checked, color: Color.echoTextSecondary)
                    HStack(spacing: 8) {
                        Text(item.qty)
                        if item.pantry {
                            Text("pantry")
                                .padding(.horizontal, 6)
                                .padding(.vertical, 1)
                                .background(Capsule().fill(Color.echoFill))
                        }
                    }
                    .font(.caption)
                    .foregroundStyle(Color.echoTextSecondary)
                    // Which dinner(s) this item is for. Tagged by the
                    // model on new plans; older plans (including the week
                    // already on the phones) fall back to local
                    // ingredient matching. General items show no line.
                    if let plan = appState.plan {
                        let tags = plan.recipeTitles(for: item)
                        if !tags.isEmpty {
                            Text(tags.joined(separator: " · "))
                                .font(.caption2)
                                .foregroundStyle(Color.echoAccentText.opacity(0.9))
                                .lineLimit(2)
                        }
                    }
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
        // Checking off feels like something: a solid thump on check, a
        // lighter tick on uncheck.
        .sensoryFeedback(trigger: checked) { _, isNowChecked in
            isNowChecked ? .impact(weight: .medium) : .impact(weight: .light)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(item.name), \(item.qty)")
        .accessibilityValue(checked ? "checked" : "not checked")
        .accessibilityAddTraits(.isButton)
    }
}

// MARK: - Confetti

/// One celebratory burst from the top of the screen, used when the last
/// grocery item is checked off. CAEmitterLayer does the physics; the
/// emitter stops after a beat so it reads as a burst, not endless rain,
/// and the pieces already in the air fall out on their own.
private struct ConfettiBurst: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.isUserInteractionEnabled = false
        let emitter = CAEmitterLayer()
        emitter.emitterShape = .line
        let width = UIScreen.main.bounds.width
        emitter.emitterPosition = CGPoint(x: width / 2, y: -10)
        emitter.emitterSize = CGSize(width: width, height: 1)
        // CAEmitterCell takes a CGColor, which cannot follow a palette
        // change on its own, so these get resolved once here. Resolve
        // against the environment's scheme rather than view.traitCollection:
        // at makeUIView time the view is not in the window yet, so its own
        // traits can report the wrong style.
        let traits = UITraitCollection(
            userInterfaceStyle: context.environment.colorScheme == .dark ? .dark : .light
        )
        let colors: [UIColor] = [
            UIColor(Color.echoAccent), UIColor(Color.echoGreen),
            UIColor(Color.echoWarning), UIColor(Color.echoInfo)
        ].map { $0.resolvedColor(with: traits) }
        emitter.emitterCells = colors.map { color in
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
            cell.color = color.cgColor
            cell.contents = Self.particle.cgImage
            return cell
        }
        view.layer.addSublayer(emitter)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            emitter.birthRate = 0
        }
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {}

    /// Small white rounded rectangle each cell tints its own color.
    private static let particle: UIImage = {
        let size = CGSize(width: 12, height: 8)
        return UIGraphicsImageRenderer(size: size).image { _ in
            UIColor.white.setFill()
            UIBezierPath(
                roundedRect: CGRect(origin: .zero, size: size),
                cornerRadius: 2
            ).fill()
        }
    }()
}
