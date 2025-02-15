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
    
    var body: some View {
        VStack {
            Text(isStreaming ? "Streaming Data..." : "Ready to Stream")
                .padding()
            
            Button(action: {
                if isStreaming {
                    stopStreaming()
                } else {
                    startStreaming()
                }
            }) {
                Text(isStreaming ? "Stop Streaming" : "Start Streaming")
                    .padding()
            }
            
            if isWorkout {
                Text("Workout Active")
                    .foregroundColor(.green)
            }
        }
        .onAppear {
            initializeTerra()
        }
    }

    private func initializeTerra() {
        do {
            terraRT = try Terra()
            terraRT?.connect()
            print("Terra SDK initialized on watchOS")
            terraRT?.setUpdateHandler { update in
                print("UPDATES IN WATCH:")
                print("- Type: \(update.type)")
                print("- Value: \(update.val ?? 0)")
                print("- Timestamp: \(update.ts)")
            }
        } catch {
            print("Failed to initialize Terra SDK: \(error)")
        }
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
