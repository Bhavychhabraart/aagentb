import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RotateCw, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CameraData {
  id: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotation: number; // degrees 0-360
  fovAngle: number; // degrees 30-120
  captureWidth: number;
  captureHeight: number;
}

interface CameraPlacementProps {
  cameras: CameraData[];
  selectedCameraId: string | null;
  onCameraSelect: (cameraId: string | null) => void;
  onCameraUpdate: (camera: CameraData) => void;
  onCameraDelete: (cameraId: string) => void;
  containerClassName?: string;
}

export function CameraPlacement({
  cameras,
  selectedCameraId,
  onCameraSelect,
  onCameraUpdate,
  onCameraDelete,
  containerClassName,
}: CameraPlacementProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, camera: CameraData) => {
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const cameraX = (camera.x / 100) * rect.width;
    const cameraY = (camera.y / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - cameraX,
      y: e.clientY - rect.top - cameraY,
    });
    setIsDragging(true);
    onCameraSelect(camera.id);
  }, [onCameraSelect]);

  const handleRotateStart = useCallback((e: React.MouseEvent, camera: CameraData) => {
    e.stopPropagation();
    setIsRotating(true);
    onCameraSelect(camera.id);
  }, [onCameraSelect]);

  useEffect(() => {
    if (!isDragging && !isRotating) return;
    
    const selectedCamera = cameras.find(c => c.id === selectedCameraId);
    if (!selectedCamera) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      
      if (isDragging) {
        const newX = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
        const newY = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
        
        onCameraUpdate({
          ...selectedCamera,
          x: Math.max(5, Math.min(95, newX)),
          y: Math.max(5, Math.min(95, newY)),
        });
      } else if (isRotating) {
        const centerX = rect.left + (selectedCamera.x / 100) * rect.width;
        const centerY = rect.top + (selectedCamera.y / 100) * rect.height;
        
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const normalizedAngle = (angle + 90 + 360) % 360;
        
        onCameraUpdate({
          ...selectedCamera,
          rotation: Math.round(normalizedAngle),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsRotating(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isRotating, selectedCameraId, cameras, dragOffset, onCameraUpdate]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      onCameraSelect(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative", containerClassName)}
      onClick={handleContainerClick}
    >
      {cameras.map((camera) => {
        const isSelected = camera.id === selectedCameraId;
        const fovLength = 80; // pixels
        const fovHalfAngle = camera.fovAngle / 2;
        
        return (
          <div
            key={camera.id}
            className="absolute"
            style={{
              left: `${camera.x}%`,
              top: `${camera.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* FOV Cone */}
            <svg
              className={cn(
                "absolute pointer-events-none transition-opacity",
                isSelected ? "opacity-80" : "opacity-40"
              )}
              style={{
                width: fovLength * 2.5,
                height: fovLength * 2,
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${camera.rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <defs>
                <linearGradient id={`fov-gradient-${camera.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`
                  ${fovLength * 1.25},${fovLength}
                  ${fovLength * 2.5},${fovLength - Math.tan(fovHalfAngle * Math.PI / 180) * fovLength * 1.25}
                  ${fovLength * 2.5},${fovLength + Math.tan(fovHalfAngle * Math.PI / 180) * fovLength * 1.25}
                `}
                fill={`url(#fov-gradient-${camera.id})`}
                stroke="rgb(34, 211, 238)"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
            </svg>

            {/* Camera Icon */}
            <button
              className={cn(
                "relative z-10 flex items-center justify-center rounded-full transition-all cursor-move",
                "border-2 shadow-lg",
                isSelected 
                  ? "w-10 h-10 bg-cyan-500 border-white text-white scale-110" 
                  : "w-8 h-8 bg-cyan-500/80 border-cyan-300 text-white hover:scale-105"
              )}
              onMouseDown={(e) => handleMouseDown(e, camera)}
              onClick={(e) => {
                e.stopPropagation();
                onCameraSelect(camera.id);
              }}
            >
              <Camera className={cn("transition-all", isSelected ? "h-5 w-5" : "h-4 w-4")} />
            </button>

            {/* Camera Name Label */}
            <div 
              className={cn(
                "absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap transition-all",
                isSelected 
                  ? "bg-cyan-500 text-white" 
                  : "bg-black/60 text-white/90"
              )}
              style={{ top: '100%' }}
            >
              {camera.name}
            </div>

            {/* Rotation Handle (only when selected) */}
            {isSelected && (
              <button
                className="absolute z-20 w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg hover:scale-110 transition-transform"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${camera.rotation}deg) translateY(-30px)`,
                }}
                onMouseDown={(e) => handleRotateStart(e, camera)}
              >
                <RotateCw className="h-3 w-3 text-white" />
              </button>
            )}

            {/* Delete Button (only when selected) */}
            {isSelected && (
              <button
                className="absolute -top-2 -right-2 z-20 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onCameraDelete(camera.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
