import { SelectionRegion } from '@/components/canvas/SelectionOverlay';

/**
 * Generates a white-on-black mask image from a selection region.
 * The white area represents where edits should be applied.
 * 
 * @param region - The selection region with x, y, width, height as percentages (0-100)
 * @param width - The width of the output image (default 1024 for AI compatibility)
 * @param height - The height of the output image (default 576 for 16:9 aspect ratio)
 * @returns A base64 data URL of the mask image (PNG format)
 */
export async function generateSelectionMask(
  region: SelectionRegion,
  width: number = 1024,
  height: number = 576
): Promise<string> {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }
  
  // Fill with black (area to preserve)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  
  // Calculate pixel coordinates from percentages
  const x = (region.x / 100) * width;
  const y = (region.y / 100) * height;
  const w = (region.width / 100) * width;
  const h = (region.height / 100) * height;
  
  // Draw white rectangle (area to edit)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, w, h);
  
  // Convert to base64 data URL
  return canvas.toDataURL('image/png');
}

/**
 * Generates a preview thumbnail showing the selection area highlighted on the render.
 * 
 * @param renderUrl - URL of the current render image
 * @param region - The selection region with x, y, width, height as percentages (0-100)
 * @param size - Output size for the thumbnail (default 200px)
 * @returns A base64 data URL of the preview thumbnail
 */
export async function generateSelectionPreview(
  renderUrl: string,
  region: SelectionRegion,
  size: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Create canvas with proper aspect ratio
      const aspectRatio = img.width / img.height;
      const canvas = document.createElement('canvas');
      
      if (aspectRatio > 1) {
        canvas.width = size;
        canvas.height = size / aspectRatio;
      } else {
        canvas.width = size * aspectRatio;
        canvas.height = size;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2D context'));
        return;
      }
      
      // Draw the render image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Add semi-transparent overlay outside selection
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      
      // Calculate selection coords
      const x = (region.x / 100) * canvas.width;
      const y = (region.y / 100) * canvas.height;
      const w = (region.width / 100) * canvas.width;
      const h = (region.height / 100) * canvas.height;
      
      // Draw overlay regions (top, bottom, left, right)
      ctx.fillRect(0, 0, canvas.width, y); // Top
      ctx.fillRect(0, y + h, canvas.width, canvas.height - y - h); // Bottom
      ctx.fillRect(0, y, x, h); // Left
      ctx.fillRect(x + w, y, canvas.width - x - w, h); // Right
      
      // Draw selection border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load render image for preview'));
    };
    
    img.src = renderUrl;
  });
}
