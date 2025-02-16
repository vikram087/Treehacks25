import { useNavigate } from "react-router-dom";
import { useState } from "react";
import parse from "html-react-parser";
import DOMPurify from "dompurify";

function PatientRecords({ patientData }) {
	const navigate = useNavigate();
	const [expandedId, setExpandedId] = useState(null);

	const toggleExpand = (id) => {
		setExpandedId((prevId) => (prevId === id ? null : id));
	};

	return (
		<main className="container mx-auto px-6 py-8">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Records</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{patientData.map((patient) => (
					<div
						key={patient.id}
						className="bg-white shadow-sm rounded-lg p-4 border hover:shadow-md transition-all"
						onClick={() => navigate(`/assessments/${patient.id}`)}
					>
						<h3 className="text-lg font-semibold text-gray-900">
							{patient.metadata?.name || "Unnamed Patient"}
						</h3>
						<div
							className={`text-sm text-gray-500 overflow-hidden transition-all ${expandedId === patient.id ? "max-h-none" : "max-h-24"}`}
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
							className="mt-2 text-blue-600 text-sm hover:underline"
						>
							{expandedId === patient.id ? "Show Less" : "Show More"}
						</button>
						<p className="text-xs text-gray-400 mt-2">
							Assessment ID: {patient.id}
						</p>
					</div>
				))}
			</div>
		</main>
	);
}

export default PatientRecords;
