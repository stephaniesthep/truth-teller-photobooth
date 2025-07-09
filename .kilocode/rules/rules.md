# Truth Teller Photobooth - Kilocode Rules

## Project Overview

This is a React Router v7 photobooth web application with facial recognition capabilities, migrated from a vanilla React project. The app uses real-time face detection, emotion analysis, and provides a branded photo frame experience.

## Technology Stack

### Core Framework

-  **React Router v7** - Full-stack React framework with SSR support
-  **React 19** - Latest React with concurrent features
-  **TypeScript** - Strict type checking enabled
-  **Vite** - Build tool and dev server

### Styling & UI

-  **Tailwind CSS v4** - Utility-first CSS framework with new CSS-first architecture
-  **shadcn/ui** - Component library with "new-york" style
-  **Lucide React** - Icon library for consistent iconography
-  **CSS Variables** - For theming support

### Routing & File Structure

-  **remix-flat-routes** - Flat file-based routing system
-  **@react-router/remix-routes-option-adapter** - Adapter for flat routes integration

### Facial Recognition & AI

-  **face-api.js** - Advanced facial recognition and emotion detection
-  **Canvas API** - Image processing and screenshot capture
-  **html2canvas** - DOM to canvas conversion for photo frames

### Deployment & Build

-  **Netlify** - Deployment platform with serverless functions
-  **pnpm** - Package manager (v10.12.1+)

## File Structure & Organization

### App Structure

```
app/
├── root.tsx              # Root layout with error boundaries
├── routes.ts
├── styles/              # Flat routes configuration
    ├── tailwind.css     # Global styles and Tailwind imports
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── PhotoboothFrame.tsx
│   ├── WebcamCapture.tsx
│   └── FaceApiOverlay.tsx
├── hooks/              # Custom React hooks
│   └── useFaceApiDetection.ts
├── lib/                # Utility functions
│   └── utils.ts        # cn() utility and helpers
└── routes/             # File-based routes
    └── _index.tsx      # Home page route
```

### Public Assets

```
public/
├── models/             # face-api.js AI models
│   ├── tiny_face_detector_model-*
│   ├── face_landmark_68_model-*
│   ├── face_expression_model-*
│   └── face_recognition_model-*
└── images/             # Static images and assets
```

## Coding Standards & Conventions

### TypeScript Rules

-  Use strict TypeScript configuration
-  Define proper interfaces for all props and data structures
-  Use `type` for unions, `interface` for object shapes
-  Prefer explicit return types for functions
-  Use proper generic constraints

### React Patterns

-  Use functional components with hooks exclusively
-  Implement proper error boundaries in routes
-  Use `useCallback` and `useMemo` for performance optimization
-  Follow React Router v7 patterns for data loading and mutations
-  Use proper cleanup in `useEffect` hooks

### Component Structure

```typescript
// Component file structure
import /* React imports */ "react"
import /* React Router imports */ "react-router"
import /* Third-party imports */ "library"
import /* Local component imports */ "./components"
import /* Hook imports */ "../hooks"
import /* Utility imports */ "../lib"

interface ComponentProps {
	// Props definition
}

export default function Component({ prop }: ComponentProps) {
	// Component implementation
}
```

### Styling Guidelines

-  Use Tailwind CSS classes for styling
-  Leverage CSS variables for theming
-  Use `cn()` utility for conditional classes
-  Follow mobile-first responsive design
-  Use semantic color names from Tailwind palette

### File Naming Conventions

-  Components: `PascalCase.tsx`
-  Hooks: `useCamelCase.ts`
-  Utilities: `camelCase.ts`
-  Routes: Follow flat-routes conventions (`_index.tsx`, `about.tsx`)
-  Types: `types.ts` or inline interfaces

## React Router v7 Specific Rules

### Route Structure

-  Use flat-routes convention with remix-flat-routes
-  Route files in `app/routes/` directory
-  Use `_index.tsx` for index routes
-  Use `_layout.tsx` for layout routes
-  Nested routes use dot notation: `dashboard.settings.tsx`

### Data Loading

