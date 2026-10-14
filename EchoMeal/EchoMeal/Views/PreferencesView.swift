import SwiftUI

/// Taste preferences, reached from Settings. Cuisines the household leans
/// toward, proteins and ingredients to keep off the table, a one-week
/// override that clears itself on Monday, and how long before a dinner
/// may repeat.
///
/// There is no draft state here. Every control reads straight from
/// `appState.preferences` and writes the whole struct back through
/// `updatePreferences`, so this screen and the other phone cannot disagree
/// about what the preferences are. The only local state is the text being
/// typed into an ingredient field.
struct PreferencesView: View {
    @EnvironmentObject private var appState: AppState

    private var prefs: Preferences { appState.preferences }

    /// Proteins the household can switch off. "none" is the meatless slot
    /// in the vocabulary, not something to forbid.
    private var proteins: [String] {
        ShelfVocab.proteins.filter { $0 != "none" }
    }

    var body: some View {
        Form {
            cuisinesSection
            proteinsSection
            ingredientsSection
            weekOnlySection
            cooldownSection
        }
        .navigationTitle("Taste preferences")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Writing back

    /// Applies one change to a copy of the current preferences and hands the
    /// whole struct to AppState. Reads always come from AppState, never from
    /// a local copy.
    private func change(_ edit: (inout Preferences) -> Void) {
        var next = appState.preferences
        edit(&next)
        appState.updatePreferences(next)
    }

    // MARK: - Cuisines

    private var cuisinesSection: some View {
        Section {
            ForEach(ShelfVocab.cuisines, id: \.self) { cuisine in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(cuisine)
                        Spacer()
                        Text(Self.word(forWeight: prefs.weight(forCuisine: cuisine)))
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                    Slider(
                        value: Binding(
                            get: { Self.rounded(appState.preferences.weight(forCuisine: cuisine)) },
                            set: { value in
                                change { $0.cuisineWeights[cuisine] = Self.rounded(value) }
                            }
                        ),
                        in: 0...1,
                        step: 0.1
                    ) {
                        Text("\(cuisine) preference")
                    } minimumValueLabel: {
                        Text("Rarely")
                            .font(.caption2)
                            .foregroundStyle(Color.echoTextTertiary)
                    } maximumValueLabel: {
                        Text("Often")
                            .font(.caption2)
                            .foregroundStyle(Color.echoTextTertiary)
                    }
                    .tint(.echoAccent)
                    .accessibilityValue(Self.word(forWeight: prefs.weight(forCuisine: cuisine)))
                }
                .padding(.vertical, 2)
            }
        } header: {
            Text("Cuisines")
        } footer: {
            Text("How often each kind of dinner should come up. The shelf is stocked and picked by these.")
        }
    }

    /// Weights move in steps of 0.1, so snap to that grid to keep float
    /// drift out of the stored value.
    private static func rounded(_ value: Double) -> Double {
        (min(1, max(0, value)) * 10).rounded() / 10
    }

    /// The current value as a word, never a number.
    static func word(forWeight weight: Double) -> String {
        switch weight {
        case ..<0.15: return "Rarely"
        case ..<0.35: return "Now and then"
        case ..<0.65: return "Sometimes"
        case ..<0.85: return "Fairly often"
        default: return "Often"
        }
    }

    // MARK: - Proteins

    private var proteinsSection: some View {
        Section {
            ForEach(proteins, id: \.self) { protein in
                Toggle(protein.capitalized, isOn: Binding(
                    get: { !appState.preferences.proteinsOff.contains { $0.caseInsensitiveCompare(protein) == .orderedSame } },
                    set: { allowed in
                        change { prefs in
                            prefs.proteinsOff.removeAll { $0.caseInsensitiveCompare(protein) == .orderedSame }
                            if !allowed { prefs.proteinsOff.append(protein) }
                        }
                    }
                ))
                .tint(.echoAccent)
            }
        } header: {
            Text("Proteins")
        } footer: {
            Text("On means it can come up. Off keeps it out of every week.")
        }
    }

    // MARK: - Ingredients to avoid

    private var ingredientsSection: some View {
        Section {
            IngredientAvoidEditor(
                items: prefs.ingredientsOff,
                fieldLabel: "Add an ingredient",
                onChange: { list in change { $0.ingredientsOff = list } }
            )
        } header: {
            Text("Ingredients to avoid")
        } footer: {
            Text("Swipe a name to remove it. Dinners that use these stay off the shelf picks.")
        }
    }

    // MARK: - This week only

