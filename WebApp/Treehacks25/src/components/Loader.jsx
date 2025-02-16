const Loader = () => {
	return (
		<div className="fixed inset-0 flex items-center justify-center backdrop-blur-[2px] bg-black/10">
			<div className="flex items-end space-x-1 h-12">
				{[...Array(5)].map((_, i) => (
					<div
						key={i}
						className="w-2 bg-blue-500 rounded-full animate-[bounce_1s_ease-in-out_infinite]"
						style={{
							height: "60%",
							animationDelay: `${i * 0.15}s`,
						}}
					>
						<div className="w-full h-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-full opacity-80" />
					</div>
				))}
			</div>

			{/* Subtle reflection */}
			<div className="absolute mt-14 flex items-start space-x-1 h-12 opacity-20 scale-y-[-0.4] blur-sm">
				{[...Array(5)].map((_, i) => (
					<div
						key={i}
						className="w-2 bg-blue-500 rounded-full animate-[bounce_1s_ease-in-out_infinite]"
						style={{
							height: "60%",
							animationDelay: `${i * 0.15}s`,
						}}
					>
						<div className="w-full h-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-full" />
					</div>
				))}
			</div>
		</div>
	);
};

export default Loader;