```typescript
import type { Route } from "./+types/route-name"

export async function loader({ request }: Route.LoaderArgs) {
	// Server-side data loading
}

export async function action({ request }: Route.ActionArgs) {
	// Form submissions and mutations
}
```

### Error Handling

-  Implement `ErrorBoundary` in route files
-  Use `isRouteErrorResponse` for proper error handling
-  Provide meaningful error messages
-  Include stack traces in development

## Facial Recognition Implementation

### Face Detection Architecture

-  Use `useFaceApiDetection` hook for face detection logic
-  Implement fallback detection when AI models fail to load
-  Throttle detection updates to 10 FPS for performance
-  Support multiple face detection with confidence scoring

### Model Loading

-  Load face-api.js models from `/public/models/`
-  Required models: TinyFaceDetector, FaceLandmark68, FaceExpression, FaceRecognition
-  Implement graceful fallback when models fail to load
-  Show loading states during model initialization

### Camera Integration

-  Use `getUserMedia` API with fallback for older browsers
-  Implement proper camera permissions handling
-  Support both front and back cameras
-  Handle camera errors gracefully with user-friendly messages

### Photo Capture Process

1. Capture video frame to canvas
2. Apply face detection overlay
3. Render in PhotoboothFrame component
4. Use html2canvas for final image generation
5. Provide download/share functionality

## Performance Optimization

### Face Detection Performance

-  Throttle detection updates to prevent UI flickering
-  Use `requestAnimationFrame` for smooth detection loops
-  Implement proper cleanup to prevent memory leaks
-  Use Web Workers for heavy computation (future enhancement)

### Image Processing

-  Optimize canvas operations for better performance
-  Use appropriate image formats (PNG for quality, JPEG for size)
-  Implement image compression for sharing
-  Cache processed images when possible

### Bundle Optimization

-  Use dynamic imports for face-api.js models
-  Implement code splitting for route-based chunks
-  Optimize Tailwind CSS with purging
-  Use Vite's built-in optimizations

## Deployment & Build

### Netlify Configuration

-  Use `netlify.toml` for deployment settings
-  Implement serverless functions in `netlify/` directory
-  Use `netlify/prepare.js` for build preparation
-  Configure proper redirects for SPA routing

### Build Process

```bash
# Development
pnpm dev

# Production build
pnpm build

# Type checking
pnpm typecheck
```

### Environment Variables

-  Use `.env` files for configuration
-  Separate development and production configs
-  Never commit sensitive keys to repository

## Security Considerations

### Camera Access

-  Request camera permissions properly
-  Handle permission denials gracefully
-  Use HTTPS for camera access in production
-  Implement proper error boundaries

### Data Privacy

-  Process images locally when possible
-  Implement proper data retention policies
-  Provide clear privacy notices
-  Allow users to delete captured images

## Testing Strategy

### Unit Testing

-  Test custom hooks with React Testing Library
-  Test utility functions independently
-  Mock camera APIs for testing
-  Test error scenarios thoroughly

### Integration Testing

-  Test complete photo capture flow
-  Test face detection with mock data
-  Test responsive design across devices
-  Test accessibility features

## Accessibility

### Camera Interface

-  Provide keyboard navigation for controls
-  Include proper ARIA labels
-  Support screen readers for status updates
-  Implement high contrast mode support

### Photo Capture

-  Provide alternative text for images
-  Support keyboard shortcuts for capture
-  Include audio feedback for actions
-  Ensure proper focus management

## Future Enhancements

### Planned Features

-  Multiple photo templates
-  Social media sharing integration
-  Photo gallery with local storage
-  Advanced emotion analysis
-  Real-time filters and effects

### Technical Improvements

-  Web Workers for face detection
-  WebAssembly for better performance
-  Progressive Web App features
-  Offline functionality
-  Advanced caching strategies

## Development Workflow

### Git Conventions

-  Use conventional commits
-  Create feature branches for new functionality
-  Implement proper code review process
-  Use semantic versioning for releases

### Code Quality

-  Use ESLint and Prettier for code formatting
-  Implement pre-commit hooks
-  Use TypeScript strict mode
-  Regular dependency updates

### Documentation

-  Document all public APIs
-  Maintain README with setup instructions
-  Document deployment procedures
-  Keep architecture decisions recorded
