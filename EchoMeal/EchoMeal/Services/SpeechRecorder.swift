import AVFoundation
import Foundation
import Speech

/// On-device speech capture. Tap to start, tap to stop, or auto-stop after
/// about 2 seconds of silence. Prefers on-device recognition when the
/// hardware supports it.
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
    private var silenceTimer: Timer?
    private static let silenceWindow: TimeInterval = 2.0

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
                    self.errorMessage = "Speech recognition is turned off. Enable it for Echo Meal in Settings."
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
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                guard let self else { return }
                guard granted else {
                    self.errorMessage = "Microphone access is off. Enable it for Echo Meal in Settings."
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
            if recognizer.supportsOnDeviceRecognition {
                request.requiresOnDeviceRecognition = true
            }
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
            resetSilenceTimer()

            recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
                DispatchQueue.main.async {
                    guard let self else { return }
                    if let result {
                        self.transcript = result.bestTranscription.formattedString
                        self.resetSilenceTimer()
                        if result.isFinal { self.finish() }
                    }
                    if error != nil, self.isRecording {
                        self.finish()
                    }
                }
            }
        } catch {
            errorMessage = "Could not start the microphone. \(error.localizedDescription)"
            isRecording = false
        }
    }

    private func resetSilenceTimer() {
        silenceTimer?.invalidate()
        silenceTimer = Timer.scheduledTimer(withTimeInterval: Self.silenceWindow, repeats: false) { [weak self] _ in
            Task { @MainActor in
                self?.finish()
            }
        }
    }

    private func finish() {
        guard isRecording else { return }
        isRecording = false

        silenceTimer?.invalidate()
        silenceTimer = nil

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
        }
    }
}
