import { useState } from "react";
import { Line } from "react-chartjs-2";

/**
 * Expects graphDataSets to be an object like:
 * {
 *   hrv: {
 *     labels: [...timestamps...],
 *     datasets: [
 *       {
 *         label: "HRV",
 *         data: [...values...],
 *         borderColor: "#ef4444",
 *         backgroundColor: "rgba(239, 68, 68, 0.2)",
 *         fill: false,
 *         tension: 0.1,
 *       }
 *     ]
 *   },
 *   agitation: {
 *     labels: [...],
 *     datasets: [
 *       {
 *         label: "Agitation",
 *         data: [...],
 *         // styling
 *       }
 *     ]
 *   }
 * }
 */
function BiometricGraph({ graphDataSets = {} }) {
	// Default to first metric key if available, else "hrv" or "heartRate"
	const defaultMetric = Object.keys(graphDataSets)[0] || "hrv";
	const [activeMetric, setActiveMetric] = useState(defaultMetric);

	// Use fallback { labels: [], datasets: [] } if activeMetric not found
	const activeData = graphDataSets[activeMetric] || {
		labels: [],
		datasets: [],
	};

	return (
		<section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-8">
			<h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-3">
				<span className="text-blue-600">📊</span>
				<span>Biometric Data</span>
			</h2>

			{/* Metric Tabs */}
			<div className="flex space-x-4 mb-4">
				{Object.keys(graphDataSets).map((metric) => (
					<button
						key={metric}
						onClick={() => setActiveMetric(metric)}
						className={`px-3 py-1 rounded-lg text-sm font-medium ${
							activeMetric === metric
								? "bg-blue-600 text-white"
								: "bg-gray-200 text-gray-800"
						}`}
					>
						{/* Convert camelCase to spaced words, e.g. hrv -> Hrv */}
						{metric.replace(/([A-Z])/g, " $1").trim()}
					</button>
				))}
			</div>

			{/* Chart Display */}
			<div
				className="bg-gray-50 border border-gray-300 rounded-lg p-2"
				style={{ height: "350px" }}
			>
				<Line
					data={activeData}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								display: true,
								position: "top",
							},
						},
						scales: {
							x: {
								grid: { color: "#e5e7eb" },
								// Show timestamps or date strings
								title: {
									display: true,
									text: "Time",
									font: { size: 12, weight: "bold" },
								},
							},
							y: {
								grid: { color: "#e5e7eb" },
								title: {
									display: true,
									text: `${activeMetric} Data`,
									font: { size: 10, weight: "bold" },
								},
							},
						},
					}}
				/>
			</div>
		</section>
	);
}

export default BiometricGraph;
