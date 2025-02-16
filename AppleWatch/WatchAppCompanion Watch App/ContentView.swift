//
//  ContentView.swift
//  WatchAppCompanion Watch App
//
//  Created by ajapps on 2/15/25.
//

import SwiftUI
import TerraRTiOS
import AVFoundation

struct WatchView: View {
    @State private var terraRT: Terra?
    @State private var isStreaming = false
    @State private var isWorkout = false
    @StateObject private var biomarkerMonitor = BiomarkerMonitor(userName: "John Doe", userEmail: "jodoe@gmail.com")
    @State private var audioPlayer: AVAudioPlayer?
    
    // Recording states
    @State private var isRecording = false
    @State private var audioRecorder: AVAudioRecorder?
    @State private var recordingURL: URL?
    @State private var conversationNum = 0
    @State private var conversationHistory: [[String: String]] = []

    var body: some View {
        if biomarkerMonitor.isCriticalState {
            // Conversation View
            VStack(spacing: 12) {
                Text("AI Therapist")
                    .font(.headline)
                
                Text(biomarkerMonitor.therapistMessage)
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                if audioPlayer != nil {
                    Button(action: playTherapistMessage) {
                        Image(systemName: "play.circle.fill")
                            .font(.title)
                            .foregroundColor(.blue)
                    }
                }
                
                // Record Button
                Button(action: toggleRecording) {
                    Image(systemName: isRecording ? "stop.circle.fill" : "mic.circle.fill")
                        .font(.system(size: 40))
                        .foregroundColor(isRecording ? .red : .blue)
                }
                .padding()
                
                Button(action: {
                    withAnimation {
                        biomarkerMonitor.isCriticalState = false
                        // Stop any playing audio when going back
                        audioPlayer?.stop()
                        audioPlayer = nil
                    }
                }) {
                    HStack {
                        Image(systemName: "arrow.left")
                        Text("Back to Monitoring")
                    }
                    .padding(.vertical, 8)
                }
            }
            .padding()
            .transition(.opacity)
        } else {
            // Biometrics View
            VStack(spacing: 8) {
                // Status text with dot indicator
                HStack {
                    Circle()
                        .fill(isStreaming ? Color.green : Color.red)
                        .frame(width: 6, height: 6)
                    Text(isStreaming ? "Streaming Data..." : "Ready to Stream")
                        .font(.footnote)
                }
                .padding(.vertical, 4)
                
                // Biometrics display
                VStack(spacing: 12) {
                    // HRV
                    HStack {
                        Image(systemName: "waveform.path.ecg")
                            .foregroundColor(.blue)
                        Text("HRV:")
                            .font(.footnote)
                        Text("\(biomarkerMonitor.currentHRV, specifier: "%.1f")")
                            .font(.system(.body, design: .rounded))
                            .bold()
                    }
                    
                    // Heart Rate
                    HStack {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.red)
                        Text("\(biomarkerMonitor.lastHeartRate, specifier: "%.0f")")
                            .font(.system(.title2, design: .rounded))
                            .bold()
                        Text("BPM")
                            .font(.footnote)
                    }
                    
                    // Agitation Score
                    HStack {
                        Image(systemName: "hand.raised.fill")
                            .foregroundColor(.orange)
                        Text("Agitation:")
                            .font(.footnote)
                        Text("\(biomarkerMonitor.currentAgitation, specifier: "%.1f")")
                            .font(.system(.body, design: .rounded))
                            .bold()
                    }
                }
                .padding(.vertical, 4)
                
                // Control button
                Button(action: {
                    if isStreaming {
                        stopStreaming()
                    } else {
                        startStreaming()
                    }
                }) {
                    Text(isStreaming ? "Stop Streaming" : "Start Streaming")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .cornerRadius(8)
                }
            }
            .padding(.horizontal)
            .transition(.opacity)
            .onAppear {
                initializeTerra()
                calculateMetrics()
                setupCriticalStateHandler()
            }
        }
    }
    
    // MARK: - Recording Functions
    private func toggleRecording() {
        if isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }
    
    private func startRecording() {
        let audioSession = AVAudioSession.sharedInstance()
        
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default)
            try audioSession.setActive(true)
            
            let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let audioFilename = documentsPath.appendingPathComponent("recording.wav")
            recordingURL = audioFilename
            
            let settings = [
                AVFormatIDKey: Int(kAudioFormatLinearPCM),
                AVSampleRateKey: 16000,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
            ]
            
            audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
            audioRecorder?.record()
            isRecording = true
            
        } catch {
            print("Recording failed: \(error)")
        }
    }
    
    private func stopRecording() {
        audioRecorder?.stop()
        isRecording = false
        
        // Send the recording to server
        if let url = recordingURL {
            sendRecordingToServer(fileURL: url)
        }
    }
    
    private func sendRecordingToServer(fileURL: URL) {
        print("Starting to send recording...")
        
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "\(biomarkerMonitor.baseURL)assessment")!)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var data = Data()
        
        // Add form fields
        let metadata = ["userName": biomarkerMonitor.userName, "userEmail": biomarkerMonitor.userEmail]
        print("Sending metadata:", metadata)
        
        // Add metadata
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"metadata\"\r\n\r\n".data(using: .utf8)!)
        data.append("\(String(data: try! JSONEncoder().encode(metadata), encoding: .utf8)!)\r\n".data(using: .utf8)!)
        
        // Add conversation data
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"num\"\r\n\r\n".data(using: .utf8)!)
        data.append("\(conversationNum)\r\n".data(using: .utf8)!)
        
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"history\"\r\n\r\n".data(using: .utf8)!)
        data.append("\(String(data: try! JSONEncoder().encode(conversationHistory), encoding: .utf8)!)\r\n".data(using: .utf8)!)
        
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"question_text\"\r\n\r\n".data(using: .utf8)!)
        data.append("\(biomarkerMonitor.therapistMessage)\r\n".data(using: .utf8)!)
        
        // Add audio file
        if let audioData = try? Data(contentsOf: fileURL) {
            print("Adding audio file, size:", audioData.count)
            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append("Content-Disposition: form-data; name=\"answer_audio\"; filename=\"recording.wav\"\r\n".data(using: .utf8)!)
            data.append("Content-Type: audio/wav\r\n\r\n".data(using: .utf8)!)
            data.append(audioData)
            data.append("\r\n".data(using: .utf8)!)
        }
        
        data.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        let task = URLSession.shared.uploadTask(with: request, from: data) { data, response, error in
            if let error = error {
                print("Error sending recording: \(error)")
                return
            }
            
            if let data = data,
               let response = try? JSONDecoder().decode(AssessmentResponse.self, from: data) {
                print("Received response:", response.question_text)
                
                DispatchQueue.main.async {
                    // Update conversation state
                    self.conversationNum = response.num
                    self.conversationHistory = response.history
                    
                    if !response.end {
                        // Setup next question
                        self.biomarkerMonitor.therapistMessage = response.question_text
                        
                        // Important: Properly handle audio player updates
                        if let audioData = Data(base64Encoded: response.question) {
                            print("Received new audio data, size: \(audioData.count)")
                            do {
                                // Explicitly stop and nil out the old player
                                self.audioPlayer?.stop()
                                self.audioPlayer = nil
                                
                                // Create new player
                                self.audioPlayer = try AVAudioPlayer(data: audioData)
                                self.audioPlayer?.prepareToPlay()
                                print("Successfully created new audio player")
                            } catch {
                                print("Failed to create audio player: \(error)")
                            }
                        } else {
                            print("Failed to decode audio data from base64")
                        }
                    } else {
                        print("Conversation ended")
                    }
                }
            } else {
                print("Failed to decode server response")
                if let responseData = data,
                   let responseStr = String(data: responseData, encoding: .utf8) {
                    print("Raw response:", responseStr)
                }
            }
        }
        task.resume()
    }
    
    // MARK: - Terra and Critical State Functions
    private func setupCriticalStateHandler() {
        biomarkerMonitor.onCriticalState = {
            stopStreaming()
            
            // Setup audio player if we have audio data
            if let audioData = biomarkerMonitor.therapistAudio {
                do {
                    // Stop any existing audio
                    self.audioPlayer?.stop()
                    self.audioPlayer = nil
                    
                    // Create new player
                    audioPlayer = try AVAudioPlayer(data: audioData)
                    audioPlayer?.prepareToPlay()
                } catch {
                    print("Failed to create audio player: \(error)")
                }
            }
        }
    }
    
    private func playTherapistMessage() {
        audioPlayer?.play()
    }
    
    private func initializeTerra() {
        do {
            terraRT = try Terra()
            terraRT?.connect()
            print("Terra SDK initialized on watchOS")
            terraRT?.setUpdateHandler { update in
                Task {
                    biomarkerMonitor.processUpdate(
                        type: update.type,
                        value: update.val ?? 0,
                        timestamp: update.ts ?? ISO8601DateFormatter().string(from: Date())
                    )
                }
            }
        } catch {
            print("Failed to initialize Terra SDK: \(error)")
        }
    }
    
    private func calculateMetrics() {
        biomarkerMonitor.calculateSleepMetrics()
    }
    
    private func startStreaming() {
        let dataTypes: Set<TerraRTiOS.ReadTypes> = [.HEART_RATE, .STEPS]
        
        // First start exercise session
        terraRT?.startExercise(forType: .RUNNING) { success, error in
            if success {
                print("Exercise session started")
                isWorkout = true
                
                // Then start data streaming
                terraRT?.startStream(forDataTypes: dataTypes) { success, error in
                    if success {
                        isStreaming = true
                        print("Streaming started")
                        simulateMotion()
                    } else {
                        print("Failed to start streaming: \(error?.localizedDescription ?? "Unknown error")")
                    }
                }
            } else {
                print("Failed to start exercise: \(error?.localizedDescription ?? "Unknown error")")
            }
        }
    }
    
    private func stopStreaming() {
        // Stop data streaming
        terraRT?.stopStream()
        isStreaming = false
        print("Streaming stopped")
        
        // Stop exercise session
        terraRT?.stopExercise { success, error in
            if success {
                isWorkout = false
                print("Exercise session stopped")
            } else {
                print("Failed to stop exercise: \(error?.localizedDescription ?? "Unknown error")")
            }
        }
    }
}

// MARK: - Motion Simulation
extension WatchView {
    private func simulateMotion() {
        var time = 0.0
        Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            guard isStreaming else { return }
            
            // Simulate occasional wrist shaking
            let motion: Double
            if Int(time) % 10 < 3 { // Shake for 3 seconds every 10 seconds
                // Fast oscillation (shaking)
                motion = 8.0 * abs(sin(time * 10)) // Higher frequency and magnitude
            } else {
                // Normal motion
                motion = abs(2.0 * sin(time) + Double.random(in: -1...1))
            }
            
            time += 0.2
            
            // Process the simulated motion directly
            Task {
                print("Simulated Motion: \(motion)")
                biomarkerMonitor.processUpdate(
                    type: "MOTION",
                    value: motion,
                    timestamp: ISO8601DateFormatter().string(from: Date())
                )
            }
        }
    }
}

// MARK: - Supporting Types
struct AssessmentResponse: Codable {
    let num: Int
    let history: [[String: String]]
    let question: String
    let question_text: String
    let end: Bool
    let metadata: [String: String]
}

struct ContentView: View {
    var body: some View {
        WatchView()
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