    /// A live override, or nil once it has expired. Expired overrides are
    /// treated as off even if the struct still carries one.
    private var activeOverride: WeekOverride? {
        appState.preferences.activeOverride(at: Date())
    }

    /// Next Monday at 00:00 in the phone's own time zone.
    private static func nextMonday() -> Date {
        Calendar.current.nextDate(
            after: Date(),
            matching: DateComponents(hour: 0, minute: 0, second: 0, weekday: 2),
            matchingPolicy: .nextTime
        ) ?? Date().addingTimeInterval(7 * 24 * 3600)
    }

    private var weekOnlySection: some View {
        Section {
            Toggle("Adjust for this week", isOn: Binding(
                get: { activeOverride != nil },
                set: { on in
                    change { prefs in
                        prefs.weekOverride = on
                            ? WeekOverride(until: Self.nextMonday(), proteinsOff: [], ingredientsOff: [])
                            : nil
                    }
                }
            ))
            .tint(.echoAccent)

            if let override = activeOverride {
                ForEach(proteins, id: \.self) { protein in
                    let offForGood = prefs.proteinsOff.contains { $0.caseInsensitiveCompare(protein) == .orderedSame }
                    let offThisWeek = override.proteinsOff.contains { $0.caseInsensitiveCompare(protein) == .orderedSame }
                    Toggle(protein.capitalized, isOn: Binding(
                        get: { !(offForGood || offThisWeek) },
                        set: { allowed in
                            change { prefs in
                                guard var current = prefs.weekOverride else { return }
                                current.proteinsOff.removeAll { $0.caseInsensitiveCompare(protein) == .orderedSame }
                                if !allowed { current.proteinsOff.append(protein) }
                                prefs.weekOverride = current
                            }
                        }
                    ))
                    .tint(.echoAccent)
                    .disabled(offForGood)
                }

                IngredientAvoidEditor(
                    items: override.ingredientsOff,
                    fieldLabel: "Skip an ingredient this week",
                    onChange: { list in
                        change { prefs in
                            guard var current = prefs.weekOverride else { return }
                            current.ingredientsOff = list
                            prefs.weekOverride = current
                        }
                    }
                )

                Label("Clears Monday", systemImage: "arrow.counterclockwise")
                    .font(.caption)
                    .foregroundStyle(Color.echoTextSecondary)
            }
        } header: {
            Text("This week only")
        } footer: {
            Text("Skip something just for now, like a protein you are tired of. It goes away on its own.")
        }
    }

    // MARK: - Cooldown

    private var cooldownSection: some View {
        Section {
            Stepper(
                value: Binding(
                    get: { appState.preferences.cooldownDays },
                    set: { days in change { $0.cooldownDays = days } }
                ),
                in: 7...28
            ) {
                Text("Repeat a dinner after \(prefs.cooldownDays) days")
            }
            Stepper(
                value: Binding(
                    get: { appState.preferences.favoriteCooldownDays },
                    set: { days in change { $0.favoriteCooldownDays = days } }
                ),
                in: 7...42
            ) {
                Text("Repeat a favorite after \(prefs.favoriteCooldownDays) days")
            }
        } header: {
            Text("Cooldown")
        } footer: {
            Text("How long a dinner sits out before it can come back. Favorites can come back sooner.")
        }
    }
}

/// A list of ingredient names shown as chips, swipe to remove, with a text
/// field and Add button underneath. The list itself is owned by the caller;
/// only the text being typed lives here.
private struct IngredientAvoidEditor: View {
    let items: [String]
    let fieldLabel: String
    let onChange: ([String]) -> Void

    @State private var typed = ""

    private var trimmed: String {
        typed.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    private var canAdd: Bool {
        !trimmed.isEmpty && !items.contains { $0.caseInsensitiveCompare(trimmed) == .orderedSame }
    }

    var body: some View {
        ForEach(items, id: \.self) { item in
            HStack {
                Text(item)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Color.echoText)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(Color.echoFill))
                Spacer()
            }
            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                Button(role: .destructive) {
                    remove(item)
                } label: {
                    Label("Remove", systemImage: "trash")
                }
            }
            .accessibilityElement(children: .combine)
            .accessibilityAction(named: "Remove") { remove(item) }
        }

        HStack(spacing: 10) {
            TextField(fieldLabel, text: $typed)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.done)
                .onSubmit(add)
            Button("Add", action: add)
                .buttonStyle(.borderless)
                .disabled(!canAdd)
        }
    }

    private func add() {
        guard canAdd else { return }
        onChange(items + [trimmed])
        typed = ""
    }

    private func remove(_ item: String) {
        onChange(items.filter { $0 != item })
    }
}
