//
//  BiomarkerMonitor.swift
//  WatchAppCompanion Watch App
//
//  Created by ajapps on 2/15/25.
//

import Foundation
import HealthKit
import Combine

class BiomarkerMonitor: ObservableObject {
    // Published properties for UI updates
    @Published var currentHRV: Double = 0.0
    @Published var lastHeartRate: Double = 0.0
    @Published var currentAgitation: Double = 0.0
    
    
    // Server configuration
    private let baseURL = "http://localhost:8080/" // Change this to your actual server URL
    
    // Buffers
    private var heartRateBuffer: [Double] = []
    private var motionBuffer: [Double] = []
    private let hrvBufferSize = 5
    
    // User info
    let userName: String
    let userEmail: String
    
    init(userName: String, userEmail: String) {
        self.userName = userName
        self.userEmail = userEmail
    }
    
    // MARK: - Server Communication
    private func postToServer(endpoint: String, payload: [String: Any], completion: ((Data?, URLResponse?, Error?) -> Void)? = nil) {
        guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
            print("Invalid URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            
            let task = URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("Error posting to server: \(error)")
                    completion?(nil, nil, error)
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    print("Server response code: \(httpResponse.statusCode)")
                }
                
                completion?(data, response, error)
            }
            task.resume()
        } catch {
            print("Error creating request body: \(error)")
            completion?(nil, nil, error)
        }
    }
    
    // MARK: - Data Processing
    func processUpdate(type: String?, value: Double, timestamp: String) {
        switch type {
        case "HEART_RATE", "RUNNING_HEART_RATE":
            processHeartRate(value)
        case "MOTION":
            processMotion(value)
        default:
            break
        }
    }

    private func processHeartRate(_ value: Double) {
        DispatchQueue.main.async {
            self.lastHeartRate = value
        }
        
        heartRateBuffer.append(value)
        
        if heartRateBuffer.count >= hrvBufferSize {
            // Calculate HRV
            let hrvScore = calculateHRV()
            
            // Calculate current agitation from whatever motion data we have
            let agitationScore = calculateAgitation()
            
            // Update UI
            DispatchQueue.main.async {
                self.currentHRV = hrvScore
                self.currentAgitation = agitationScore
            }
            
            // Create payload
            let payload: [String: Any] = [
                "hrv": hrvScore,
                "agitation": agitationScore,
                "userName": userName,
                "userEmail": userEmail
            ]
            
            // Post to server and handle response
            postToServer(endpoint: "alert_status", payload: payload) { data, response, error in
                if let data = data,
                   let responseJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let isCritical = responseJson["critical"] as? Bool {
                    
                    if isCritical,
                       let question = responseJson["question"] as? String {
                        // Handle critical state - You can add your conversation triggering logic here
                        print("Critical state detected! Question: \(question)")
                        // Trigger conversation or UI update as needed
                    }
                }
            }
            
            // Clear HRV buffer
            heartRateBuffer.removeAll()
        }
    }

    private func processMotion(_ value: Double) {
        // Store raw motion value without early normalization
        motionBuffer.append(value)
        print("Motion buffer size: \(motionBuffer.count)")  // Debug print
        
        // Keep a reasonable amount of motion data (last 60 samples)
        if motionBuffer.count > 60 {
            motionBuffer.removeFirst()
        }
    }
    
    private func calculateHRV() -> Double {
        var differences: [Double] = []
        
        // Calculate successive differences
        for i in 1..<heartRateBuffer.count {
            let diff = abs(heartRateBuffer[i] - heartRateBuffer[i-1])
            differences.append(diff)
        }
        
        guard !differences.isEmpty else { return 0 }
        
        // Calculate RMSSD (Root Mean Square of Successive Differences)
        let squaredDiffs = differences.map { $0 * $0 }
        let meanSquaredDiff = squaredDiffs.reduce(0, +) / Double(squaredDiffs.count)
        return sqrt(meanSquaredDiff)
    }
    
    private func calculateAgitation() -> Double {
        guard motionBuffer.count >= 3 else {
            print("Not enough motion samples: \(motionBuffer.count)")  // Debug print
            return 0
        }
        
        var rapidChanges = 0
        var totalMagnitude = 0.0
        
        // Look for rapid direction changes and high magnitudes
        for i in 1..<motionBuffer.count - 1 {
            let prev = motionBuffer[i-1]
            let current = motionBuffer[i]
            let next = motionBuffer[i+1]
            
            // Detect direction change (shaking pattern)
            let prevDiff = current - prev
            let nextDiff = next - current
            if prevDiff * nextDiff < 0 {  // Direction change
                let magnitude = abs(current)
                if magnitude > 0.5 {  // Lower threshold to catch more movements
                    rapidChanges += 1
                    totalMagnitude += magnitude
                    print("Detected rapid change at index \(i), magnitude: \(magnitude)")  // Debug print
                }
            }
        }
        print("Rapid changes: \(rapidChanges), Total magnitude: \(totalMagnitude)")  // Debug print
        
        // Calculate score based on:
        // 1. Number of rapid direction changes
        // 2. Average magnitude of those changes
        let changeRatio = Double(rapidChanges) / Double(motionBuffer.count - 2)
        let avgMagnitude = rapidChanges > 0 ? totalMagnitude / Double(rapidChanges) : 0
        
        // Combine into final score (0-100)
        let score = (changeRatio * 50.0 + min(avgMagnitude, 5.0) * 10.0)
        let finalScore = min(100, max(0, score))
        
        print("Change ratio: \(changeRatio), Avg magnitude: \(avgMagnitude), Final score: \(finalScore)")  // Debug print
        return finalScore
    }
}

