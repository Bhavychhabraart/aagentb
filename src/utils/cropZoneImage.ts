/**
 * Crops a zone region from a render image and returns a base64 data URL
 */
export async function cropZoneFromRender(
  renderUrl: string,
  zone: { x: number; y: number; width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Calculate pixel coordinates from percentage values
        const cropX = (zone.x / 100) * img.naturalWidth;
        const cropY = (zone.y / 100) * img.naturalHeight;
        const cropWidth = (zone.width / 100) * img.naturalWidth;
        const cropHeight = (zone.height / 100) * img.naturalHeight;
        
        // Create canvas with the cropped dimensions
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw the cropped region
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight, // Source rect
          0, 0, cropWidth, cropHeight          // Dest rect
        );
        
        // Convert to base64 data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        console.log(`Cropped zone: ${cropWidth.toFixed(0)}x${cropHeight.toFixed(0)}px from ${zone.x.toFixed(1)}%,${zone.y.toFixed(1)}%`);
        
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for cropping'));
    };
    
    img.src = renderUrl;
  });
}
