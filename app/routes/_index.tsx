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
			className="min-h-screen w-full flex flex-col"
			style={{
				background:
					"linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #fce7f3 100%)",
				color: "#2d1b2e",
			}}
		>
			{/* Header */}
			<header className="text-center py-4 sm:py-6">
				<h1
					className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 font-serif italic"
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
				<p className="text-lg sm:text-xl text-amber-800 font-medium">
					Face the truth ✨
				</p>
			</header>
			{/* Main Content */}
			<main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
				<div className="mb-4 sm:mb-6">
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
					<PhotoGallery
						photos={capturedPhotos}
						onDownload={downloadPhoto}
						onDelete={handleDeletePhoto}
						className="mt-4 sm:mt-6"
					/>
				)}
			</main>
			{/* Footer */}
			<footer
				className="mt-auto py-3 sm:py-4 text-center"
				style={{ color: "#2d1b2e" }}
			>
				<p className="text-xs sm:text-sm opacity-75">
					© 2025 Truth Teller Photobooth
				</p>
			</footer>
		</div>
	)
}
