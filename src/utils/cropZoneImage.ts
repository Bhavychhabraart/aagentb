import { PolygonPoint } from '@/components/canvas/ZoneSelector';

/**
 * Crops a rectangular zone from an image using bounding box coordinates (percentages)
 * Enhanced for maximum accuracy with extensive validation and debugging
 */
export async function cropRectangleFromImage(
  imageUrl: string,
  bounds: { x_start: number; y_start: number; x_end: number; y_end: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║              ZONE CROPPING - ACCURACY MODE                    ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        
        // STEP 1: VALIDATE input bounds
        if (typeof bounds.x_start !== 'number' || typeof bounds.y_start !== 'number' ||
            typeof bounds.x_end !== 'number' || typeof bounds.y_end !== 'number') {
          throw new Error('Invalid bounds: all coordinates must be numbers');
        }
        
        console.log('INPUT BOUNDS (raw):', {
          x_start: bounds.x_start,
          y_start: bounds.y_start,
          x_end: bounds.x_end,
          y_end: bounds.y_end,
        });
        
        // STEP 2: Round to 2 decimal places for precision
        const roundedBounds = {
          x_start: Math.round(bounds.x_start * 100) / 100,
          y_start: Math.round(bounds.y_start * 100) / 100,
          x_end: Math.round(bounds.x_end * 100) / 100,
          y_end: Math.round(bounds.y_end * 100) / 100,
        };
        
        // STEP 3: CLAMP coordinates to valid range 0-100
        const clampedBounds = {
          x_start: Math.max(0, Math.min(100, roundedBounds.x_start)),
          y_start: Math.max(0, Math.min(100, roundedBounds.y_start)),
          x_end: Math.max(0, Math.min(100, roundedBounds.x_end)),
          y_end: Math.max(0, Math.min(100, roundedBounds.y_end)),
        };
        
        // STEP 4: Ensure end > start (handle inverted selection)
        const finalBounds = {
          x_start: Math.min(clampedBounds.x_start, clampedBounds.x_end),
          y_start: Math.min(clampedBounds.y_start, clampedBounds.y_end),
          x_end: Math.max(clampedBounds.x_start, clampedBounds.x_end),
          y_end: Math.max(clampedBounds.y_start, clampedBounds.y_end),
        };
        
        // Calculate dimensions
        const widthPercent = finalBounds.x_end - finalBounds.x_start;
        const heightPercent = finalBounds.y_end - finalBounds.y_start;
        
        console.log('FINAL BOUNDS (validated):', finalBounds);
        console.log('ZONE SIZE:', `${widthPercent.toFixed(1)}% × ${heightPercent.toFixed(1)}%`);
        
        // STEP 5: Validate minimum dimensions
        if (widthPercent < 0.5 || heightPercent < 0.5) {
          throw new Error(`Zone too small: ${widthPercent.toFixed(1)}% x ${heightPercent.toFixed(1)}% (min 0.5%)`);
        }
        
        // STEP 6: Get image natural dimensions
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        console.log('IMAGE DIMENSIONS:', `${imgWidth} × ${imgHeight}px`);
        
        // STEP 7: Calculate pixel coordinates from percentage values
        const cropX = Math.round((finalBounds.x_start / 100) * imgWidth);
        const cropY = Math.round((finalBounds.y_start / 100) * imgHeight);
        const cropWidth = Math.round((widthPercent / 100) * imgWidth);
        const cropHeight = Math.round((heightPercent / 100) * imgHeight);
        
        console.log('CROP RECT (pixels):', { cropX, cropY, cropWidth, cropHeight });
        
        // STEP 8: Ensure minimum canvas size
        const canvasWidth = Math.max(10, cropWidth);
        const canvasHeight = Math.max(10, cropHeight);
        
        // STEP 9: Create canvas with the cropped dimensions
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // STEP 10: Draw the cropped region with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight, // Source rect (from image)
          0, 0, canvasWidth, canvasHeight      // Dest rect (to canvas)
        );
        
        // STEP 11: Convert to base64 data URL (JPEG for smaller size, high quality)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log(`║  ✓ CROP SUCCESS: ${canvasWidth}×${canvasHeight}px                          `);
        console.log(`║  From (${finalBounds.x_start.toFixed(1)}%, ${finalBounds.y_start.toFixed(1)}%) to (${finalBounds.x_end.toFixed(1)}%, ${finalBounds.y_end.toFixed(1)}%)        `);
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        
        resolve(dataUrl);
      } catch (err) {
        console.error('CROP ERROR:', err);
        reject(err);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image for cropping');
      reject(new Error(`Failed to load image for cropping: ${imageUrl.substring(0, 100)}...`));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Crops a rectangular zone region from a render image and returns a base64 data URL
 * @deprecated Use cropRectangleFromImage instead
 */
export async function cropZoneFromRender(
  renderUrl: string,
  zone: { x: number; y: number; width: number; height: number }
): Promise<string> {
  return cropRectangleFromImage(renderUrl, {
    x_start: zone.x,
    y_start: zone.y,
    x_end: zone.x + zone.width,
    y_end: zone.y + zone.height,
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
