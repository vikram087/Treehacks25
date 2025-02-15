import {
    BarChart3,
    Brain,
    Calendar,
    Clock,
    FileText,
    Heart,
    LineChart,
    Moon,
    Utensils,
    Users,
} from "lucide-react";
import ChatBot from './components/ChatBot';

function AssessmentResults() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-semibold text-gray-800">
                            Assessment Results
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Last updated: Today at 2:30 PM</span>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-8">
                {/* Patient Info Section */}
                <div className="mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Patient Assessment: John Doe
                    </h2>
                    <p className="text-gray-600">
                        Comprehensive analysis based on recent interaction
                    </p>
                </div>

                {/* Assessment Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
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
                            <span className="text-sm font-medium text-purple-600">Stress</span>
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
                </div>

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
                                    Key Findings
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-900 mb-2">Mood Patterns</p>
                                    <p className="text-sm text-gray-600">
                                        Shows consistent mood stability with minor fluctuations in the evening
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-900 mb-2">Sleep Quality</p>
                                    <p className="text-sm text-gray-600">
                                        Irregular sleep patterns noted, averaging 6.5 hours per night
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-900 mb-2">Social Interaction</p>
                                    <p className="text-sm text-gray-600">
                                        Maintains regular social connections with family and friends
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <LineChart className="text-green-600" size={24} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Recommendations
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <Clock className="text-gray-500 mr-2" size={16} />
                                        <p className="font-medium text-gray-900">Sleep Schedule</p>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Implement consistent bedtime routine
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <Calendar className="text-gray-500 mr-2" size={16} />
                                        <p className="font-medium text-gray-900">Activity Planning</p>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Schedule regular outdoor activities
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <Utensils className="text-gray-500 mr-2" size={16} />
                                        <p className="font-medium text-gray-900">Dietary Habits</p>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Monitor meal times and nutritional intake
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <ChatBot />
        </div>
    );
}

export default AssessmentResults; 