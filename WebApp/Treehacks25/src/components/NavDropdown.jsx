import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function NavDropdown({ patients }) {
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Close dropdown on outside click
	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
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
					<span>Dashboard</span>
				</h1>
				<div className="relative" ref={dropdownRef}>
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						View Patients
					</button>
					{isOpen && (
						<div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-auto max-h-60 z-20">
							<ul>
								{Object.values(patients).length === 0 ? (
									<li className="px-4 py-2 text-sm text-gray-500">
										No patients found
									</li>
								) : (
									Object.values(patients).map((patient) => (
										<li
											key={patient.user_id}
											onClick={() =>
												navigate(`/patient-profile/${patient.user_id}`)
											}
											className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
										>
											{patient.name}
										</li>
									))
								)}
							</ul>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
}

export default NavDropdown;
