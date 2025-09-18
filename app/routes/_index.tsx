import { useCallback, useState } from "react"
import WebcamCapture from "../components/WebcamCapture"
import PhotoGallery from "../components/PhotoGallery"
import ModeToggle from "../components/ModeToggle"
import type { EmotionMode } from "../lib/emotionMapping"

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
			{/* Header - Enhanced Mobile Responsive */}
			<header className="text-center py-4 sm:py-5 md:py-6 lg:py-8 px-4 sm:px-6">
				<h1
					className="font-bold mb-2 sm:mb-3 font-serif italic transition-all duration-300 leading-tight tracking-tight logo-desktop-reduced"
					style={{
						background:
							"linear-gradient(45deg, #ec4899, #f472b6, #be185d)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						backgroundClip: "text",
						textShadow: "0 2px 4px rgba(236, 72, 153, 0.1)",
						minHeight: "45px", // Still above 40px minimum requirement
						lineHeight: "1.1",
						fontSize: "clamp(2.85rem, 8vw, 6.65rem)", // Base size for mobile/tablet, overridden by logo-desktop-reduced on desktop
					}}
				>
					Truth Teller
				</h1>
				<p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-amber-800 font-medium transition-all duration-300 max-w-md mx-auto subtitle-desktop-reduced">
					Face the truth ✨
				</p>
			</header>
			
			{/* Main Content - Enhanced responsive layout */}
			<main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 overflow-x-hidden">
				{/* Mode Toggle */}
				<div className="mb-3 sm:mb-4">
					<ModeToggle
						mode={emotionMode}
						onModeChange={setEmotionMode}
					/>
				</div>
				
				{/* Error Message - Responsive */}
				{cameraStatus === "error" && errorMessage && (
					<div
						className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-xl border-2 border-pink-200 transition-all duration-300 mx-auto max-w-md"
						style={{
							backgroundColor: "rgba(236, 72, 153, 0.1)",
						}}
					>
						<div className="flex items-center gap-3">
							<div className="w-5 h-5 sm:w-6 sm:h-6 text-pink-700">⚠️</div>
							<p className="text-pink-700 font-medium text-base sm:text-lg">Camera Error</p>
						</div>
						<p className="text-pink-600 mt-2 text-sm sm:text-base mobile-contrast">{errorMessage}</p>
					</div>
				)}
				
				{/* Camera Component - Responsive full-width mobile container */}
				<div className="mb-4 sm:mb-6 w-full flex justify-center">
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
							className="mt-4 sm:mt-6 md:mt-8"
						/>
					</div>
				)}
			</main>
			
			{/* Footer - Enhanced responsive */}
			<footer
				className="mt-auto py-3 sm:py-4 md:py-6 text-center px-4 transition-all duration-300"
				style={{ color: "#2d1b2e" }}
			>
				<p className="text-sm sm:text-base opacity-75 mobile-contrast">
					© 2025 Truth Teller Photobooth
				</p>
			</footer>
		</div>
	)
}
