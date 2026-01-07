import { useState, useEffect, useCallback, RefObject } from 'react';
import { cn } from '@/lib/utils';
import { 
  getContainedImageBounds, 
  imagePercentageToPixel,
  type ImageBounds 
} from '@/utils/imageContainBounds';
import { Zone } from './ZoneSelector';

interface ZoneOverlayProps {
  zones: Zone[];
  selectedZoneId: string | null;
  containerRef: RefObject<HTMLDivElement>;
  imageRef: RefObject<HTMLImageElement>;
  onZoneClick?: (zone: Zone) => void;
}

/**
 * ZoneOverlay renders zones with pixel-perfect positioning that accounts for
 * object-contain letterboxing. This ensures zones appear exactly where they were drawn.
 */
export function ZoneOverlay({
  zones,
  selectedZoneId,
  containerRef,
  imageRef,
  onZoneClick,
}: ZoneOverlayProps) {
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);

  // Calculate actual image bounds accounting for object-contain letterboxing
  const calculateBounds = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    
    if (naturalWidth === 0 || naturalHeight === 0) return;
    
    const bounds = getContainedImageBounds(
      containerRect.width,
      containerRect.height,
      naturalWidth,
      naturalHeight
    );
    setImageBounds(bounds);
  }, [containerRef, imageRef]);

  // Set up ResizeObserver to recalculate on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    calculateBounds();
    
    const observer = new ResizeObserver(calculateBounds);
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [calculateBounds, containerRef]);

  // Recalculate when image loads
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    
    const handleLoad = () => calculateBounds();
    img.addEventListener('load', handleLoad);
    
    // Also calculate immediately in case image is already loaded
    if (img.complete) {
      calculateBounds();
    }
    
    return () => img.removeEventListener('load', handleLoad);
  }, [imageRef, calculateBounds]);

  if (!imageBounds || zones.length === 0) return null;

  // Convert zone percentage coordinates to pixel positions
  const getZonePixelRect = (zone: Zone) => {
    const topLeft = imagePercentageToPixel(zone.x_start, zone.y_start, imageBounds);
    const bottomRight = imagePercentageToPixel(zone.x_end, zone.y_end, imageBounds);
    
    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  };

  // Convert polygon points to pixel coordinates for SVG
  const getPolygonPixelPoints = (zone: Zone): string => {
    if (!zone.polygon_points || zone.polygon_points.length < 3) {
      // Fallback to rectangle points if no polygon
      const topLeft = imagePercentageToPixel(zone.x_start, zone.y_start, imageBounds);
      const topRight = imagePercentageToPixel(zone.x_end, zone.y_start, imageBounds);
      const bottomRight = imagePercentageToPixel(zone.x_end, zone.y_end, imageBounds);
      const bottomLeft = imagePercentageToPixel(zone.x_start, zone.y_end, imageBounds);
      return `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`;
    }
    
    return zone.polygon_points
      .map(p => {
        const pixel = imagePercentageToPixel(p.x, p.y, imageBounds);
        return `${pixel.x},${pixel.y}`;
      })
      .join(' ');
  };

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
      {zones.map((zone) => {
        const labelPos = imagePercentageToPixel(zone.x_start, zone.y_start, imageBounds);
        const isSelected = selectedZoneId === zone.id;
        
        return (
          <g key={zone.id}>
            <polygon
              points={getPolygonPixelPoints(zone)}
              className={cn(
                "transition-all pointer-events-auto cursor-pointer",
                isSelected
                  ? "fill-primary/15 stroke-primary"
                  : "fill-amber-500/10 stroke-amber-500/60 hover:fill-amber-500/20 hover:stroke-amber-400"
              )}
              strokeWidth="2"
              onClick={(e) => {
                e.stopPropagation();
                onZoneClick?.(zone);
              }}
            />
            {/* Zone label positioned at top-left corner */}
            <foreignObject
              x={labelPos.x + 4}
              y={labelPos.y + 4}
              width="120"
              height="24"
              className="overflow-visible pointer-events-none"
            >
              <div className="px-2 py-0.5 bg-black/70 rounded text-[10px] text-white font-medium w-fit whitespace-nowrap">
                {zone.name}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
