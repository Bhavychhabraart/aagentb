/**
 * Represents the actual rendered bounds of an image using object-contain
 */
export interface ImageBounds {
  x: number;      // Left offset in pixels (letterbox padding)
  y: number;      // Top offset in pixels (letterbox padding)
  width: number;  // Rendered width in pixels
  height: number; // Rendered height in pixels
}

/**
 * Calculates the actual rendered bounds of an image with object-contain
 * inside its container, accounting for letterboxing.
 * 
 * @param containerWidth - Width of the container element in pixels
 * @param containerHeight - Height of the container element in pixels
 * @param imageNaturalWidth - Natural width of the image in pixels
 * @param imageNaturalHeight - Natural height of the image in pixels
 * @returns The actual rendered bounds of the image within the container
 */
export function getContainedImageBounds(
  containerWidth: number,
  containerHeight: number,
  imageNaturalWidth: number,
  imageNaturalHeight: number
): ImageBounds {
  if (containerWidth === 0 || containerHeight === 0 || 
      imageNaturalWidth === 0 || imageNaturalHeight === 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  const containerAspect = containerWidth / containerHeight;
  const imageAspect = imageNaturalWidth / imageNaturalHeight;
  
  let renderedWidth: number;
  let renderedHeight: number;
  
  if (imageAspect > containerAspect) {
    // Image is wider than container - constrained by width, has vertical letterbox
    renderedWidth = containerWidth;
    renderedHeight = containerWidth / imageAspect;
  } else {
    // Image is taller than container - constrained by height, has horizontal letterbox
    renderedHeight = containerHeight;
    renderedWidth = containerHeight * imageAspect;
  }
  
  return {
    x: (containerWidth - renderedWidth) / 2,
    y: (containerHeight - renderedHeight) / 2,
    width: renderedWidth,
    height: renderedHeight
  };
}

/**
 * Converts pixel coordinates to percentage coordinates relative to actual image bounds
 * 
 * @param clientX - Client X coordinate from mouse event
 * @param clientY - Client Y coordinate from mouse event
 * @param containerRect - Bounding rect of the container element
 * @param imageBounds - The actual rendered image bounds
 * @returns Percentage coordinates (0-100) or null if outside image bounds
 */
export function pixelToImagePercentage(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  imageBounds: ImageBounds
): { x: number; y: number } | null {
  // Calculate position relative to container
  const containerX = clientX - containerRect.left;
  const containerY = clientY - containerRect.top;
  
  // Calculate position relative to actual image
  const imageX = containerX - imageBounds.x;
  const imageY = containerY - imageBounds.y;
  
  // Check if click is outside image bounds (in letterbox area)
  if (imageX < 0 || imageX > imageBounds.width ||
      imageY < 0 || imageY > imageBounds.height) {
    return null;
  }
  
  // Convert to percentage (0-100) relative to image
  return {
    x: Math.max(0, Math.min(100, (imageX / imageBounds.width) * 100)),
    y: Math.max(0, Math.min(100, (imageY / imageBounds.height) * 100)),
  };
}

/**
 * Converts percentage coordinates (relative to image) to pixel position in container
 * 
 * @param percentX - X percentage (0-100) relative to image
 * @param percentY - Y percentage (0-100) relative to image
 * @param imageBounds - The actual rendered image bounds
 * @returns Pixel position relative to container
 */
export function imagePercentageToPixel(
  percentX: number,
  percentY: number,
  imageBounds: ImageBounds
): { x: number; y: number } {
  return {
    x: imageBounds.x + (percentX / 100) * imageBounds.width,
    y: imageBounds.y + (percentY / 100) * imageBounds.height,
  };
}
