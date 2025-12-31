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
  // Gemini supported aspect ratios
  const supported = [
    { name: '16:9', value: 16 / 9 },   // 1.778 - Landscape wide
    { name: '4:3', value: 4 / 3 },     // 1.333 - Landscape standard
    { name: '1:1', value: 1 },          // 1.000 - Square
    { name: '3:4', value: 3 / 4 },     // 0.750 - Portrait standard
    { name: '9:16', value: 9 / 16 },   // 0.5625 - Portrait tall
  ];
  
  let closest = supported[0];
  let minDiff = Math.abs(ratio - supported[0].value);
  
  for (const s of supported) {
    const diff = Math.abs(ratio - s.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  
  return closest.name;
}
