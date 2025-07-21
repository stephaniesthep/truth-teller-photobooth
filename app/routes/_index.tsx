import { useCallback, useState } from "react"
import WebcamCapture from "../components/WebcamCapture"
import ModeToggle, { type EmotionMode } from "../components/ModeToggle"

export function meta() {
	return [
		{ title: "Truth Teller" },
		{
			name: "description",
			content:
				"AI-powered photobooth with facial recognition and emotion detection",
		},
	]
}

export default function Index() {
	const [cameraStatus, setCameraStatus] = useState<
		"idle" | "active" | "error"
	>("idle")
	const [errorMessage, setErrorMessage] = useState<string>("")
	const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
	const [emotionMode, setEmotionMode] = useState<EmotionMode>("normal")

	const handleCameraStart = useCallback(() => {
		setCameraStatus("active")
		setErrorMessage("")
	}, [])

	const handleCameraStop = useCallback(() => {
		setCameraStatus("idle")
	}, [])

	const handleCameraError = useCallback((error: string) => {
		setCameraStatus("error")
		setErrorMessage(error)
	}, [])

	const handleScreenshot = useCallback((imageSrc: string) => {
		setCapturedPhotos((prev) => [...prev, imageSrc].slice(-5)) // Keep last 5 photos, maintain order
	}, [])

	const handleDeletePhoto = useCallback((imageSrc: string) => {
		setCapturedPhotos((prev) => prev.filter(photo => photo !== imageSrc))
	}, [])

	const downloadPhoto = useCallback((imageSrc: string, index: number) => {
		const link = document.createElement("a")
		link.download = `truth-teller-photo-${index + 1}-${Date.now()}.png`
		link.href = imageSrc
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}, [])

	return (
		<div
			className="min-h-screen w-full"
			style={{
				background:
					"linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #fce7f3 100%)",
				color: "#2d1b2e",
			}}
		>
			{/* Header */}
			<header className="text-center py-8">
				<h1
					className="text-5xl font-bold mb-2 font-serif italic"
					style={{
						background:
							"linear-gradient(45deg, #ec4899, #f472b6, #be185d)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						backgroundClip: "text",
					}}
				>
					Truth Teller
				</h1>
				<p className="text-xl text-amber-800 font-medium">
					Face the truth ✨
				</p>
			</header>
			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-8">
				{/* Mode Toggle */}
				<ModeToggle
					mode={emotionMode}
					onModeChange={setEmotionMode}
				/>
				
				{/* Error Message */}
				{cameraStatus === "error" && errorMessage && (
					<div
						className="mb-6 p-4 rounded-xl border-2 border-pink-200"
						style={{
							backgroundColor: "rgba(236, 72, 153, 0.1)",
						}}
					>
						<div className="flex items-center gap-2">
							<div className="w-5 h-5 text-pink-700">⚠️</div>
							<p className="text-pink-700 font-medium">Camera Error</p>
						</div>
						<p className="text-pink-600 mt-1">{errorMessage}</p>
					</div>
				)}
				{/* Camera Component */}
				<div className="mb-8">
					<WebcamCapture
						onCameraStart={handleCameraStart}
						onCameraStop={handleCameraStop}
						onCameraError={handleCameraError}
						onScreenshot={handleScreenshot}
						onDeletePhoto={handleDeletePhoto}
						mode={emotionMode}
					/>
				</div>
				{/* Photo Gallery */}
				{capturedPhotos.length > 0 && (
					<div className="mt-8">
						<h3
							className="text-2xl font-semibold text-center mb-6"
							style={{ color: "#2d1b2e" }}
						>
							🖼️ Recent Photos
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
							{capturedPhotos.map((photo, index) => (
								<div key={index} className="relative bg-white rounded-lg border-2 border-pink-200 shadow-lg overflow-hidden">
									<img
										src={photo}
										alt={`Captured photo ${index + 1}`}
										className="w-full aspect-square object-cover"
									/>
									{/* Photo number badge */}
									<div className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
										#{index + 1}
									</div>
									{/* Mobile-friendly button bar at bottom */}
									<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
										<div className="flex gap-2 justify-center">
											<button
												onClick={() => downloadPhoto(photo, index)}
												className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm flex items-center gap-1"
											>
												📥 Download
											</button>
											<button
												onClick={() => handleDeletePhoto(photo)}
												className="bg-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors text-sm flex items-center gap-1"
												title="Delete photo"
											>
												🗑️ Delete
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</main>
			{/* Footer */}
			<footer
				className="mt-16 py-6 text-center"
				style={{ color: "#2d1b2e" }}
			>
				<p className="text-sm opacity-75">
					© 2025 Truth Teller Photobooth 
				</p>
			</footer>
		</div>
	)
}
