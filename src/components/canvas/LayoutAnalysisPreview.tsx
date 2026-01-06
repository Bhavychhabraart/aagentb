import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Sparkles, Grid3X3, RefreshCw, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, MapPin, Square, DoorOpen, Eye, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Layout analysis types (matching analyze-layout edge function)
export interface LayoutAnalysis {
  roomShape: 'rectangular' | 'L-shaped' | 'square' | 'irregular';
  dimensions: {
    width: number;
    depth: number;
    height: number;
    unit: 'feet' | 'meters';
  };
  aspectRatio: string;
  walls: {
    position: 'north' | 'south' | 'east' | 'west';
    length: number;
    features: { type: string; positionPercent: number; widthPercent: number }[];
  }[];
  windows: {
    wall: 'north' | 'south' | 'east' | 'west';
    positionPercent: number;
    widthPercent: number;
    heightPercent: number;
    type: string;
  }[];
  doors: {
    wall: 'north' | 'south' | 'east' | 'west';
    positionPercent: number;
    widthPercent: number;
    type: string;
    swingDirection: string;
  }[];
  furnitureZones: {
    name: string;
    label: string;
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
    suggestedItems: string[];
  }[];
  cameraRecommendation: {
    position: string;
    angle: number;
    height: string;
    fov: string;
  };
  gridOverlay: string;
}

interface LayoutAnalysisPreviewProps {
  layoutImageUrl: string;
  analysis: LayoutAnalysis | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  onAnalyze: () => void;
  onConfirm: (analysis: LayoutAnalysis) => void;
  onCancel: () => void;
  isGenerating: boolean;
}

