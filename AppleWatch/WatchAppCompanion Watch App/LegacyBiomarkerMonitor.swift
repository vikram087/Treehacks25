//
//  BiomarkerMonitor.swift
//  WatchAppCompanion Watch App
//
//  Created by ajapps on 2/15/25.
//

import Foundation
import HealthKit
import Combine


class LegacyBiomarkerMonitor: ObservableObject {
    private let healthStore = HKHealthStore()
    
    // Real-time data buffers
    private var heartRateBuffer: [(value: Double, timestamp: String)] = []
    private var agitationBuffer: [(value: Double, timestamp: String)] = []
    private let bufferSize = 15
    
    // MARK: - Data Structures
    struct RealtimeMetrics {
        let heartRate: Double
        let hrv: Double
        let agitationScore: Double
        let timestamp: String
    }
    
    struct SleepMetrics {
        let totalSleepTime: TimeInterval
        let timeInBed: TimeInterval
        let waso: TimeInterval
        let sleepEfficiency: Double
        let sleepOnsetLatency: TimeInterval
        let sleepStages: [HKCategoryValueSleepAnalysis: TimeInterval]
        let stageTransitions: Int
        let briefAwakenings: Int
        let remLatency: TimeInterval
        let remDensity: Double
        let remFragmentation: Double
        let sleepRegularity: Double
    }
    
    struct ActivityMetrics {
        let l5Onset: Date
        let l5Activity: Double
        let m10Onset: Date
        let m10Activity: Double
        let relativeAmplitude: Double
        let intradailyVariability: Double
    }
    
    // MARK: - Initialization
    func initialize() async throws {
        let typesToRead: Set<HKSampleType> = [
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
        ]
        try await healthStore.requestAuthorization(toShare: [], read: typesToRead)
    }
    
    // MARK: - Real-time Data Processing
    func processUpdate(type: String?, value: Double, timestamp: String) async throws {
        switch type {
        case "HEART_RATE", "RUNNING_HEART_RATE":
            heartRateBuffer.append((value: value, timestamp: timestamp))
        case "MOTION":
            let agitationScore = calculateAgitationScore(value)
            agitationBuffer.append((value: agitationScore, timestamp: timestamp))
        default:
            break
        }
        
        if heartRateBuffer.count >= bufferSize && agitationBuffer.count >= bufferSize {
            let payload = try await collectAllMetrics(timestamp: timestamp)
            try await sendToServer(payload)
            clearBuffers()
        }
    }
    
    private func clearBuffers() {
        heartRateBuffer.removeAll()
        agitationBuffer.removeAll()
    }
    
    // MARK: - Sleep Analysis
    private func fetchSleepMetrics(start: Date, end: Date) async throws -> SleepMetrics {
        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictEndDate)
        
