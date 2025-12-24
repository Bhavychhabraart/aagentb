import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        const fovLength = 100;
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
            {/* FOV Cone with premium gradient */}
            <svg
              className={cn(
                "absolute pointer-events-none transition-all duration-300 camera-fov-cone",
                isSelected ? "opacity-90" : "opacity-50"
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
                  <stop offset="0%" stopColor="hsl(185 80% 50%)" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="hsl(217 100% 58%)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(217 100% 58%)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`fov-stroke-${camera.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(185 80% 50%)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(217 100% 58%)" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <polygon
                points={`
                  ${fovLength * 1.25},${fovLength}
                  ${fovLength * 2.5},${fovLength - Math.tan(fovHalfAngle * Math.PI / 180) * fovLength * 1.25}
                  ${fovLength * 2.5},${fovLength + Math.tan(fovHalfAngle * Math.PI / 180) * fovLength * 1.25}
                `}
                fill={`url(#fov-gradient-${camera.id})`}
                stroke={`url(#fov-stroke-${camera.id})`}
                strokeWidth="2"
                strokeDasharray={isSelected ? "0" : "4 4"}
              />
            </svg>

            {/* Camera Icon - Premium styled */}
            <button
              className={cn(
                "camera-icon relative z-10 border-2 transition-all duration-300",
                isSelected 
                  ? "w-12 h-12 camera-icon-selected border-white" 
                  : "w-10 h-10 border-white/50 hover:border-white hover:scale-105"
              )}
              onMouseDown={(e) => handleMouseDown(e, camera)}
              onClick={(e) => {
                e.stopPropagation();
                onCameraSelect(camera.id);
              }}
            >
              <Camera className={cn(
                "text-white transition-all",
                isSelected ? "h-5 w-5" : "h-4 w-4"
              )} />
              
              {/* Glow ring when selected */}
              {isSelected && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping" />
              )}
            </button>

            {/* Camera Name Label */}
            <div 
              className={cn(
                "absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300",
                isSelected 
                  ? "glass-premium text-foreground shadow-glow" 
                  : "glass text-foreground/80"
              )}
              style={{ top: '100%' }}
            >
              {camera.name}
            </div>

            {/* Rotation Handle (only when selected) */}
            {isSelected && (
              <button
                className="absolute z-20 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-cyan-500 border-2 border-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-glow hover:scale-110 transition-transform"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${camera.rotation}deg) translateY(-35px)`,
                }}
                onMouseDown={(e) => handleRotateStart(e, camera)}
              >
                <RotateCw className="h-3.5 w-3.5 text-white" />
              </button>
            )}

            {/* Delete Button (only when selected) */}
            {isSelected && (
              <button
                className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onCameraDelete(camera.id);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
