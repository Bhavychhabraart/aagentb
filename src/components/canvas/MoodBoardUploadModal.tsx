import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  uploadMoodBoard, 
  analyzeMoodBoard, 
  cropAndSaveProducts,
  MoodBoardAnalysis 
} from '@/services/moodBoardService';

interface MoodBoardUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onAnalysisComplete: (analysis: MoodBoardAnalysis, moodBoardId: string) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';

export function MoodBoardUploadModal({
  open,
  onOpenChange,
  projectId,
  onAnalysisComplete
}: MoodBoardUploadModalProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf')) {
      setFile(droppedFile);
      if (droppedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(droppedFile));
      } else {
        setPreview(null);
      }
      setError(null);
    } else {
      setError('Please upload an image or PDF file');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setPreview(null);
      }
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    
    if (!user) {
      toast.error('Please log in to upload mood boards');
      return;
    }

    setStatus('uploading');
    setError(null);

    try {
      // Upload the file
      const { moodBoard, fileUrl } = await uploadMoodBoard(file, projectId, user.id);
      
      setStatus('analyzing');
      toast.info('Analyzing mood board with AI...', { duration: 10000 });

      // Analyze with AI
      const analysis = await analyzeMoodBoard(moodBoard.id, [fileUrl]);

      // Save extracted products
      if (analysis.products?.length > 0) {
        await cropAndSaveProducts(moodBoard.id, fileUrl, analysis.products, user.id);
      }

      setStatus('complete');
      toast.success(`Found ${analysis.products?.length || 0} products and ${analysis.textAnnotations?.length || 0} annotations!`);
      
      // Notify parent
      onAnalysisComplete(analysis, moodBoard.id);
      
      // Close after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);

    } catch (err) {
      console.error('Mood board analysis error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Analysis failed');
      toast.error('Failed to analyze mood board');
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setError(null);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'analyzing':
        return <Sparkles className="w-5 h-5 animate-pulse text-amber-500" />;
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading mood board...';
      case 'analyzing':
        return 'AI is analyzing products, styles, and placements...';
      case 'complete':
        return 'Analysis complete!';
      case 'error':
        return error || 'Something went wrong';
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5 text-primary" />
            Upload Mood Board
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${file ? 'border-primary/50' : ''}
            `}
          >
            {preview ? (
              <div className="space-y-3">
                <img 
                  src={preview} 
                  alt="Mood board preview" 
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
                <p className="text-sm text-muted-foreground">{file?.name}</p>
              </div>
            ) : file ? (
              <div className="space-y-2">
                <FileImage className="w-12 h-12 mx-auto text-primary" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">PDF document</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Drop your mood board here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports images and PDF files
                  </p>
                </div>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-sm text-primary hover:underline cursor-pointer">
                    or browse files
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Status */}
          {status !== 'idle' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              {getStatusIcon()}
              <span className="text-sm">{getStatusText()}</span>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
            <p className="font-medium">AI will extract:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Individual product photos with names</li>
              <li>Placement instructions (e.g., "Rug under dining")</li>
              <li>Floor plan zones and product mapping</li>
              <li>Color palette and style references</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => { onOpenChange(false); resetState(); }}
              disabled={status === 'uploading' || status === 'analyzing'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={!file || status === 'uploading' || status === 'analyzing' || status === 'complete'}
            >
              {status === 'analyzing' ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
