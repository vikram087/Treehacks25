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
				<h1 className="text-xl font-semibold text-gray-800">
					Therapist Dashboard
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
