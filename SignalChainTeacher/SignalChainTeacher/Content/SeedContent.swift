import Foundation
import SwiftData

/// The five-day curriculum and the cue vocabulary bank, ported directly from
/// signal-chain-content.json (the HTML artifact's data) rather than
/// re-derived. Edit here, not in the views, if the curriculum changes.
enum SeedContent {

    struct ModuleSeed {
        let id: String
        let device: String
        let tag: String
        let name: String
        let focus: String
        let panelHex: String
        let accentHex: String
        let ledHex: String
        let objectives: [String]
    }

    struct QuizCardSeed {
        let id: String
        let filmMoment: String
        let moduleName: String
        let technique: String
    }

    static let modules: [ModuleSeed] = [
        ModuleSeed(
            id: "d1",
            device: "Behringer Model D",
            tag: "Day 1",
            name: "Subtractive Fundamentals",
            focus: "Tone as emotional color. The foundation every other module builds on.",
            panelHex: "1c1c1e", accentHex: "4a7bd8", ledHex: "e23d28",
            objectives: [
                "Patch one VCO, no filter. Learn raw waveform character (saw, tri, pulse) by ear.",
                "Build a dread drone. Low, detuned, slow filter movement.",
                "Build a hope pad. Same oscillators, brighter filter, longer attack.",
                "Practice real-time filter sweeps by hand. This is your live tension-rise tool.",
                "Patch ADSR on filter contour vs. loudness contour separately. Hear the difference.",
                "End of day: dread drone and hope pad, patched from memory, no presets."
            ]
        ),
        ModuleSeed(
            id: "d2",
            device: "Mother-32",
            tag: "Day 2",
            name: "Semi-Modular Bridge and Motifs",
            focus: "Same engine as Model D, but patchable. Where modular thinking starts.",
            panelHex: "1a1712", accentHex: "e08a2b", ledHex: "f2a33a",
            objectives: [
                "Trace the signal path via patch cables instead of internal routing.",
                "Program a 3 to 5 note ominous motif. Minimal, recurring, not a melody.",
                "Use Rest, Accent, and Slide on the sequencer.",
                "Deliberately break the normalled signal path. Pull a cable, patch it elsewhere.",
                "Patch Mother-32's gate/CV to drive another module."
            ]
        ),
        ModuleSeed(
            id: "d3",
            device: "DFAM",
            tag: "Day 3",
            name: "Rhythmic Tension, Not Drums",
            focus: "Two VCOs, two envelope generators. Percussion engine bent toward dread.",
            panelHex: "efe3c4", accentHex: "b23a24", ledHex: "e23d28",
            objectives: [
                "Program irregular, arrhythmic pulses. Heartbeat, ticking-clock dread, industrial stabs.",
                "Stretch envelope attack and decay past drum range for risers and impacts.",
                "Patch VCO2 as an FM source into VCO1 for metallic and impact tones.",
                "End of day: one tension-pulse pattern, one impact/stinger sound."
            ]
        ),
        ModuleSeed(
            id: "d4",
            device: "Subharmonicon",
            tag: "Day 4",
            name: "Dissonance and Scale",
            focus: "Ratio-based thinking, not tuning by ear.",
            panelHex: "ede0bd", accentHex: "9a2d1c", ledHex: "e23d28",
            objectives: [
                "Understand subharmonic generators (VCO dividing into SUB 1 / SUB 2).",
                "Build unsettling, dissonant clusters using off-ratios for horror and thriller.",
                "Build consonant clusters using octave and fifth ratios for epic and grandeur.",
                "Run the two independent 4-step sequencers as a polyrhythm (3 against 4)."
            ]
        ),
        ModuleSeed(
            id: "d5",
            device: "Nightfall + Full Rig",
            tag: "Day 5",
            name: "Cue Building",
            focus: "Integrate everything into three real, deliverable cues.",
            panelHex: "101a1c", accentHex: "4fb8ab", ledHex: "4fb8ab",
            objectives: [
                "Learn Nightfall's voice architecture solo. Trace signal path, patch from scratch.",
                "Patch Mother-32 or DFAM sequencer as clock/gate into Subharmonicon or Nightfall.",
                "Build a tension-build cue, under 90 seconds.",
                "Build an impact/stinger cue, under 90 seconds.",
                "Build a resolve/ambient-bed cue, under 90 seconds.",
                "Record into Apollo x4, print stems separately."
            ]
        )
    ]

