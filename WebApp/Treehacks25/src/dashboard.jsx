import { useEffect, useState } from "react";
import "./index.css";
import { Users, Brain, Video, AlertTriangle } from "lucide-react";
import NavDropdown from "./components/NavDropdown";
import "chart.js/auto";
import { useNavigate } from "react-router-dom";
import Loader from "./components/Loader";
import ChatBot from "./components/ChatBot";

function Dashboard() {
	const [patientData, setPatientData] = useState([]);
	const [patients, setPatients] = useState([{}]);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				const convoRes = await fetch(
					`${import.meta.env.VITE_BACKEND_URL}/fetch-patient-data/patient_records`,
				);
				const convoData = await convoRes.json();
				setPatientData(convoData.data);

				const patientRes = await fetch(
					`${import.meta.env.VITE_BACKEND_URL}/fetch-patient-data/patients`,
				);

				const pData = await patientRes.json();

				setPatients(pData.data);
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
								{patients.length}
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
								<span className="text-sm font-medium text-red-600">
									Critical
								</span>
							</div>
							<p className="text-2xl font-bold text-gray-900 mb-1">
								{patients.length}
							</p>
							<p className="text-sm text-gray-600">Critical Patients</p>
						</div>

						<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
							<div className="flex items-center justify-between mb-4">
								<div className="p-2 bg-green-50 rounded-lg">
									<Video className="text-green-600" size={24} />
								</div>
								<span className="text-sm font-medium text-green-600">
									Next 30 Days
								</span>
							</div>
							<p className="text-2xl font-bold text-gray-900 mb-1">1</p>
							<p className="text-sm text-gray-600">Upcoming Meetings</p>
						</div>
					</div>
				</main>

				<main className="container mx-auto px-6 py-8">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">
						Patient Table
					</h2>
					<table className="min-w-full bg-white border border-gray-200">
						<thead>
							<tr className="bg-gray-100">
								<th className="px-4 py-2">Name</th>
								<th className="px-4 py-2">Email</th>
								<th className="px-4 py-2">Status</th>
							</tr>
						</thead>
						<tbody>
							{patients?.map((patient, index) => (
								<tr
									key={`${patient.id}_${index}`}
									className="border-t bg-red-100 text-red-600"
								>
									<td
										className="px-4 py-2 cursor-pointer"
										onClick={() => navigate(`/patient-profile/${patient.id}`)}
									>
										{patient.document?.name || "Unnamed Patient"}
									</td>
									<td className="px-4 py-2">
										<a
											href={`mailto:${patient.document?.email}`}
											className="text-blue-500 hover:underline"
										>
											{patient.document?.email || "No email available"}
										</a>
									</td>
									<td className="px-4 py-2 font-semibold">
										{patient.document?.status || "Critical"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</main>
				<ChatBot conversationChain={patientData} />
			</div>
		</>
	);
}

export default Dashboard;
