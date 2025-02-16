//
//  ContentView.swift
//  WatchAppCompanion Watch App
//
//  Created by ajapps on 2/15/25.
//

import SwiftUI
import TerraRTiOS

struct WatchView: View {
    @State private var terraRT: Terra?
    @State private var isStreaming = false
    @State private var isWorkout = false
    @StateObject private var biomarkerMonitor = BiomarkerMonitor(userName: "steve", userEmail: "steve@aol.com")
    
    var body: some View {
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
            
            if isWorkout {
                HStack {
                    Image(systemName: "figure.run")
                    Text("Workout Active")
                }
                .foregroundColor(.green)
                .font(.footnote)
            }
        }
        .padding(.horizontal)
        .onAppear {
            initializeTerra()
            calculateMetrics()
        }
    }
    

    private func initializeTerra() {
        do {
            terraRT = try Terra()
            terraRT?.connect()
            print("Terra SDK initialized on watchOS")
            terraRT?.setUpdateHandler { update in
                Task {
//                    print("Type: \(String(describing: update.type)), Value: \(String(describing: update.val))")
                    
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
