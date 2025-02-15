import {
	Bell,
	Activity,
	Flag,
	ChevronRight,
	Users,
	Calendar,
	Brain,
	Clock,
	Search,
} from "lucide-react";
import "./index.css";

function Dashboard() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			{/* Top Navigation Bar */}
			<nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<h1 className="text-xl font-semibold text-gray-800">
							Therapist Dashboard
						</h1>
						<div className="relative ml-6">
							<input
								type="text"
								placeholder="Search patients..."
								className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<Search
								className="absolute left-3 top-2.5 text-gray-400"
								size={20}
							/>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<button
							type="button"
							className="p-2 text-gray-500 hover:text-gray-700 relative"
						>
							<Bell size={20} />
							<span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
								3
							</span>
						</button>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-6 py-8">
				{/* Welcome Section */}
				<div className="mb-10">
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						Welcome back, Dr. Sarah
					</h2>
					<p className="text-gray-600">
						Here's what needs your attention today
					</p>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-blue-50 rounded-lg">
								<Users className="text-blue-600" size={24} />
							</div>
							<span className="text-sm font-medium text-blue-600">Today</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">24</p>
						<p className="text-sm text-gray-600">Active Patients</p>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-green-50 rounded-lg">
								<Calendar className="text-green-600" size={24} />
							</div>
							<span className="text-sm font-medium text-green-600">
								This Week
							</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">12</p>
						<p className="text-sm text-gray-600">Upcoming Sessions</p>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-purple-50 rounded-lg">
								<Brain className="text-purple-600" size={24} />
							</div>
							<span className="text-sm font-medium text-purple-600">New</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">8</p>
						<p className="text-sm text-gray-600">Assessment Results</p>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="p-2 bg-amber-50 rounded-lg">
								<Clock className="text-amber-600" size={24} />
							</div>
							<span className="text-sm font-medium text-amber-600">
								Average
							</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 mb-1">45m</p>
						<p className="text-sm text-gray-600">Session Duration</p>
					</div>
				</div>

				{/* Main Content Grid */}
				<div className="grid gap-6 grid-cols-1 md:grid-cols-3">
					{/* Patient Alerts */}
					<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center space-x-3">
									<div className="p-2 bg-red-50 rounded-lg">
										<Bell className="text-red-600" size={24} />
									</div>
									<h3 className="text-lg font-semibold text-gray-900">
										Patient Alerts
									</h3>
								</div>
								<span className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-full">
									4 new
								</span>
							</div>
							<div className="space-y-4">
								<div className="p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center justify-between mb-1">
										<p className="font-medium text-gray-900">Sarah Johnson</p>
										<span className="text-xs text-gray-500">2h ago</span>
									</div>
									<p className="text-sm text-gray-600">
										Reported severe anxiety symptoms
									</p>
								</div>
								<div className="p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center justify-between mb-1">
										<p className="font-medium text-gray-900">Michael Chen</p>
										<span className="text-xs text-gray-500">4h ago</span>
									</div>
									<p className="text-sm text-gray-600">
										Missed scheduled check-in
									</p>
								</div>
							</div>
							<button
								type="button"
								className="w-full flex items-center justify-between px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-colors mt-6"
							>
								<span>View All Alerts</span>
								<ChevronRight size={20} />
							</button>
						</div>
					</div>

					{/* Biometric Trends */}
					<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center space-x-3">
									<div className="p-2 bg-green-50 rounded-lg">
										<Activity className="text-green-600" size={24} />
									</div>
									<h3 className="text-lg font-semibold text-gray-900">
										Biometric Trends
									</h3>
								</div>
								<span className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-full">
									Live
								</span>
							</div>
							<div className="space-y-4">
								<div className="p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center justify-between mb-1">
										<p className="font-medium text-gray-900">
											Heart Rate Patterns
										</p>
										<span className="text-xs text-green-500">↑ 12%</span>
									</div>
									<p className="text-sm text-gray-600">
										5 patients showing elevated rates
									</p>
								</div>
								<div className="p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center justify-between mb-1">
										<p className="font-medium text-gray-900">Sleep Quality</p>
										<span className="text-xs text-red-500">↓ 8%</span>
									</div>
									<p className="text-sm text-gray-600">
										3 patients with disrupted patterns
									</p>
								</div>
							</div>
							<button
								type="button"
								className="w-full flex items-center justify-between px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-colors mt-6"
							>
								<span>View All Trends</span>
								<ChevronRight size={20} />
							</button>
						</div>
					</div>

					{/* Flagged Responses */}
					<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center space-x-3">
									<div className="p-2 bg-amber-50 rounded-lg">
										<Flag className="text-amber-600" size={24} />
									</div>
									<h3 className="text-lg font-semibold text-gray-900">
										Flagged Responses
									</h3>
								</div>
								<span className="px-3 py-1 text-sm font-medium text-amber-600 bg-amber-50 rounded-full">
									2 pending
								</span>
							</div>
							<div className="space-y-4">
								<div className="p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center justify-between mb-1">
										<p className="font-medium text-gray-900">
											Weekly Assessment
										</p>
										<span className="text-xs text-gray-500">1h ago</span>
									</div>
									<p className="text-sm text-gray-600">
										Concerning response from Emily W.
									</p>
								</div>
								<div className="p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center justify-between mb-1">
										<p className="font-medium text-gray-900">Daily Check-in</p>
										<span className="text-xs text-gray-500">3h ago</span>
									</div>
									<p className="text-sm text-gray-600">
										Unusual pattern detected for Alex M.
									</p>
								</div>
							</div>
							<button
								type="button"
								className="w-full flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-700 hover:to-amber-600 transition-colors mt-6"
							>
								<span>Review Responses</span>
								<ChevronRight size={20} />
							</button>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default Dashboard;
