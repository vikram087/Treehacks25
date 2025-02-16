import { FileText, MessageCircle } from "lucide-react";
import ChatBot from "./components/ChatBot";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import Loader from "./components/Loader";
import { useNavigate } from "react-router-dom";

function AssessmentResults() {
	const { id } = useParams();
	const [sessionData, setSessionData] = useState({});
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`${import.meta.env.VITE_BACKEND_URL}/fetch-patient-data/patient_records`,
				);
				const data = await res.json();
				const sessionData = data.data.find((doc) => doc.id === id);
				console.log(sessionData);
				setSessionData(sessionData);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const cleanSummary = (summary) => {
		return parse(DOMPurify.sanitize(summary));
	};

	return (
		<>
			{loading && <Loader />}
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
				{/* Top Navigation Bar */}
				<nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<button
								type="button"
								onClick={() => navigate(-1)}
								className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-400 rounded-full hover:from-blue-600 hover:to-blue-500 shadow-md transition-all flex items-center space-x-2"
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
								<span>Assessment Results</span>
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-500">
								Last updated: Today at 2:30 PM
							</span>
						</div>
					</div>
				</nav>

				<main className="container mx-auto px-6 py-8">
					{/* Patient Info Section */}
					<div className="mb-10">
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Patient Assessment: {sessionData.metadata?.name}
						</h2>
						<p className="text-gray-600">
							Comprehensive analysis based on recent interaction
						</p>
					</div>

					{/* Assessment Overview Cards */}
					{/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-blue-50 rounded-lg">
								<Brain className="text-blue-600" size={24} />
							</div>
							<span className="text-sm font-medium text-blue-600">Mood</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">Stable</p>
						<p className="text-sm text-gray-600">Current State</p>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-green-50 rounded-lg">
								<Moon className="text-green-600" size={24} />
							</div>
							<span className="text-sm font-medium text-green-600">Sleep</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">6.5h</p>
						<p className="text-sm text-gray-600">Avg. Duration</p>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-purple-50 rounded-lg">
								<Heart className="text-purple-600" size={24} />
							</div>
							<span className="text-sm font-medium text-purple-600">
								Stress
							</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">Moderate</p>
						<p className="text-sm text-gray-600">Current Level</p>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-amber-50 rounded-lg">
								<Users className="text-amber-600" size={24} />
							</div>
							<span className="text-sm font-medium text-amber-600">Social</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">Active</p>
						<p className="text-sm text-gray-600">Engagement Level</p>
					</div>
				</div> */}

					{/* Detailed Analysis Grid */}
					<div className="grid gap-6 grid-cols-1 md:grid-cols-2">
						{/* Key Findings */}
						<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
							<div className="p-6">
								<div className="flex items-center space-x-3 mb-6">
									<div className="p-2 bg-blue-50 rounded-lg">
										<FileText className="text-blue-600" size={24} />
									</div>
									<h3 className="text-lg font-semibold text-gray-900">
										Summary
									</h3>
								</div>
								<div className="space-y-4">
									{cleanSummary(sessionData.document?.summary)}
								</div>
							</div>
						</div>

						<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
							<div className="p-6">
								<div className="flex items-center space-x-3 mb-6">
									<div className="p-2 bg-green-50 rounded-lg">
										<MessageCircle className="text-green-600" size={24} />
									</div>
									<h3 className="text-lg font-semibold text-gray-900">
										Full Conversation
									</h3>
								</div>
								<div className="overflow-y-auto max-h-96 border border-gray-200 rounded-lg p-4">
									{sessionData.document?.history?.length > 0 ? (
										sessionData.document.history.map((entry, index) => (
											<div
												key={index}
												className="mb-4 p-3 bg-gray-50 rounded-lg border"
											>
												<p className="text-sm text-gray-700">
													<strong>Q:</strong> {entry.question}
												</p>
												<p className="text-sm text-gray-600 mt-2">
													<strong>A:</strong> {entry.answer}
												</p>
											</div>
										))
									) : (
										<p className="text-gray-500">No history available.</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</main>
				<ChatBot conversationChain={sessionData.document?.history} />
			</div>
		</>
	);
}

export default AssessmentResults;
