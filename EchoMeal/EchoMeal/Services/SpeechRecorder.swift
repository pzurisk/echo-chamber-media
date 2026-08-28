import AVFoundation
import Foundation
import Speech

/// Speech capture. Tap once to start, tap again to stop. No auto-stop:
/// take your time, think between sentences, and end it when you are done.
/// Uses Apple's best available recognition (on-device when the model is
/// downloaded, Apple's servers otherwise).
@MainActor
final class SpeechRecorder: NSObject, ObservableObject {

    @Published var isRecording = false
    @Published var transcript = ""
    @Published var errorMessage: String?

    /// Called with the final transcript when recording ends with real content.
    var onFinish: ((String) -> Void)?

    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?

    /// True from the moment start() is tapped until recording actually
    /// begins or fails. Debounces the button: a fast double-tap lands
    /// during the async permission checks, before isRecording flips, and
    /// without this flag it would spin up a second recognition session.
    private var isStarting = false

    func toggle() {
        if isRecording { stop() } else { start() }
    }

    func start() {
        guard !isStarting else { return }
        isStarting = true
        transcript = ""
        errorMessage = nil

        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                guard let self else { return }
                guard status == .authorized else {
                    self.errorMessage = "Speech recognition is turned off. Enable it for MealTime in Settings."
                    self.isStarting = false
                    return
                }
                self.requestMicThenRecord()
            }
        }
    }

    func stop() {
        finish()
    }

    // MARK: - Internals

    private func requestMicThenRecord() {
        AVAudioApplication.requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                guard let self else { return }
                guard granted else {
                    self.errorMessage = "Microphone access is off. Enable it for MealTime in Settings."
                    self.isStarting = false
                    return
                }
                self.beginRecording()
            }
        }
    }

    private func beginRecording() {
        guard let recognizer, recognizer.isAvailable else {
            errorMessage = "Speech recognition is not available on this device right now."
            isStarting = false
            return
        }

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .measurement, options: .duckOthers)
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            // Deliberately NOT requiring on-device recognition. Requiring it
            // can return empty results on phones that have not downloaded
            // Apple's offline speech model. iOS still uses on-device when
            // available; otherwise Apple's servers handle it.
            recognitionRequest = request

            let inputNode = audioEngine.inputNode
            let format = inputNode.outputFormat(forBus: 0)
            inputNode.removeTap(onBus: 0)
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
                self?.recognitionRequest?.append(buffer)
            }

            audioEngine.prepare()
            try audioEngine.start()
            isRecording = true
            isStarting = false
            HouseholdConfig.trace("recorder.beginRecording isRecording=true")

            recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
                DispatchQueue.main.async {
                    guard let self else { return }
                    if let result {
                        self.transcript = result.bestTranscription.formattedString
                        if result.isFinal {
                            HouseholdConfig.trace("recorder.result isFinal chars=\(self.transcript.count)")
                            self.finish()
                        }
                    }
                    if let error {
                        HouseholdConfig.trace("recorder.error isRecording=\(self.isRecording) err=\(error.localizedDescription)")
                    }
                    if error != nil, self.isRecording {
                        // Recognition errored mid-stream. Keep whatever text
                        // we already have and end cleanly.
                        self.finish()
                    }
                }
            }
        } catch {
            errorMessage = "Could not start the microphone. \(error.localizedDescription)"
            isRecording = false
            isStarting = false
        }
    }

    private func finish() {
        guard isRecording else {
            HouseholdConfig.trace("recorder.finish IGNORED, isRecording already false")
            return
        }
        isRecording = false
        HouseholdConfig.trace("recorder.finish isRecording=false chars=\(transcript.count)")

        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil

        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)

        let text = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        if !text.isEmpty {
            HouseholdConfig.trace("recorder.onFinish firing chars=\(text.count)")
            onFinish?(text)
        } else {
            HouseholdConfig.trace("recorder.onFinish SKIPPED, empty transcript")
            errorMessage = "I did not catch anything. Tap the button and try again."
        }
    }
}
