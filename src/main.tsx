import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preloadCriticalResources, setupLazyLoading } from "./utils/seo";
import { suppressDevWarnings } from "./utils/console-cleanup";

// Initialize console cleanup and development optimizations
suppressDevWarnings();

// Preload critical resources for better performance
preloadCriticalResources();

// Setup lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', setupLazyLoading);

createRoot(document.getElementById("root")!).render(<App />);
