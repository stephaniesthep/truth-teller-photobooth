import { useCallback, useState } from "react"
import WebcamCapture from "../components/WebcamCapture"
import PhotoGallery from "../components/PhotoGallery"
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
			className="min-h-screen w-full max-w-full flex flex-col overflow-x-hidden"
			style={{
				background:
					"linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #fce7f3 100%)",
				color: "#2d1b2e",
			}}
		>
			{/* Header - Responsive */}
			<header className="text-center py-2 sm:py-3 md:py-4 px-4">
				<h1
					className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 font-serif italic transition-all duration-300"
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
				<p className="text-base sm:text-lg md:text-xl text-amber-800 font-medium transition-all duration-300">
					Face the truth ✨
				</p>
			</header>
			
			{/* Main Content - Enhanced responsive layout */}
			<main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
				{/* Mode Toggle */}
				<div className="mb-2 sm:mb-3">
					<ModeToggle
						mode={emotionMode}
						onModeChange={setEmotionMode}
					/>
				</div>
				
				{/* Error Message - Responsive */}
				{cameraStatus === "error" && errorMessage && (
					<div
						className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-pink-200 transition-all duration-300"
						style={{
							backgroundColor: "rgba(236, 72, 153, 0.1)",
						}}
					>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 sm:w-5 sm:h-5 text-pink-700">⚠️</div>
							<p className="text-pink-700 font-medium text-sm sm:text-base">Camera Error</p>
						</div>
						<p className="text-pink-600 mt-1 text-sm sm:text-base">{errorMessage}</p>
					</div>
				)}
				
				{/* Camera Component - Responsive container */}
				<div className="mb-2 sm:mb-3 w-full overflow-hidden">
					<WebcamCapture
						onCameraStart={handleCameraStart}
						onCameraStop={handleCameraStop}
						onCameraError={handleCameraError}
						onScreenshot={handleScreenshot}
						onDeletePhoto={handleDeletePhoto}
						mode={emotionMode}
					/>
				</div>
				
				{/* Photo Gallery - Enhanced responsive container */}
				{capturedPhotos.length > 0 && (
					<div className="w-full overflow-hidden">
						<PhotoGallery
							photos={capturedPhotos}
							onDownload={downloadPhoto}
							onDelete={handleDeletePhoto}
							className="mt-3 sm:mt-4 md:mt-6"
						/>
					</div>
				)}
			</main>
			
			{/* Footer - Responsive */}
			<footer
				className="mt-auto py-2 sm:py-3 md:py-4 text-center px-4 transition-all duration-300"
				style={{ color: "#2d1b2e" }}
			>
				<p className="text-xs sm:text-sm opacity-75">
					© 2025 Truth Teller Photobooth
				</p>
			</footer>
		</div>
	)
}
