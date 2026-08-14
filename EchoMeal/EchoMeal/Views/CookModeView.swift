import SwiftUI
import UIKit

/// Full screen, step-by-step cooking mode built for messy hands. Huge
/// text, tap the right two thirds of the screen to advance, the left third
/// to go back, with small chevron buttons for discoverability. Page 0 is
/// an ingredients checklist so everything can be laid out before step 1,
/// and the last page asks for a rating. The screen stays awake while this
/// view is visible.
struct CookModeView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase

    let recipe: Recipe

    /// 0 is the ingredients checklist, 1 through steps.count are the
    /// cooking steps, and the page after the last step is the rating
    /// screen.
    @State private var page = 0

    /// Local check-offs for the ingredients screen, by ingredient index.
    /// Deliberately not synced: this is a scratch list for laying things
    /// out on the counter, not the shared grocery list.
    @State private var checkedIngredients: Set<Int> = []

    private var stepCount: Int { recipe.steps.count }
    private var lastPage: Int { stepCount + 1 }

    private var progress: Double {
        guard lastPage > 0 else { return 1 }
        return Double(page) / Double(lastPage)
    }

    var body: some View {
        ZStack {
            Color.echoBackground.ignoresSafeArea()

            // Tap zones under the content. Step text is hit-test disabled,
            // so on a step page a tap anywhere on the right two thirds
            // lands here and advances; the left third goes back. On the
            // ingredients and rating pages the interactive content sits on
            // top and wins, which is what those pages need.
            GeometryReader { geo in
                HStack(spacing: 0) {
                    Color.clear
                        .frame(width: geo.size.width / 3)
                        .contentShape(Rectangle())
                        .onTapGesture { goBack() }
                    Color.clear
                        .contentShape(Rectangle())
                        .onTapGesture { goForward() }
                }
            }
            .ignoresSafeArea()

            VStack(spacing: 0) {
                header
                pageContent
                footer
            }
        }
        .onAppear {
            UIApplication.shared.isIdleTimerDisabled = true
        }
        .onDisappear {
            UIApplication.shared.isIdleTimerDisabled = false
        }
        .onChange(of: scenePhase) { _, newPhase in
            // The idle timer is an app-wide setting, so give it back the
            // moment the app leaves the foreground and reclaim it when
            // cook mode comes back on screen.
            UIApplication.shared.isIdleTimerDisabled = (newPhase == .active)
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 12) {
            HStack {
                Text(recipe.title)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color.echoTextSecondary)
                    .lineLimit(1)
                Spacer()
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.headline)
                        .foregroundStyle(Color.echoText)
                        .padding(10)
                        .background(Circle().fill(Color.echoFill))
                        .contentShape(Circle())
                }
                .accessibilityLabel("Close cook mode")
            }

            // Thin progress bar across the whole session.
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.echoFill)
                    Capsule()
                        .fill(Color.echoAccent)
                        .frame(width: max(geo.size.width * progress, page > 0 ? 6 : 0))
                }
            }
            .frame(height: 4)
            .accessibilityHidden(true)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
    }

    // MARK: - Pages

    @ViewBuilder
    private var pageContent: some View {
        if page == 0 {
            ingredientsPage
        } else if page <= stepCount {
            stepPage
        } else {
            donePage
        }
    }

    /// Page 0: lay everything out before the first step. Big checkboxes,
    /// local state only.
    private var ingredientsPage: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Grab your ingredients")
                .font(.title.weight(.bold))
                .foregroundStyle(Color.echoText)
                .padding(.top, 18)

            ScrollView {
                VStack(spacing: 0) {
                    ForEach(Array(recipe.ingredients.enumerated()), id: \.offset) { index, ingredient in
                        ingredientRow(index: index, ingredient: ingredient)
                    }
                }
            }

            Text("Checks here are just for laying things out. They don't touch the grocery list.")
                .font(.caption)
                .foregroundStyle(Color.echoTextSecondary)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func ingredientRow(index: Int, ingredient: Ingredient) -> some View {
        let checked = checkedIngredients.contains(index)
        return Button {
            if checked {
                checkedIngredients.remove(index)
            } else {
                checkedIngredients.insert(index)
            }
        } label: {
            HStack(spacing: 14) {
                Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                    .font(.largeTitle)
                    .foregroundStyle(checked ? Color.echoGreen : Color.echoTextSecondary)
                Text(ingredient.item)
                    .font(.title3.weight(.medium))
                    .foregroundStyle(checked ? Color.echoTextSecondary : Color.echoText)
                    .strikethrough(checked, color: Color.echoTextSecondary)
                    .multilineTextAlignment(.leading)
                Spacer()
                Text(ingredient.qty)
                    .font(.subheadline)
                    .foregroundStyle(Color.echoTextSecondary)
            }
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(ingredient.item), \(ingredient.qty)")
        .accessibilityValue(checked ? "ready" : "not ready")
    }

    /// Pages 1 through stepCount: one instruction, as big as it gets.
    /// Hit testing is off so taps fall through to the page-turn zones.
    private var stepPage: some View {
        VStack(spacing: 22) {
            Text("Step \(page) of \(stepCount)")
                .font(.title2.weight(.bold))
                .foregroundStyle(Color.echoAccentText)
            Text(recipe.steps[page - 1])
                .font(.system(size: 38, weight: .bold))
                .foregroundStyle(Color.echoText)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.4)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 28)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .allowsHitTesting(false)
    }

    /// Last page: rate it while it's fresh, then close.
    private var donePage: some View {
        VStack(spacing: 22) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(Color.echoGreen)
            Text("Done. How was it?")
                .font(.largeTitle.weight(.bold))
                .foregroundStyle(Color.echoText)
                .multilineTextAlignment(.center)
            StarRating(rating: appState.rating(for: recipe)) { stars in
                appState.rate(recipe, stars: stars)
            }
            Text("4 and 5 stars bring more meals like this. 1 and 2 stars mean it never comes back.")
                .font(.caption)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)
            Button("Close") {
                dismiss()
            }
            .buttonStyle(.borderedProminent)
            .tint(.echoAccent)
            .padding(.top, 8)
        }
        .padding(.horizontal, 28)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Footer

    /// Small visible chevrons so the tap zones are discoverable.
    private var footer: some View {
        HStack {
            Button {
                goBack()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(Color.echoText)
                    .padding(14)
                    .background(Circle().fill(Color.echoFill))
                    .contentShape(Circle())
            }
            .opacity(page > 0 ? 1 : 0)
            .disabled(page == 0)
            .accessibilityLabel("Previous step")

            Spacer()

            Button {
                goForward()
            } label: {
                Image(systemName: "chevron.right")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(Color.echoText)
                    .padding(14)
                    .background(Circle().fill(Color.echoFill))
                    .contentShape(Circle())
            }
            .opacity(page < lastPage ? 1 : 0)
            .disabled(page >= lastPage)
            .accessibilityLabel("Next step")
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 14)
    }

    // MARK: - Navigation

    private func goForward() {
        guard page < lastPage else { return }
        withAnimation(.easeInOut(duration: 0.15)) {
            page += 1
        }
    }

    private func goBack() {
        guard page > 0 else { return }
        withAnimation(.easeInOut(duration: 0.15)) {
            page -= 1
        }
    }
}
