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
	const [loading, setLoading] = useState(false);
	const { id } = useParams();
	const navigate = useNavigate();

	const heartRateData = patientData
		.filter((doc) => doc.document?.["bio-data"]?.heart_rate !== undefined)
		.map((doc) => doc.document["bio-data"].heart_rate);

	const stepsData = patientData
		.filter((doc) => doc.document?.["bio-data"]?.steps !== undefined)
		.map((doc) => doc.document["bio-data"].steps);

	const graphData = {
		heartRate: {
			labels: patientData.map((doc) =>
				new Date(doc.document.timestamp).toLocaleDateString(),
			),
			datasets: [
				{
					label: "Heart Rate (BPM)",
					data: heartRateData,
					borderColor: "#3b82f6",
					backgroundColor: "rgba(59, 130, 246, 0.2)",
				},
			],
		},
		steps: {
			labels: patientData.map((doc) =>
				new Date(doc.document.timestamp).toLocaleDateString(),
			),
			datasets: [
				{
					label: "Steps",
					data: stepsData,
					borderColor: "#10b981",
					backgroundColor: "rgba(16, 185, 129, 0.2)",
				},
			],
		},
	};
	console.log(graphData);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`${import.meta.env.VITE_BACKEND_URL}/fetch-patient-data/patient_records`,
				);
				const data = await res.json();
				const thisPatientData = data.data.filter(
					(doc) => doc.metadata.user_id === id,
				);
				console.log(thisPatientData);
				setPatientData(thisPatientData);
				setPatientMeta(thisPatientData[0].metadata);
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
								{
									Object.values(patientData).map(
										(patient) =>
											!patient.status ||
											patient.status === "" ||
											patient.status.toLowerCase() === "critical",
									).length
								}
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

						<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
							<div className="p-6 h-full grid grid-rows-[auto_1fr_auto]">
								<div className="flex items-center justify-between mb-6">
									<div className="flex items-center space-x-3">
										<div className="p-2 bg-green-50 rounded-lg">
											<Activity className="text-green-600" size={24} />
										</div>
										<h3 className="text-lg font-semibold text-gray-900">
											Recent Health Metrics
										</h3>
									</div>
								</div>
								<div className="space-y-4">
									<div className="p-4 bg-gray-50 rounded-lg">
										<div className="flex items-center justify-between mb-2">
											<p className="font-medium text-gray-900">Anxiety Level</p>
											<div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
												<div className="w-1/2 h-full bg-amber-500"></div>
											</div>
										</div>
										<div className="flex justify-between items-center">
											<p className="text-sm text-gray-600">Moderate</p>
										</div>
									</div>
									<div className="p-4 bg-gray-50 rounded-lg">
										<div className="flex items-center justify-between mb-2">
											<p className="font-medium text-gray-900">
												Depression Scale
											</p>
											<div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
												<div className="w-1/4 h-full bg-green-500"></div>
											</div>
										</div>
										<div className="flex justify-between items-center">
											<p className="text-sm text-gray-600">Low</p>
										</div>
									</div>
									<div className="p-4 bg-gray-50 rounded-lg">
										<div className="flex items-center justify-between mb-2">
											<p className="font-medium text-gray-900">Sleep Quality</p>
											<div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
												<div className="w-3/4 h-full bg-blue-500"></div>
											</div>
										</div>
										<div className="flex justify-between items-center">
											<p className="text-sm text-gray-600">Good</p>
										</div>
									</div>
								</div>
								<button
									type="button"
									className="w-full flex items-center justify-between px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-colors mt-6"
								>
									<span>View Detailed Metrics</span>
									<ChevronRight size={20} />
								</button>
							</div>
						</div>
					</div>

					{/* <div className="bg-white rounded-xl shadow-sm p-6 pb-8 border border-gray-100">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-blue-50 rounded-lg">
								<Activity className="text-blue-600" size={24} />
							</div>
							<h3 className="text-lg font-semibold text-gray-900">
								Mood Tracking
							</h3>
						</div>
						<div className="text-sm text-gray-500">Last 9 months</div>
					</div>
					<div className="h-64 w-full">
						<div className="relative h-full">
							<div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-sm text-gray-600">
								{["+4", "+3", "+2", "+1", "0", "-1", "-2", "-3", "-4"].map(
									(label, index) => (
										<div key={label} className="relative h-0">
											<span className="absolute -translate-y-1/2 right-2">
												{label}
											</span>
										</div>
									),
								)}
							</div>

							<div className="ml-12 h-full relative">
								{["+4", "+3", "+2", "+1", "0", "-1", "-2", "-3", "-4"].map(
									(label, index) => (
										<div
											key={label}
											className="absolute w-full border-t border-gray-100"
											style={{
												top: `${(index / 8) * 100}%`,
											}}
										/>
									),
								)}

								<div className="absolute inset-0 border-b border-l border-gray-200">
									<svg className="absolute inset-0 w-full h-full">
										{[
											{ month: "Jan", value: -2 },
											{ month: "Feb", value: 1 },
											{ month: "Mar", value: 0 },
											{ month: "Apr", value: 1 },
											{ month: "May", value: -1 },
											{ month: "Jun", value: 0 },
											{ month: "Jul", value: -3 },
											{ month: "Aug", value: -2 },
											{ month: "Sep", value: 0 },
										].map((point, index, array) => {
											if (index === array.length - 1) return null;

											const x1 = `${(index / (array.length - 1)) * 100}%`;
											const x2 = `${((index + 1) / (array.length - 1)) * 100}%`;
											const y1 = `${50 - point.value * 12.5}%`;
											const y2 = `${50 - array[index + 1].value * 12.5}%`;

											return (
												<line
													key={point.month}
													x1={x1}
													y1={y1}
													x2={x2}
													y2={y2}
													stroke="#3B82F6"
													strokeWidth="2"
												/>
											);
										})}
									</svg>
									{[
										{ month: "Jan", value: -2 },
										{ month: "Feb", value: 1 },
										{ month: "Mar", value: 0 },
										{ month: "Apr", value: 1 },
										{ month: "May", value: -1 },
										{ month: "Jun", value: 0 },
										{ month: "Jul", value: -3 },
										{ month: "Aug", value: -2 },
										{ month: "Sep", value: 0 },
									].map((point, index, array) => (
										<div
											key={point.month}
											className="absolute h-3 w-3 bg-blue-500 rounded-full z-10"
											style={{
												left: `${(index / (array.length - 1)) * 100}%`,
												top: `${50 - point.value * 12.5}%`,
												transform: "translate(-50%, -50%)",
											}}
										/>
									))}
								</div>
							</div>

							<div className="ml-12 flex justify-between mt-2 mb-4 text-sm text-gray-600">
								{[
									"Jan",
									"Feb",
									"Mar",
									"Apr",
									"May",
									"Jun",
									"Jul",
									"Aug",
									"Sep",
								].map((month) => (
									<span key={month}>{month}</span>
								))}
							</div>
						</div>
					</div>
				</div> */}
					<BiometricGraph graphDataSets={graphData} />
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