        let sleepData = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[HKCategorySample], Error>) in
            let query = HKSampleQuery(
                sampleType: sleepType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: samples as? [HKCategorySample] ?? [])
            }
            healthStore.execute(query)
        }
        
        var stageDurations: [HKCategoryValueSleepAnalysis: TimeInterval] = [:]
        var transitions = 0
        var briefAwakenings = 0
        var lastStage: HKCategoryValueSleepAnalysis?
        var sleepOnsetTimes: [Date] = []
        var wakeTimes: [Date] = []
        
        for sample in sleepData {
            guard let currentStage = HKCategoryValueSleepAnalysis(rawValue: sample.value) else { continue }
            
            // Accumulate stage durations
            let duration = sample.endDate.timeIntervalSince(sample.startDate)
            stageDurations[currentStage, default: 0] += duration
            
            // Track transitions and brief awakenings
            if let last = lastStage, last != currentStage {
                transitions += 1
                if currentStage == .awake && duration < 300 {
                    briefAwakenings += 1
                }
            }
            
            // Track sleep onset and wake times
            if currentStage == .asleep || currentStage == .asleepCore ||
                currentStage == .asleepDeep || currentStage == .asleepREM {
                sleepOnsetTimes.append(sample.startDate)
            } else if currentStage == .awake {
                wakeTimes.append(sample.startDate)
            }
            
            lastStage = currentStage
        }
        
        let totalSleepTime = calculateTotalSleepTime(stageDurations)
        let timeInBed = stageDurations[.inBed] ?? 0
        let waso = calculateWASO(sleepSamples: sleepData)
        let sol = calculateSOL(sleepSamples: sleepData)
        let remMetrics = calculateREMMetrics(sleepData)
        let sleepRegularity = calculateSleepRegularity(onsetTimes: sleepOnsetTimes, wakeTimes: wakeTimes)
        
        return SleepMetrics(
            totalSleepTime: totalSleepTime,
            timeInBed: timeInBed,
            waso: waso,
            sleepEfficiency: timeInBed > 0 ? (totalSleepTime/timeInBed) * 100 : 0,
            sleepOnsetLatency: sol,
            sleepStages: stageDurations,
            stageTransitions: transitions,
            briefAwakenings: briefAwakenings,
            remLatency: remMetrics.latency,
            remDensity: remMetrics.density,
            remFragmentation: remMetrics.fragmentation,
            sleepRegularity: sleepRegularity
        )
    }
    
    private func calculateTotalSleepTime(_ stages: [HKCategoryValueSleepAnalysis: TimeInterval]) -> TimeInterval {
        return (stages[.asleep] ?? 0) +
        (stages[.asleepCore] ?? 0) +
        (stages[.asleepDeep] ?? 0) +
        (stages[.asleepREM] ?? 0)
    }
    
    private func calculateWASO(sleepSamples: [HKCategorySample]) -> TimeInterval {
        var waso: TimeInterval = 0
        let sortedSamples = sleepSamples.sorted { $0.startDate < $1.startDate }
        
        for i in 1..<sortedSamples.count {
            let previousSample = sortedSamples[i-1]
            let currentSample = sortedSamples[i]
            
            if let previousValue = HKCategoryValueSleepAnalysis(rawValue: previousSample.value),
               let currentValue = HKCategoryValueSleepAnalysis(rawValue: currentSample.value),
               previousValue != .inBed && previousValue != .awake,
               currentValue == .awake {
                let wakePeriod = currentSample.endDate.timeIntervalSince(currentSample.startDate)
                waso += wakePeriod
            }
        }
        
        return waso
    }
    
    private func calculateSOL(sleepSamples: [HKCategorySample]) -> TimeInterval {
        let sortedSamples = sleepSamples.sorted { $0.startDate < $1.startDate }
        
        guard let firstInBed = sortedSamples.first(where: {
            HKCategoryValueSleepAnalysis(rawValue: $0.value) == .inBed
        }) else { return 0 }
        
        guard let firstSleep = sortedSamples.first(where: {
            if let value = HKCategoryValueSleepAnalysis(rawValue: $0.value) {
                return value == .asleep || value == .asleepCore ||
                value == .asleepDeep || value == .asleepREM
            }
            return false
        }) else { return 0 }
        
        return firstSleep.startDate.timeIntervalSince(firstInBed.startDate)
    }
    
    private func calculateREMMetrics(_ samples: [HKCategorySample]) -> (latency: TimeInterval, density: Double, fragmentation: Double) {
        let sortedSamples = samples.sorted { $0.startDate < $1.startDate }
        let remSamples = sortedSamples.filter {
            HKCategoryValueSleepAnalysis(rawValue: $0.value) == .asleepREM
        }
        
        guard let firstREM = remSamples.first,
              let sleepStart = sortedSamples.first(where: {
                  if let value = HKCategoryValueSleepAnalysis(rawValue: $0.value) {
                      return value != .inBed && value != .awake
                  }
                  return false
              }) else {
            return (0, 0, 0)
        }
        
        let remLatency = firstREM.startDate.timeIntervalSince(sleepStart.startDate)
        let totalRemTime = remSamples.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
        let remDensity = totalRemTime / calculateTotalSleepTime([:])
        
        var remFragments = 0
        for i in 1..<remSamples.count {
            let timeBetweenREM = remSamples[i].startDate.timeIntervalSince(remSamples[i-1].endDate)
            if timeBetweenREM > 0 {
                remFragments += 1
            }
        }
        
        let remFragmentation = Double(remFragments) / Double(remSamples.count)
        
        return (remLatency, remDensity, remFragmentation)
    }
    
    private func calculateSleepRegularity(onsetTimes: [Date], wakeTimes: [Date]) -> Double {
        // Calculate standard deviation of onset times and wake times
        let onsetSD = calculateTimeStandardDeviation(onsetTimes)
        let wakeSD = calculateTimeStandardDeviation(wakeTimes)
        
        // Normalize and combine (lower is more regular)
        let maxSD: TimeInterval = 4 * 3600 // 4 hours as max SD
        let normalizedScore = 1 - ((onsetSD + wakeSD) / (2 * maxSD))
        return max(0, min(1, normalizedScore)) * 100
    }
    
    private func calculateTimeStandardDeviation(_ dates: [Date]) -> TimeInterval {
        guard dates.count > 1 else { return 0 }
        
        // Convert to seconds from midnight
        let secondsFromMidnight: [TimeInterval] = dates.map {
            let components = Calendar.current.dateComponents([.hour, .minute, .second], from: $0)
            return TimeInterval(components.hour ?? 0) * 3600 +
            TimeInterval(components.minute ?? 0) * 60 +
            TimeInterval(components.second ?? 0)
        }
        
        let mean = secondsFromMidnight.reduce(0, +) / Double(secondsFromMidnight.count)
        let sumSquaredDiff = secondsFromMidnight.reduce(0) { $0 + pow($1 - mean, 2) }
        return sqrt(sumSquaredDiff / Double(secondsFromMidnight.count - 1))
    }
    
    // MARK: - Activity Metrics
    private func fetchActivityMetrics(start: Date, end: Date) async throws -> ActivityMetrics {
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let hourlySteps = try await queryHourlySteps(type: stepType, start: start, end: end)
        
        let (l5, m10) = calculateL5M10(hourlySteps: hourlySteps)
        let ra = calculateRelativeAmplitude(l5Activity: l5.activity, m10Activity: m10.activity)
        let iv = calculateIntradailyVariability(hourlySteps: hourlySteps)
        
        return ActivityMetrics(
            l5Onset: l5.onset,
            l5Activity: l5.activity,
            m10Onset: m10.onset,
            m10Activity: m10.activity,
            relativeAmplitude: ra,
            intradailyVariability: iv
        )
    }

    private func queryHourlySteps(type: HKQuantityType, start: Date, end: Date) async throws -> [(Date, Double)] {
            try await withCheckedThrowingContinuation { continuation in
                let interval = DateComponents(hour: 1)
                let query = HKStatisticsCollectionQuery(
                    quantityType: type,
                    quantitySamplePredicate: nil,
                    options: .cumulativeSum,
                    anchorDate: start,
                    intervalComponents: interval
                )
                
                query.initialResultsHandler = { query, results, error in
                    if let error = error {
                        continuation.resume(throwing: error)
                        return
                    }
                    
                    var hourlySteps: [(Date, Double)] = []
                    results?.enumerateStatistics(from: start, to: end) { statistics, _ in
                        if let sum = statistics.sumQuantity() {
                            let steps = sum.doubleValue(for: HKUnit.count())
                            hourlySteps.append((statistics.startDate, steps))
                        }
                    }
                    
                    continuation.resume(returning: hourlySteps)
                }
                
                healthStore.execute(query)
            }
        }
    
    // MARK: - Real-time Calculations
    private func calculateHRV() -> Double {
        var differences: [Double] = []
        
        for i in 1..<heartRateBuffer.count {
            let currentTimestamp = ISO8601DateFormatter().date(from: heartRateBuffer[i].timestamp)!
            let previousTimestamp = ISO8601DateFormatter().date(from: heartRateBuffer[i-1].timestamp)!
            
            let timeDiff = currentTimestamp.timeIntervalSince(previousTimestamp)
            if timeDiff < 2.0 {
                let diff = abs(heartRateBuffer[i].value - heartRateBuffer[i-1].value)
                differences.append(diff)
            }
        }
        
        guard !differences.isEmpty else { return 0 }
        
        let squaredDiffs = differences.map { $0 * $0 }
        let meanSquaredDiff = squaredDiffs.reduce(0, +) / Double(squaredDiffs.count)
        return sqrt(meanSquaredDiff)
    }
    
    private func calculateAgitationScore(_ motionValue: Double) -> Double {
        return abs(motionValue) / 9.81  // Normalize by gravity
    }
    
    
    // MARK: - Activity Patterns
    private func calculateL5M10(hourlySteps: [(date: Date, steps: Double)]) -> (l5: (onset: Date, activity: Double), m10: (onset: Date, activity: Double)) {
        let hours = 24
        let sortedSteps = hourlySteps.sorted { $0.date < $1.date }
        
        var bestL5: (onset: Date, activity: Double) = (Date(), Double.infinity)
        var bestM10: (onset: Date, activity: Double) = (Date(), 0)
        
        // Sliding window for L5 (5 hours)
        for i in 0...(hours - 5) {
            let window = Array(sortedSteps[i..<(i+5)])
            let activity = window.reduce(0.0) { $0 + $1.steps }
            if activity < bestL5.activity {
                bestL5 = (window[0].date, activity)
            }
        }
        
        // Sliding window for M10 (10 hours)
        for i in 0...(hours - 10) {
            let window = Array(sortedSteps[i..<(i+10)])
            let activity = window.reduce(0.0) { $0 + $1.steps }
            if activity > bestM10.activity {
                bestM10 = (window[0].date, activity)
            }
        }
        
        return (bestL5, bestM10)
    }
    
    // MARK: - Circadian Rhythm Metrics
    private func calculateRelativeAmplitude(l5Activity: Double, m10Activity: Double) -> Double {
        guard l5Activity >= 0, m10Activity >= 0 else { return 0 }
        
        return (m10Activity - l5Activity) / (m10Activity + l5Activity)
    }
    
    
    private func calculateIntradailyVariability(hourlySteps: [(date: Date, steps: Double)]) -> Double {
           // Calculate hour-to-hour changes
           var hourlyChanges = 0.0
           let sorted = hourlySteps.sorted { $0.date < $1.date }
           
           for i in 1..<sorted.count {
               let diff = abs(sorted[i].steps - sorted[i-1].steps)
               hourlyChanges += diff * diff
           }
           
           let mean = sorted.reduce(0.0) { $0 + $1.steps } / Double(sorted.count)
           let totalVariance = sorted.reduce(0.0) { $0 + pow($1.steps - mean, 2) }
           
           return hourlyChanges / totalVariance
       }
    
    
    // MARK: - Data Collection and Server Communication
    func collectAllMetrics(timestamp: String) async throws -> [String: Any] {
            let now = Date()
            let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: now)!

            // Fetch sleep and activity metrics concurrently.
            async let sleepMetrics = fetchSleepMetrics(start: yesterday, end: now)
            async let activityMetrics = fetchActivityMetrics(start: yesterday, end: now)
            let (sleep, activity) = try await (sleepMetrics, activityMetrics)

            // Build patientInfo dictionary.
            let patientInfo: [String: Any] = [
                "id": "DEMO_123",
                "email": "demo@example.com",
                "name": "Demo Patient"
            ]

            // Create realtime heart rate data.
            let heartRateReadings = heartRateBuffer.map { reading -> [String: Any] in
                return [
                    "value": reading.value,
                    "timestamp": reading.timestamp
                ]
            }
            let averageHR = heartRateBuffer.map(\.value).reduce(0, +) / Double(heartRateBuffer.count)
            let realtimeHeartRate: [String: Any] = [
                "readings": heartRateReadings,
                "hrv": calculateHRV(),
                "averageHR": averageHR
            ]

            // Create realtime agitation data.
            let agitationReadings = agitationBuffer.map { reading -> [String: Any] in
                return [
                    "value": reading.value,
                    "timestamp": reading.timestamp
                ]
            }
            let averageAgitation = agitationBuffer.map(\.value).reduce(0, +) / Double(agitationBuffer.count)
            let realtimeAgitation: [String: Any] = [
                "readings": agitationReadings,
                "averageScore": averageAgitation
            ]

            // Build realtime metrics dictionary.
            let realtimeMetrics: [String: Any] = [
                "heartRate": realtimeHeartRate,
                "agitation": realtimeAgitation
            ]

            // Process sleep stages mapping.
            let stageMapping = sleep.sleepStages.mapKeys { stage in
                switch stage {
                    case .inBed:       return "inBed"
                    case .asleep:      return "asleep"
                    case .awake:       return "awake"
                    case .asleepCore:  return "core"
                    case .asleepDeep:  return "deep"
                    case .asleepREM:   return "rem"
                    @unknown default:  return "unknown"
                }
            }

            // Build sleep metrics dictionary.
            let sleepMetricsDict: [String: Any] = [
                "totalSleepTime": sleep.totalSleepTime,
                "timeInBed": sleep.timeInBed,
                "waso": sleep.waso,
                "sleepEfficiency": sleep.sleepEfficiency,
                "sleepOnsetLatency": sleep.sleepOnsetLatency,
                "transitions": sleep.stageTransitions,
                "briefAwakenings": sleep.briefAwakenings,
                "remLatency": sleep.remLatency,
                "remDensity": sleep.remDensity,
                "remFragmentation": sleep.remFragmentation,
                "sleepRegularity": sleep.sleepRegularity,
                "stages": stageMapping
            ]

            // Build activity metrics dictionary.
            let activityMetricsDict: [String: Any] = [
                "l5": [
                    "onset": ISO8601DateFormatter().string(from: activity.l5Onset),
                    "activity": activity.l5Activity
                ],
                "m10": [
                    "onset": ISO8601DateFormatter().string(from: activity.m10Onset),
                    "activity": activity.m10Activity
                ],
                "relativeAmplitude": activity.relativeAmplitude,
                "intradailyVariability": activity.intradailyVariability
            ]

            // Finally, build the final payload.
            let payload: [String: Any] = [
//                "patientInfo": patientInfo,
                "timestamp": timestamp
//                ,
//                "realtimeMetrics": realtimeMetrics,
//                "sleepMetrics": sleepMetricsDict,
//                "activityMetrics": activityMetricsDict
            ]

            return payload
    }
           
           private func sendToServer(_ payload: [String: Any]) async throws {
               print("hello")
//               guard let url = URL(string: "YOUR_API_ENDPOINT") else {
//                   throw URLError(.badURL)
//               }
               print(payload)
//
//               var request = URLRequest(url: url)
//               request.httpMethod = "POST"
//               request.setValue("application/json", forHTTPHeaderField: "Content-Type")
               
//               let jsonData = try JSONSerialization.data(withJSONObject: payload)
//               request.httpBody = jsonData
//
//               print(jsonData)
//
//               let (_, response) = try await URLSession.shared.data(for: request)
//               guard let httpResponse = response as? HTTPURLResponse,
//                     (200...299).contains(httpResponse.statusCode) else {
//                   throw URLError(.badServerResponse)
//               }
           }
           
       }

// MARK: - Helper Extensions
extension Dictionary {
    func mapKeys<T>(_ transform: (Key) throws -> T) rethrows -> [T: Value] {
        var result: [T: Value] = [:]
        for (key, value) in self {
            result[try transform(key)] = value
        }
        return result
    }
}
