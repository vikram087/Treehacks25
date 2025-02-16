import { useEffect, useState } from "react";
import "./index.css";
import { Users, Brain, Video, AlertTriangle } from "lucide-react";
import NavDropdown from "./components/NavDropdown";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { useNavigate } from "react-router-dom";

function Dashboard() {
	const [patientData, setPatientData] = useState([]);
	const [patients, setPatients] = useState({});
	const [selectedPatient, setSelectedPatient] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(
					`${import.meta.env.VITE_BACKEND_URL}/fetch-patient-data/patient_records`,
				);

				const data = await res.json();
				setPatientData(data.data);
				setPatients(
					data.data.reduce((acc, doc) => {
						acc[doc.metadata.user_id] = doc.metadata;
						return acc;
					}, {}),
				);
			} catch (error) {
				console.error(error);
			}
		};
		fetchData();
	}, []);

	const heartRateData = patientData
		.filter((doc) => doc.document?.["bio-data"]?.heart_rate !== undefined)
		.map((doc) => doc.document["bio-data"].heart_rate);

	const graphData = {
		labels: patientData.map((doc) =>
			new Date(doc.timestamp).toLocaleDateString(),
		),
		datasets: [
			{
				label: "Heart Rate (BPM)",
				data: heartRateData,
				borderColor: "#3b82f6",
				backgroundColor: "rgba(59, 130, 246, 0.2)",
			},
		],
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<NavDropdown patients={patients} />

			<main className="container mx-auto px-6 py-8">
				{/* Welcome Section */}
				<div className="mb-10">
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						Welcome back, Dr. Vikram
					</h2>
					<p className="text-gray-600">
						Here's what needs your attention today
					</p>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-blue-50 rounded-lg">
								<Users className="text-blue-600" size={24} />
							</div>
							<span className="text-sm font-medium text-blue-600">Today</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">
							{Object.keys(patients).length}
						</p>
						<p className="text-sm text-gray-600">Active Patients</p>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-purple-50 rounded-lg">
								<Brain className="text-purple-600" size={24} />
							</div>
							<span className="text-sm font-medium text-purple-600">New</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">
							{patientData.length}
						</p>
						<p className="text-sm text-gray-600">Assessment Results</p>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-red-50 rounded-lg">
								<AlertTriangle className="text-red-600" size={24} />
							</div>
							<span className="text-sm font-medium text-red-600">Critical</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">
							{
								Object.values(patients).filter(
									(patient) =>
										!patient.status ||
										patient.status.toLowerCase() === "critical",
								).length
							}
						</p>
						<p className="text-sm text-gray-600">Critical Patients</p>
					</div>
				</div>
			</main>

			<main className="container mx-auto px-6 py-8">
				<h2 className="text-3xl font-bold text-gray-900 mb-4">Patient Table</h2>
				<table className="min-w-full bg-white border border-gray-200">
					<thead>
						<tr className="bg-gray-100">
							<th className="px-4 py-2">Name</th>
							<th className="px-4 py-2">Email</th>
							<th className="px-4 py-2">Status</th>
							<th className="px-4 py-2">Schedule</th>
						</tr>
					</thead>
					<tbody>
						{Object.values(patients).map((patient) => (
							<tr
								key={patient.user_id}
								className={`border-t ${!patient.status || patient.status.toLowerCase() === "critical" ? "bg-red-100 text-red-600" : ""}`}
							>
								<td
									className="px-4 py-2 cursor-pointer"
									onClick={() => navigate(`/dash/${patient.user_id}`)}
								>
									{patient.name}
								</td>
								<td className="px-4 py-2">
									<a href={`mailto:${patient.email}`}>{patient.email}</a>
								</td>
								<td className="px-4 py-2 font-semibold">
									{patient.status || "Critical"}
								</td>
								<td className="px-4 py-2 text-center">
									<button
										className="text-blue-500 hover:text-blue-700"
										onClick={() =>
											alert(`Starting Zoom meeting for ${patient.name}`)
										}
									>
										<Video size={20} />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<h2 className="text-3xl font-bold text-gray-900 mt-8 mb-4">
					Biometric Data
				</h2>
				<select
					onChange={(e) => setSelectedPatient(patients[e.target.value])}
					className="px-3 py-2 border border-gray-300 rounded"
				>
					<option value="">Select a Patient</option>
					{Object.values(patients).map((patient) => (
						<option key={patient.user_id} value={patient.user_id}>
							{patient.name}
						</option>
					))}
				</select>

				<div className="mt-4">
					{selectedPatient ? (
						<Line data={graphData} />
					) : (
						<p className="text-gray-600">
							Select a patient to view biometric data.
						</p>
					)}
				</div>
			</main>
		</div>
	);
}

export default Dashboard;
