import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./homepage";
import Dashboard from "./dashboard";
import AssessmentResults from "./assessment";
import PatientProfile from "./patient-profile";
import "./index.css";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/dash" element={<Dashboard />} />
				<Route path="/assessment/:id" element={<AssessmentResults />} />
				<Route path="/patient-profile/:id" element={<PatientProfile />} />
			</Routes>
		</Router>
	);
}

export default App;
