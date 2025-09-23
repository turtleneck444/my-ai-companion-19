// Console cleanup utilities for better development experience

export const suppressDevWarnings = () => {
  // Suppress React DevTools download message in production
  if (import.meta.env.PROD) {
    const originalConsole = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('React DevTools')) {
        return; // Don't log React DevTools messages in production
      }
      originalConsole.apply(console, args);
    };
  }

  // Suppress specific router warnings that don't affect functionality
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('React Router Future Flag Warning') ||
      message.includes('v7_startTransition') ||
      message.includes('v7_relativeSplatPath')
    ) {
      return; // These warnings are now handled with future flags
    }
    originalWarn.apply(console, args);
  };
};

// Enhanced error boundary for better error handling
export const logError = (error: Error, errorInfo?: any) => {
  console.error('LoveAI Error:', error);
  if (errorInfo) {
    console.error('Error Info:', errorInfo);
  }
  
  // In production, you might want to send this to an error tracking service
  if (import.meta.env.PROD) {
    // Example: sendToErrorTracking(error, errorInfo);
  }
};

// Safe function executor with error handling
export const safeExecute = <T>(
  fn: () => T,
  fallback: T,
  errorMessage: string = 'Safe execution failed'
): T => {
  try {
    return fn();
  } catch (error) {
    console.warn(errorMessage, error);
    return fallback;
  }
};

// Debug helper for development
export const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`🔧 LoveAI Debug: ${message}`, data || '');
  }
}; 