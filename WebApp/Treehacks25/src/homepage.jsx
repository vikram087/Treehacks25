import React from "react";
import { Bell, Activity, Flag, ChevronRight, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

function App() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<nav className="bg-white border-b border-gray-200 px-6 py-3">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-semibold text-gray-800">
						Therapist Portal
					</h1>
					<div className="flex items-center space-x-4">
						<button
							type="button"
							className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							<LogIn size={20} />
							<span>Sign In</span>
						</button>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-6 py-12">
				{/* Hero Section */}
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold text-gray-900 mb-4">
						Empowering Mental Health Professionals
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
						A comprehensive platform designed to help therapists monitor,
						analyze, and respond to patient needs more effectively.
					</p>
					<button
						onClick={() => navigate("/dash")}
						type="button"
						className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-colors text-lg font-medium"
					>
						Get Started
					</button>
				</div>

				{/* Features Section */}
				<h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
					Key Features
				</h3>
				<div className="grid gap-8 grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto">
					{/* Patient Monitoring Card */}
					<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-md group">
						<div className="p-6">
							<div className="flex items-center space-x-3 mb-4">
								<div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
									<Bell className="text-red-600" size={24} />
								</div>
								<h3 className="text-lg font-semibold text-gray-900">
									Real-time Alerts
								</h3>
							</div>
							<p className="text-gray-600 mb-6">
								Receive instant notifications for critical patient events and
								concerning patterns in patient responses.
							</p>
							<button
								type="button"
								className="w-full flex items-center justify-between px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg group-hover:bg-red-50 transition-colors"
							>
								<span>Learn More</span>
								<ChevronRight size={20} />
							</button>
						</div>
					</div>

					{/* Biometric Tracking Card */}
					<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-md group">
						<div className="p-6">
							<div className="flex items-center space-x-3 mb-4">
								<div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
									<Activity className="text-green-600" size={24} />
								</div>
								<h3 className="text-lg font-semibold text-gray-900">
									Health Insights
								</h3>
							</div>
							<p className="text-gray-600 mb-6">
								Track and analyze patient health metrics with advanced
								visualization tools and trend analysis.
							</p>
							<button
								type="button"
								className="w-full flex items-center justify-between px-4 py-2 bg-white text-green-600 border border-green-200 rounded-lg group-hover:bg-green-50 transition-colors"
							>
								<span>Learn More</span>
								<ChevronRight size={20} />
							</button>
						</div>
					</div>

					{/* AI Analysis Card */}
					<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-md group">
						<div className="p-6">
							<div className="flex items-center space-x-3 mb-4">
								<div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
									<Flag className="text-amber-600" size={24} />
								</div>
								<h3 className="text-lg font-semibold text-gray-900">
									AI-Powered Analysis
								</h3>
							</div>
							<p className="text-gray-600 mb-6">
								Leverage advanced AI to identify patterns and potential concerns
								in patient responses and behavior.
							</p>
							<button
								type="button"
								className="w-full flex items-center justify-between px-4 py-2 bg-white text-amber-600 border border-amber-200 rounded-lg group-hover:bg-amber-50 transition-colors"
							>
								<span>Learn More</span>
								<ChevronRight size={20} />
							</button>
						</div>
					</div>
				</div>

				{/* Stats Section */}
				<div className="mt-16 text-center bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
					<h3 className="text-2xl font-semibold text-gray-900 mb-8">
						Trusted by Mental Health Professionals
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div>
							<p className="text-3xl font-bold text-blue-600 mb-2">2,000+</p>
							<p className="text-gray-600">Active Therapists</p>
						</div>
						<div>
							<p className="text-3xl font-bold text-blue-600 mb-2">50,000+</p>
							<p className="text-gray-600">Patients Monitored</p>
						</div>
						<div>
							<p className="text-3xl font-bold text-blue-600 mb-2">98%</p>
							<p className="text-gray-600">Satisfaction Rate</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default App;
