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

    func toggle() {
        if isRecording { stop() } else { start() }
    }

    func start() {
        transcript = ""
        errorMessage = nil

        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                guard let self else { return }
                guard status == .authorized else {
                    self.errorMessage = "Speech recognition is turned off. Enable it for MealTime in Settings."
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
                    return
                }
                self.beginRecording()
            }
        }
    }

    private func beginRecording() {
        guard let recognizer, recognizer.isAvailable else {
            errorMessage = "Speech recognition is not available on this device right now."
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

            recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
                DispatchQueue.main.async {
                    guard let self else { return }
                    if let result {
                        self.transcript = result.bestTranscription.formattedString
                        if result.isFinal { self.finish() }
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
        }
    }

    private func finish() {
        guard isRecording else { return }
        isRecording = false

        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil

        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)

        let text = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        if !text.isEmpty {
            onFinish?(text)
        } else {
            errorMessage = "I did not catch anything. Tap the button and try again."
        }
    }
}
