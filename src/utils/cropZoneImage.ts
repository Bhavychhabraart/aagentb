import { PolygonPoint } from '@/components/canvas/ZoneSelector';

/**
 * Crops a rectangular zone region from a render image and returns a base64 data URL
 * @deprecated Use cropPolygonFromRender instead
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

/**
 * Crops a polygon zone from a render image and returns a base64 data URL
 * The cropped image includes only the area within the polygon, with transparent background
 */
export async function cropPolygonFromRender(
  renderUrl: string,
  polygonPoints: PolygonPoint[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (polygonPoints.length < 3) {
      reject(new Error('Polygon must have at least 3 points'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Calculate bounding box in percentages
        const minXPercent = Math.min(...polygonPoints.map(p => p.x));
        const maxXPercent = Math.max(...polygonPoints.map(p => p.x));
        const minYPercent = Math.min(...polygonPoints.map(p => p.y));
        const maxYPercent = Math.max(...polygonPoints.map(p => p.y));
        
        // Convert to pixels
        const minX = (minXPercent / 100) * img.naturalWidth;
        const maxX = (maxXPercent / 100) * img.naturalWidth;
        const minY = (minYPercent / 100) * img.naturalHeight;
        const maxY = (maxYPercent / 100) * img.naturalHeight;
        
        const cropWidth = maxX - minX;
        const cropHeight = maxY - minY;
        
        // Convert polygon points to pixel coordinates relative to crop area
        const pixelPoints = polygonPoints.map(p => ({
          x: ((p.x / 100) * img.naturalWidth) - minX,
          y: ((p.y / 100) * img.naturalHeight) - minY,
        }));
        
        // Create canvas for the cropped area
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Create clipping path from polygon
        ctx.beginPath();
        pixelPoints.forEach((p, i) => {
          if (i === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        });
        ctx.closePath();
        ctx.clip();
        
        // Draw the cropped region of the image
        ctx.drawImage(
          img,
          minX, minY, cropWidth, cropHeight,  // Source rect
          0, 0, cropWidth, cropHeight          // Dest rect
        );
        
        // Convert to base64 data URL (PNG to preserve transparency)
        const dataUrl = canvas.toDataURL('image/png');
        
        console.log(`Cropped polygon zone: ${cropWidth.toFixed(0)}x${cropHeight.toFixed(0)}px with ${polygonPoints.length} points`);
        
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

/**
 * Get bounding box from polygon points
 */
export function getPolygonBoundingBox(points: PolygonPoint[]): {
  x_start: number;
  y_start: number;
  x_end: number;
  y_end: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { x_start: 0, y_start: 0, x_end: 0, y_end: 0, width: 0, height: 0 };
  }
  
  const x_start = Math.min(...points.map(p => p.x));
  const y_start = Math.min(...points.map(p => p.y));
  const x_end = Math.max(...points.map(p => p.x));
  const y_end = Math.max(...points.map(p => p.y));
  
  return {
    x_start,
    y_start,
    x_end,
    y_end,
    width: x_end - x_start,
    height: y_end - y_start,
  };
}
