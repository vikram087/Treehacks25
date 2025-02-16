import React, { useEffect, useState } from "react";
import {
	User,
	Mail,
	Clock,
	AlertCircle,
	Activity,
	ChevronRight,
} from "lucide-react";
import { useParams } from "react-router-dom";
import PatientRecords from "./components/PatientRecords";
import ChatBot from "./components/ChatBot";
import BiometricGraph from "./components/BiometricGraph";
import Loader from "./components/Loader";
import { useNavigate } from "react-router-dom";

function PatientProfile() {
	const [patientData, setPatientData] = useState([]);
	const [patientMeta, setPatientMeta] = useState({});
	const [sleepData, setSleepData] = useState({});
	const [activityVals, setActivityValues] = useState({});
	const [hrvValues, setHrv] = useState({});
	const [aValues, setA] = useState({});
	const [loading, setLoading] = useState(false);
	const [crisisPlan, setCrisisPlan] = useState(null);
	const { id } = useParams();
	const navigate = useNavigate();

	const sleepChartData = {
		labels: sleepData.time, // x-axis
		datasets: [
			{
				label: "REM Sleep (hrs)",
				data: sleepData.rem,
				borderColor: "#3b82f6", // e.g. Blue
				backgroundColor: "rgba(59,130,246,0.2)",
				fill: false,
				tension: 0.1,
			},
			{
				label: "Deep Sleep (hrs)",
				data: sleepData.deep,
				borderColor: "#10b981", // e.g. Green
				backgroundColor: "rgba(16,185,129,0.2)",
				fill: false,
				tension: 0.1,
			},
			{
				label: "Total Sleep (hrs)",
				data: sleepData.total,
				borderColor: "#f59e0b", // e.g. Amber
				backgroundColor: "rgba(245,158,11,0.2)",
				fill: false,
				tension: 0.1,
			},
			{
				label: "Awake Time (hrs)",
				data: sleepData.awake,
				borderColor: "#f59e0b", // e.g. Amber
				backgroundColor: "rgba(245,158,11,0.2)",
				fill: false,
				tension: 0.1,
			},
			// possibly 'awakeTime' or 'sleepQualityScore' as more lines
		],
	};

	const activityScoreChartData = {
		labels: activityVals.time,
		datasets: [
			{
				label: "Activity Score",
				data: activityVals.score,
				borderColor: "#3b82f6", // e.g., blue
				backgroundColor: "rgba(59,130,246,0.2)",
				fill: false,
				tension: 0.1,
			},
		],
	};

	const caloriesChartData = {
		labels: activityVals.time,
		datasets: [
			{
				label: "Calories Burned",
				data: activityVals.cals,
				borderColor: "#f59e0b", // e.g., amber
				backgroundColor: "rgba(245,158,11,0.2)",
				fill: false,
				tension: 0.1,
			},
		],
	};

	const stepsChartData = {
		labels: activityVals.time,
		datasets: [
			{
				label: "Steps",
				data: activityVals.steps,
				borderColor: "#10b981", // e.g., green
				backgroundColor: "rgba(16,185,129,0.2)",
				fill: false,
				tension: 0.1,
			},
		],
	};

	const chartData = {
		hrv: {
			labels: hrvValues.time,
			datasets: [
				{
					label: "HRV",
					data: hrvValues.vals,
					borderColor: "#ef4444",
					backgroundColor: "rgba(239, 68, 68, 0.2)",
					fill: false,
					tension: 0.1,
				},
			],
		},
		agitation: {
			labels: aValues.time,
			datasets: [
				{
					label: "agitation",
					data: aValues.vals,
					borderColor: "#ef4444",
					backgroundColor: "rgba(239, 68, 68, 0.2)",
					fill: false,
					tension: 0.1,
				},
			],
		},
		sleep: sleepChartData,
		activityScore: activityScoreChartData,
		caloriesBurned: caloriesChartData,
		steps: stepsChartData,
	};

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`${import.meta.env.VITE_BACKEND_URL}/get-user/${id}`,
				);
				const data = await res.json();

				setPatientMeta({
					user_id: data.data.user_id,
					name: data.data.name,
					email: data.data.email,
				});
				setPatientData(data.data.patient_records);

				const hTimestamps = Object.keys(data.data.hrv);
				hTimestamps.sort();
				const hrvValues = hTimestamps.map((ts) => data.data.hrv[ts]);
				setHrv({ vals: hrvValues, time: hTimestamps });

				const aTimestamps = Object.keys(data.data.agitation);
				aTimestamps.sort();
				const aValues = aTimestamps.map((ts) => data.data.agitation[ts]);
				setA({ vals: aValues, time: aTimestamps });

				data.data.sleep_metrics.sort(
					(a, b) => new Date(a.timestamp) - new Date(b.timestamp),
				);

				const timeLabels = data.data.sleep_metrics.map((row) => row.timestamp);

				const remValues = data.data.sleep_metrics.map(
					(row) => row.remSleepHours,
				);
				const deepValues = data.data.sleep_metrics.map(
					(row) => row.deepSleepHours,
				);
				const totalValues = data.data.sleep_metrics.map(
					(row) => row.totalSleepHours,
				);
				const awakeValues = data.data.sleep_metrics.map((row) => row.awakeTime);

				setSleepData({
					time: timeLabels,
					rem: remValues,
					deep: deepValues,
					total: totalValues,
					awake: awakeValues,
				});

				data.data.activity_metrics.sort(
					(a, b) => new Date(a.timestamp) - new Date(b.timestamp),
				);

				// Build arrays
				const activityTimeLabels = data.data.activity_metrics.map(
					(row) => row.timestamp,
				);
				const activityScoreValues = data.data.activity_metrics.map(
					(row) => row.activityScore,
				);
				const caloriesValues = data.data.activity_metrics.map(
					(row) => row.caloriesBurned,
				);
				const stepsValues = data.data.activity_metrics.map((row) => row.steps);

				setActivityValues({
					time: activityTimeLabels,
					score: activityScoreValues,
					cals: caloriesValues,
					steps: stepsValues,
				});

				const crisisRes = await fetch(
					`${import.meta.env.VITE_BACKEND_URL}/api/generate-crisis-plan`, {
						method: "POST",
						headers: {"Content-Type": "application/json"},
						body: JSON.stringify({biometric_data: data.data, behavioral_summary: data.data.patient_records})
					}
				);
				const crisisData = await crisisRes.json();
   
				if (crisisData.success) {
					setCrisisPlan(crisisData.crisis_plan);
				}
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	return (
		<>
			{loading && <Loader />}
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
				{/* Top Navigation Bar */}
				<nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
					<div className="flex items-center">
						<button
							type="button"
							onClick={() => navigate(-1)}
							className="px-4 mr-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-400 rounded-full hover:from-blue-600 hover:to-blue-500 shadow-md transition-all flex items-center space-x-2"
						>
							<svg
								className="w-5 h-5 text-white"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15 19l-7-7 7-7"
								></path>
							</svg>
						</button>

						<h1 className="text-xl font-semibold text-gray-800">
							Patient Profile
						</h1>
					</div>
				</nav>

				<main className="container mx-auto px-6 py-8">
					{/* Patient Header and Quick Stats Row */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
						{/* Patient Header - Takes up 2 columns */}
						<div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
							<div className="flex items-start justify-between">
								<div className="flex items-center space-x-4">
									<div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
										<User size={40} className="text-blue-600" />
									</div>
									<div>
										<h2 className="text-2xl font-bold text-gray-900">
											{patientMeta.name}
										</h2>
										<p className="text-gray-600">
											Patient ID: {patientMeta.user_id}
										</p>
										<div className="flex space-x-4 mt-2">
											<span className="flex items-center text-sm text-gray-500">
												<Mail size={16} className="mr-1" />
												{patientMeta.email}
											</span>
										</div>
									</div>
								</div>
								<div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
									Active Patient
								</div>
							</div>
						</div>

						{/* Alerts - Takes up 1 column */}
						<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
							<div className="flex items-center justify-between mb-4">
								<div className="p-2 bg-red-50 rounded-lg">
									<AlertCircle className="text-red-600" size={24} />
								</div>
								<span className="text-sm font-medium text-red-600">
									Critical Alerts
								</span>
							</div>
							<p className="text-2xl font-bold text-gray-900 mb-1">
								{patientData.length}
							</p>
							<p className="text-sm text-gray-600">
								There are {patientData.length} concerning assessments from{" "}
								{patientMeta.name}
							</p>
						</div>

						<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
							<div className="flex items-center justify-between mb-4">
								<div className="p-2 bg-green-50 rounded-lg">
									<Clock className="text-green-600" size={24} />
								</div>
								<span className="text-sm font-medium text-green-600">
									Next Session
								</span>
							</div>
							<p className="text-2xl font-bold text-gray-900 mb-1">Mar 15</p>
							<p className="text-sm text-gray-600">2:30 PM</p>
						</div>
					</div>

					<div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
						<PatientRecords patientData={patientData} />

						<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								AI Recommended Crisis Plan
							</h3>


							{!crisisPlan ? (
								<p className="text-sm text-red-500">
									Crisis plan data not found. Check console logs.
								</p>
							) : (
								<div className="space-y-4 p-4 bg-gray-50 rounded-lg max-h-[400px] overflow-y-auto">
									{/* Current State Analysis */}
									<p className="font-medium text-gray-900">Classification:</p>
									<p className="text-sm text-gray-600">{crisisPlan.current_state_analysis?.classification || "N/A"}</p>


									<p className="font-medium text-gray-900">Confidence Level:</p>
									<p className="text-sm text-gray-600">{crisisPlan.current_state_analysis?.confidence_level || "N/A"}%</p>


									<p className="font-medium text-gray-900">Additional Data Needed:</p>
									<p className="text-sm text-gray-600">{crisisPlan.current_state_analysis?.additional_data_needed || "N/A"}</p>


									{/* Therapist Actions */}
									<p className="font-medium text-gray-900">Therapist Actions:</p>
									<ul className="list-disc list-inside text-sm text-gray-600">
										{Array.isArray(crisisPlan.intervention_suggestions?.therapist_actions) ? (
											crisisPlan.intervention_suggestions.therapist_actions.length > 0 ? (
												crisisPlan.intervention_suggestions.therapist_actions.map((action, index) => (
													<li key={index}>{action}</li>
												))
											) : (
												<li>N/A</li>
											)
										) : (
											<li></li>
										)}
									</ul>


									{/* Coping Mechanisms */}
									<p className="font-medium text-gray-900">Coping Mechanisms:</p>
									<ul className="list-disc list-inside text-sm text-gray-600">
										{Array.isArray(crisisPlan.intervention_suggestions?.coping_mechanisms) ? (
											crisisPlan.intervention_suggestions.coping_mechanisms.length > 0 ? (
												crisisPlan.intervention_suggestions.coping_mechanisms.map((mechanism, index) => (
													<li key={index}>{mechanism}</li>
												))
											) : (
												<li>N/A</li>
											)
										) : (
											<li></li>
										)}
									</ul>


									{/* Monitoring Strategies */}
									<p className="font-medium text-gray-900">Monitoring Strategies:</p>
									<ul className="list-disc list-inside text-sm text-gray-600">
										{Array.isArray(crisisPlan.intervention_suggestions?.monitoring_strategies) ? (
											crisisPlan.intervention_suggestions.monitoring_strategies.length > 0 ? (
												crisisPlan.intervention_suggestions.monitoring_strategies.map((strategy, index) => (
													<li key={index}>{strategy}</li>
												))
											) : (
												<li>N/A</li>
											)
										) : (
											<li></li>
										)}
									</ul>




									{/* AI-Generated Crisis Plan */}
									<p className="font-medium text-gray-900">Medication Review:</p>
									<p className="text-sm text-gray-600">{crisisPlan.ai_generated_crisis_plan?.medication_review || "N/A"}</p>


									<p className="font-medium text-gray-900">Physical Activity Recommendation:</p>
									<p className="text-sm text-gray-600">{crisisPlan.ai_generated_crisis_plan?.physical_activity || "N/A"}</p>


									<p className="font-medium text-gray-900">Sleep Adjustments:</p>
									<p className="text-sm text-gray-600">{crisisPlan.ai_generated_crisis_plan?.sleep_adjustments || "N/A"}</p>


									<p className="font-medium text-gray-900">Social Engagement Recommendation:</p>
									<p className="text-sm text-gray-600">{crisisPlan.ai_generated_crisis_plan?.social_engagement || "N/A"}</p>


									{/* Risk Alerts */}
									<p className="font-medium text-gray-900">Risk Alerts:</p>
									<ul className="list-disc list-inside text-sm text-red-600">
										{Array.isArray(crisisPlan.ai_generated_crisis_plan?.risk_alerts) && crisisPlan.ai_generated_crisis_plan.risk_alerts.length > 0
											? crisisPlan.ai_generated_crisis_plan.risk_alerts.map((alert, index) => (
												<li key={index}>{alert}</li>
											))
											: <li>No risk alerts.</li>}
									</ul>
								</div>
							)}
							</div>
					</div>

					<BiometricGraph graphDataSets={chartData} />
					<ChatBot
						conversationChain={patientData.map(
							(data) => data?.document?.history,
						)}
					/>
				</main>
			</div>
		</>
	);
}

export default PatientProfile;
