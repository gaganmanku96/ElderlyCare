// Expert screenshot capture hook with state-based triggers and performance optimization
// Implements Gemini's recommended approach for declarative, invisible screenshot updates

import { useEffect, useCallback, type RefObject } from 'react';
import html2canvas from 'html2canvas';
import { useDebounce } from './useDebounce';

/**
 * Custom hook for intelligent screenshot capture based on app state changes
 * @param elementRef - React ref to the DOM element to capture (nullable)
 * @param triggerDependency - State value that triggers capture when changed
 * @param onScreenshotUpdate - Callback to handle the captured screenshot
 * @param debounceTime - Debounce delay in milliseconds (default: 1500ms)
 */
export function useScreenshotCapture(
  elementRef: RefObject<HTMLElement | null>,
  triggerDependency: any,
  onScreenshotUpdate: (imageData: string, metadata: any) => Promise<void>,
  debounceTime: number = 1500
) {
  
  const captureScreenshot = useCallback(async () => {
    if (!elementRef.current) {
      console.warn('Screenshot capture: Element ref is null');
      return;
    }

    try {
      // Ensure browser has painted the latest DOM state
      // requestAnimationFrame ensures we capture after the next paint cycle
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Additional small delay to ensure complex UI transitions are complete
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Capturing screenshot for state:', triggerDependency);

      // Capture with performance-optimized settings
      const canvas = await html2canvas(elementRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: 0.75, // 75% resolution for better performance
        width: elementRef.current.offsetWidth,
        height: elementRef.current.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        // Ignore floating elements that shouldn't be in screenshots
        ignoreElements: (element) => {
          return element.classList?.contains('floating-assistant') || 
                 element.classList?.contains('assistant-overlay') ||
                 element.classList?.contains('tooltip') ||
                 element.classList?.contains('hover-effect');
        }
      });

      // Convert to JPEG with 80% quality for smaller file size
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Create metadata
      const metadata = {
        appName: typeof triggerDependency === 'string' ? triggerDependency : 'unknown',
        timestamp: new Date(),
        resolution: {
          width: canvas.width,
          height: canvas.height
        }
      };

      // Send to callback (AI service)
      await onScreenshotUpdate(imageData, metadata);
      
      console.log('Screenshot captured and processed successfully');

    } catch (error) {
      console.error('Screenshot capture failed:', error);
      // Don't throw - gracefully handle failures
    }
  }, [elementRef, triggerDependency, onScreenshotUpdate]);

  // Debounce the capture function to prevent excessive captures
  const debouncedCapture = useDebounce(captureScreenshot, debounceTime);

  // Trigger capture when dependency changes (smart state-based triggering)
  useEffect(() => {
    // Only trigger if we have a valid dependency and it's not the initial undefined
    if (triggerDependency !== undefined && triggerDependency !== null) {
      console.log('Screenshot trigger activated:', triggerDependency);
      debouncedCapture();
    }
  }, [triggerDependency, debouncedCapture]);

  // Return manual capture function for special cases
  return captureScreenshot;
}