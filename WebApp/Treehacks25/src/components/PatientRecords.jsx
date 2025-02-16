import { useNavigate } from "react-router-dom";
import { useState } from "react";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import { ChevronRight } from "lucide-react";

function PatientRecords({ patientData }) {
	const navigate = useNavigate();
	const [expandedId, setExpandedId] = useState(null);

	const toggleExpand = (id) => {
		setExpandedId((prevId) => (prevId === id ? null : id));
	};

	const formatTimestamp = (timestamp) => {
		if (!timestamp) return "Time Uncertain";
		const date = new Date(timestamp);
		return date.toLocaleString(undefined, {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});
	};

	return (
		<main className="bg-white rounded-xl shadow-sm container mx-auto px-6 py-8">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Records</h2>
			<div className="overflow-y-auto max-h-96 border border-gray-100 rounded-xl shadow-sm">
				{patientData.map((patient) => (
					<div
						key={patient.id}
						className="bg-gray-50 p-5 mb-4 rounded-lg border hover:shadow-md transition-all"
						onClick={() => navigate(`/assessment/${patient.id}`)}
					>
						<h3 className="text-lg font-semibold text-gray-900">
							{formatTimestamp(patient.document?.timestamp) || "Time Uncertain"}
						</h3>
						<div
							className={`text-sm text-gray-600 overflow-hidden transition-all ${expandedId === patient.id ? "max-h-none" : "max-h-20"}`}
						>
							{parse(
								DOMPurify.sanitize(
									patient.document?.summary || "No summary available",
								),
							)}
						</div>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								toggleExpand(patient.id);
							}}
							className="mt-3 text-blue-500 font-medium hover:underline"
						>
							{expandedId === patient.id ? "Show Less" : "Show More"}
						</button>
						<p className="text-xs text-gray-500 mt-2">
							Assessment ID: {patient.id}
						</p>
						<button
							type="button"
							className="w-full flex items-center justify-between px-4 py-2 mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-colors"
						>
							<span>View Assessment</span>
							<ChevronRight size={20} />
						</button>
					</div>
				))}
			</div>
		</main>
	);
}

export default PatientRecords;
