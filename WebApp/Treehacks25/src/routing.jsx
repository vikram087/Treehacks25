import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./homepage";
import Dashboard from "./dashboard";
import AssessmentResults from "./assessment";
import "./index.css";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/dash" element={<Dashboard />} />
				<Route path="/assessment" element={<AssessmentResults />} />
			</Routes>
		</Router>
	);
}

export default App;