    static let cueVocabulary: [QuizCardSeed] = [
        QuizCardSeed(id: "q1", filmMoment: "Dread / unease", moduleName: "Model D",
                     technique: "Low detuned drone, slow filter sweep down."),
        QuizCardSeed(id: "q2", filmMoment: "Tension rise", moduleName: "Model D",
                     technique: "Real-time hand filter sweep, resonance pushed near self-oscillation."),
        QuizCardSeed(id: "q3", filmMoment: "Heartbeat / dread pulse", moduleName: "DFAM",
                     technique: "Irregular sequencer pattern, slow envelope on kick voice."),
        QuizCardSeed(id: "q4", filmMoment: "Ticking clock", moduleName: "DFAM",
                     technique: "Fast, regular gate pulses, short percussive envelope."),
        QuizCardSeed(id: "q5", filmMoment: "Impact / stinger", moduleName: "DFAM",
                     technique: "VCO2 into VCO1 FM, fast attack, held envelope, high level."),
        QuizCardSeed(id: "q6", filmMoment: "Dissonance / wrongness", moduleName: "Subharmonicon",
                     technique: "Off-ratio subharmonic clusters, non-octave, non-fifth."),
        QuizCardSeed(id: "q7", filmMoment: "Epic / grandeur", moduleName: "Subharmonicon",
                     technique: "Octave and fifth subharmonic ratios, full chord."),
        QuizCardSeed(id: "q8", filmMoment: "Chase / unease under motion", moduleName: "Subharmonicon",
                     technique: "Polyrhythm, 3 against 4, at moderate tempo."),
        QuizCardSeed(id: "q9", filmMoment: "Recurring theme / motif", moduleName: "Mother-32",
                     technique: "3 to 5 note minimal sequenced phrase, Accent and Slide."),
        QuizCardSeed(id: "q10", filmMoment: "Modular glue between cues", moduleName: "Mother-32",
                     technique: "Gate/CV output driving another module's sequencer or filter."),
        QuizCardSeed(id: "q11", filmMoment: "Atmosphere / texture bed", moduleName: "Nightfall",
                     technique: "Slow swells, drone layering under other elements."),
        QuizCardSeed(id: "q12", filmMoment: "Resolve / release", moduleName: "Nightfall + Model D",
                     technique: "Long attack pad, filter opening slowly, minimal movement.")
    ]

    /// Populates an empty store on first launch. No-ops if modules already
    /// exist, so it is safe to call on every app start.
    @MainActor
    static func seedIfNeeded(context: ModelContext) {
        let existing = try? context.fetch(FetchDescriptor<Module>())
        if let existing, !existing.isEmpty { return }

        for (index, seed) in modules.enumerated() {
            let module = Module(
                id: seed.id,
                device: seed.device,
                tag: seed.tag,
                name: seed.name,
                focus: seed.focus,
                panelColorHex: seed.panelHex,
                accentColorHex: seed.accentHex,
                ledColorHex: seed.ledHex,
                sortOrder: index
            )
            context.insert(module)
            for (objIndex, text) in seed.objectives.enumerated() {
                let objective = Objective(
                    id: "\(seed.id)t\(objIndex + 1)",
                    text: text,
                    xpValue: XPCalculator.taskXP,
                    sortOrder: objIndex
                )
                objective.module = module
                context.insert(objective)
            }
        }

        for (index, card) in cueVocabulary.enumerated() {
            let quizCard = QuizCard(
                id: card.id,
                filmMoment: card.filmMoment,
                moduleName: card.moduleName,
                technique: card.technique,
                sortOrder: index
            )
            context.insert(quizCard)
        }

        context.insert(UserProgress())

        try? context.save()
    }
}