export function LayoutAnalysisPreview({
  layoutImageUrl,
  analysis,
  isAnalyzing,
  analysisError,
  onAnalyze,
  onConfirm,
  onCancel,
  isGenerating,
}: LayoutAnalysisPreviewProps) {
  const [showFurnitureZones, setShowFurnitureZones] = useState(true);
  const [showArchitectural, setShowArchitectural] = useState(true);

  // Auto-trigger analysis when modal opens if not already analyzed
  useEffect(() => {
    if (!analysis && !isAnalyzing && !analysisError) {
      onAnalyze();
    }
  }, [analysis, isAnalyzing, analysisError, onAnalyze]);

  const formatWallName = (wall: string) => {
    return wall.charAt(0).toUpperCase() + wall.slice(1);
  };

  const handleConfirm = () => {
    if (analysis) {
      onConfirm(analysis);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex animate-in fade-in duration-200">
      {/* Left side - Layout preview */}
      <div className="flex-1 p-6 lg:p-10 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Grid3X3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Layout Analysis Preview</h2>
            <p className="text-sm text-muted-foreground">
              AI analyzing floor plan for accurate render generation
            </p>
          </div>
        </div>
        
        {/* Large preview area */}
        <div className="flex-1 rounded-xl border border-border bg-muted/20 overflow-hidden flex items-center justify-center p-4">
          {layoutImageUrl ? (
            <img
              src={layoutImageUrl}
              alt="Floor plan layout"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Loading layout...</span>
            </div>
          )}
        </div>

        {/* ASCII Grid Overlay (if available) */}
        {analysis?.gridOverlay && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border overflow-x-auto">
            <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre leading-tight">
              {analysis.gridOverlay}
            </pre>
          </div>
        )}
      </div>

      {/* Right side - Analysis results panel */}
      <div className="w-full max-w-md border-l border-border bg-card flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="font-medium">Verify Analysis</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCancel}
            disabled={isGenerating}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable analysis area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* STEP 1: Analyze Layout Section */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/30 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                  analysis ? "bg-green-500/20 text-green-600" : "bg-primary/20 text-primary"
                )}>
                  {analysis ? <CheckCircle2 className="h-4 w-4" /> : "1"}
                </div>
                <span className="font-medium text-sm">Layout Analysis</span>
              </div>
              {analysis && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                  className="h-7 text-xs"
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", isAnalyzing && "animate-spin")} />
                  Re-analyze
                </Button>
              )}
            </div>

            {/* Analysis Status/Results */}
            <div className="p-3">
              {isAnalyzing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>AI analyzing floor plan structure...</span>
                </div>
              ) : analysisError ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{analysisError}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAnalyze}
                    className="w-full"
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  {/* Room Shape & Dimensions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium capitalize">
                      {analysis.roomShape} Room
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {analysis.dimensions.width}ft × {analysis.dimensions.depth}ft × {analysis.dimensions.height}ft
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      ({analysis.aspectRatio})
                    </span>
                  </div>

                  {/* Windows & Doors */}
                  <div>
                    <button
                      onClick={() => setShowArchitectural(!showArchitectural)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-2"
                    >
                      {showArchitectural ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      Architectural Features ({analysis.windows.length} windows, {analysis.doors.length} doors)
                    </button>
                    
                    {showArchitectural && (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {analysis.windows.map((window, idx) => (
                          <div key={`window-${idx}`} className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2">
                            <Square className="h-3 w-3 text-blue-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">Window</span>
                              <span className="text-muted-foreground ml-1">
                                on {formatWallName(window.wall)} wall @ {window.positionPercent.toFixed(0)}%
                              </span>
                            </div>
                            <span className="text-muted-foreground shrink-0 capitalize">{window.type}</span>
                          </div>
                        ))}
                        {analysis.doors.map((door, idx) => (
                          <div key={`door-${idx}`} className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2">
                            <DoorOpen className="h-3 w-3 text-amber-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">Door</span>
                              <span className="text-muted-foreground ml-1">
                                on {formatWallName(door.wall)} wall @ {door.positionPercent.toFixed(0)}%
                              </span>
                            </div>
                            <span className="text-muted-foreground shrink-0 capitalize">{door.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Furniture Zones */}
                  {analysis.furnitureZones.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowFurnitureZones(!showFurnitureZones)}
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-2"
                      >
                        {showFurnitureZones ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        Furniture Zones ({analysis.furnitureZones.length} areas)
                      </button>
                      
                      {showFurnitureZones && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {analysis.furnitureZones.map((zone, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs bg-muted/50 rounded p-2">
                              <MapPin className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{zone.label}</span>
                                <div className="text-muted-foreground">
                                  Position: ({zone.xStart.toFixed(0)}% - {zone.xEnd.toFixed(0)}%) × ({zone.yStart.toFixed(0)}% - {zone.yEnd.toFixed(0)}%)
                                </div>
                                {zone.suggestedItems.length > 0 && (
                                  <div className="text-muted-foreground mt-0.5">
                                    Suggested: {zone.suggestedItems.slice(0, 3).join(', ')}
                                    {zone.suggestedItems.length > 3 && ` +${zone.suggestedItems.length - 3} more`}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Camera Recommendation */}
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                    <span className="font-medium">Camera: </span>
                    {analysis.cameraRecommendation.position} corner, {analysis.cameraRecommendation.height}, {analysis.cameraRecommendation.fov} FOV
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Analysis will start automatically...
                </p>
              )}
            </div>
          </div>

          {/* STEP 2: Generation Info */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                analysis ? "bg-primary/10" : "bg-muted"
              )}>
                <Maximize2 className={cn("h-4 w-4", analysis ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <h3 className="font-medium text-sm">Isometric 3D Render</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis 
                    ? `Generate a photorealistic isometric view of your ${analysis.roomShape} room (${analysis.dimensions.width}×${analysis.dimensions.depth}ft) with precise window and door placement.`
                    : 'Complete analysis first to see generation details.'}
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Two-Stage Accuracy Pipeline:</p>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center text-[10px] font-bold">✓</div>
              <span>Stage 1: AI analyzes layout structure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                analysis ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>2</div>
              <span>Stage 2: Generate precise isometric render</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Generate Button */}
          <Button
            className="w-full h-12"
            onClick={handleConfirm}
            disabled={!analysis || isGenerating || isAnalyzing}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Generating Render...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                <span>Generate Isometric View</span>
              </>
            )}
          </Button>

          {/* Progress indicator during generation */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-muted-foreground">Generating photorealistic render...</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-2/3 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
