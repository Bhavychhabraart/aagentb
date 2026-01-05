/**
 * Utility for detecting and handling image aspect ratios.
 * Gemini supports: 1:1, 3:4, 4:3, 9:16, 16:9
 */

export async function getImageAspectRatio(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      resolve(getClosestSupportedRatio(ratio));
    };
    
    img.onerror = () => {
      console.warn('Failed to load image for aspect ratio detection, defaulting to 16:9');
      resolve('16:9');
    };
    
    // Timeout fallback
    const timeout = setTimeout(() => {
      console.warn('Image aspect ratio detection timed out, defaulting to 16:9');
      resolve('16:9');
    }, 5000);
    
    img.onload = () => {
      clearTimeout(timeout);
      const ratio = img.naturalWidth / img.naturalHeight;
      resolve(getClosestSupportedRatio(ratio));
    };
    
    img.src = imageUrl;
  });
}

export function getClosestSupportedRatio(ratio: number): string {
  // Bias toward 16:9 for widescreen renders (ratio >= 1.5)
  if (ratio >= 1.5) return '16:9';
  
  // Standard landscape (between square and widescreen)
  if (ratio >= 1.15 && ratio < 1.5) return '4:3';
  
  // Square-ish
  if (ratio >= 0.85 && ratio < 1.15) return '1:1';
  
  // Portrait standard
  if (ratio >= 0.65 && ratio < 0.85) return '3:4';
  
  // Portrait tall
  return '9:16';
}