// MARK: - HealthKit Extension
extension BiomarkerMonitor {
    func calculateSleepMetrics() {
        let healthStore = HKHealthStore()
        
        // Request authorization for sleep and activity data
        let typesToRead: Set<HKSampleType> = [
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            if success {
                self.fetchSleepData()
                self.fetchActivityData()
            } else {
                print("Failed to get HealthKit authorization: \(String(describing: error))")
            }
        }
    }
    
    private func fetchSleepData() {
        let healthStore = HKHealthStore()
        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        
        // Get last night's sleep data
        let calendar = Calendar.current
        let now = Date()
        guard let yesterday = calendar.date(byAdding: .day, value: -1, to: now) else { return }
        let predicate = HKQuery.predicateForSamples(withStart: yesterday, end: now, options: .strictEndDate)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
            guard let sleepSamples = samples as? [HKCategorySample] else {
                print("Failed to get sleep samples: \(String(describing: error))")
                return
            }
            
            // Calculate sleep metrics
            var totalSleepTime: TimeInterval = 0
            var awakeTime: TimeInterval = 0
            var deepSleepTime: TimeInterval = 0
            var remSleepTime: TimeInterval = 0
            var sleepQualityScore: Double = 0
            
            for sample in sleepSamples {
                let duration = sample.endDate.timeIntervalSince(sample.startDate)
                
                switch sample.value {
                case HKCategoryValueSleepAnalysis.inBed.rawValue:
                    // In bed but not necessarily asleep
                    break
                case HKCategoryValueSleepAnalysis.asleep.rawValue:
                    totalSleepTime += duration
                case HKCategoryValueSleepAnalysis.awake.rawValue:
                    awakeTime += duration
                case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                    deepSleepTime += duration
                case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                    remSleepTime += duration
                default:
                    break
                }
            }
            
            // Calculate sleep quality score (0-100)
            if totalSleepTime > 0 {
                // Factors in calculation:
                // 1. Total sleep duration (ideal: 7-9 hours)
                // 2. Deep sleep percentage (ideal: 15-25%)
                // 3. REM sleep percentage (ideal: 20-25%)
                // 4. Sleep efficiency (sleep time / time in bed)
                
                let hoursSlept = totalSleepTime / 3600
                let durationScore = min(100, max(0, (hoursSlept / 8) * 100))
                
                let deepSleepPercent = (deepSleepTime / totalSleepTime) * 100
                let deepSleepScore = min(100, max(0, (deepSleepPercent / 20) * 100))
                
                let remSleepPercent = (remSleepTime / totalSleepTime) * 100
                let remSleepScore = min(100, max(0, (remSleepPercent / 22) * 100))
                
                let sleepEfficiency = (totalSleepTime / (totalSleepTime + awakeTime)) * 100
                let efficiencyScore = min(100, max(0, sleepEfficiency))
                
                sleepQualityScore = (durationScore * 0.4 + deepSleepScore * 0.2 + remSleepScore * 0.2 + efficiencyScore * 0.2)
            }

            // Create sleep metrics payload
            let sleepMetrics: [String: Any] = [
                "userName": self.userName,
                "userEmail": self.userEmail,
                "totalSleepHours": totalSleepTime / 3600,
                "deepSleepHours": deepSleepTime / 3600,
                "remSleepHours": remSleepTime / 3600,
                "awakeTime": awakeTime / 3600,
                "sleepQualityScore": sleepQualityScore
            ]
            
            self.postToServer(endpoint: "health-metrics/sleep", payload: sleepMetrics)
        }
        
        healthStore.execute(query)
    }
    
    private func fetchActivityData() {
        let healthStore = HKHealthStore()
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        
        // Get today's activity data
        let calendar = Calendar.current
        let now = Date()
        guard let yesterday = calendar.date(byAdding: .day, value: -1, to: now) else { return }
        let predicate = HKQuery.predicateForSamples(withStart: yesterday, end: now, options: .strictEndDate)
        
        // Fetch steps
        let stepsQuery = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate) { _, result, error in
            guard let result = result, let sum = result.sumQuantity() else {
                print("Failed to get step count: \(String(describing: error))")
                return
            }
            
            let steps = sum.doubleValue(for: HKUnit.count())
            
            // Fetch calories
            let energyQuery = HKStatisticsQuery(quantityType: energyType, quantitySamplePredicate: predicate) { _, result, error in
                guard let result = result, let sum = result.sumQuantity() else {
                    print("Failed to get energy burned: \(String(describing: error))")
                    return
                }
                
                let calories = sum.doubleValue(for: HKUnit.kilocalorie())
                
                // Calculate activity score (0-100)
                let stepGoal = 10000.0
                let calorieGoal = 500.0
                
                let stepScore = min(100, (steps / stepGoal) * 100)
                let calorieScore = min(100, (calories / calorieGoal) * 100)
                let activityScore = (stepScore + calorieScore) / 2
                
                // Create activity metrics payload
                let activityMetrics: [String: Any] = [
                    "userName": self.userName,
                    "userEmail": self.userEmail,
                    "steps": steps,
                    "caloriesBurned": calories,
                    "activityScore": activityScore
                ]
                
                self.postToServer(endpoint: "health-metrics/activity", payload: activityMetrics)
            }
            
            healthStore.execute(energyQuery)
        }
        
        healthStore.execute(stepsQuery)
    }
}
