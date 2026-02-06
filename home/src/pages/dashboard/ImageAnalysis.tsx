import { useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Image as ImageIcon,
  Cpu,
  Eye,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  Crosshair,
  RotateCcw,
  ChevronRight,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pushPipelineResultsToStore } from '@/store/detectionHistory';

const API_BASE = 'http://localhost:8000';

// ── Types ──

interface CropInfo {
  id: string;
  objectName: string;
  yoloLabel: string;
  yoloConfidence: number;
  vitLabel: string | null;
  vitConfidence: number | null;
  status: string;
  bbox: number[];
  cropBase64: string;
}

interface DetectionResult {
  id: string;
  objectName: string;
  status: string;
  timeDetected: string;
  confidenceScore: number;
  bbox: number[] | null;
  vitLabel: string | null;
  vitConfidence: number | null;
}

interface PipelineResponse {
  detections: DetectionResult[];
  crops: CropInfo[];
  annotatedImageBase64: string;
  processingTimeMs: number;
  yoloTimeMs: number;
  vitTimeMs: number;
  imageWidth: number;
  imageHeight: number;
  modelInfo: {
    yolo: string;
    vit: string;
    device: string;
    vitClasses: string[];
  };
}

type PipelineStage = 'idle' | 'uploading' | 'yolo' | 'vit' | 'done' | 'error';

// ── Status helpers ──

const statusConfig: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  threat: { label: 'THREAT', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: AlertTriangle },
  verified: { label: 'VERIFIED', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
  analyzing: { label: 'ANALYZING', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Search },
};

// ── Component ──

export default function ImageAnalysis() {
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [result, setResult] = useState<PipelineResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage('idle');
    setResult(null);
    setPreviewUrl(null);
    setSelectedCrop(null);
    setErrorMsg(null);
    setFileName('');
  };

  const processImage = useCallback(async (file: File) => {
    reset();
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);

    try {
      // Stage 1: uploading
      setStage('uploading');
      await new Promise((r) => setTimeout(r, 300));

      // Stage 2: YOLO
      setStage('yolo');
      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch(`${API_BASE}/detect/pipeline`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        throw new Error(`Server error: ${resp.status} ${resp.statusText}`);
      }

      // Stage 3: ViT (already done server-side, but we show it)
      setStage('vit');
      await new Promise((r) => setTimeout(r, 400));

      const data: PipelineResponse = await resp.json();
      setResult(data);
      setStage('done');

      // Get device geolocation for map pin
      let coords: { lat: number; lng: number } | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {
        // Geolocation unavailable — marker won't appear on map
      }

      // Push results to global store for activity panel, history & map
      pushPipelineResultsToStore(file.name, data, {
        annotatedImageBase64: data.annotatedImageBase64,
        coordinates: coords,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Pipeline failed');
      setStage('error');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) processImage(file);
    },
    [processImage]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  // ── Pipeline stage indicator ──
  const stages = [
    { key: 'uploading', label: 'Upload', icon: Upload },
    { key: 'yolo', label: 'YOLO Detection', icon: Crosshair },
    { key: 'vit', label: 'ViT Classification', icon: Cpu },
    { key: 'done', label: 'Results', icon: Eye },
  ];

  const currentIdx = stages.findIndex((s) => s.key === stage);

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Image Analysis']} showActivityPanel={false}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Image Analysis Pipeline</h1>
            <p className="text-sm text-slate-400 mt-1">
              Two-stage detection: YOLO object detection → ViT classification
            </p>
          </div>
          {stage !== 'idle' && (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          )}
        </div>

        {/* Pipeline Progress Bar */}
        {stage !== 'idle' && (
          <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-2">
                {stages.map((s, i) => {
                  const isActive = s.key === stage;
                  const isDone = currentIdx > i || stage === 'done';
                  const Icon = s.icon;
                  return (
                    <div key={s.key} className="flex items-center gap-2 flex-1">
                      <div
                        className={cn(
                          'flex items-center justify-center w-9 h-9 rounded-lg border transition-all',
                          isDone
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : isActive
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 animate-pulse'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={cn(
                          'text-xs font-mono uppercase tracking-wider hidden sm:block',
                          isDone ? 'text-emerald-400' : isActive ? 'text-blue-400' : 'text-slate-500'
                        )}
                      >
                        {s.label}
                      </span>
                      {i < stages.length - 1 && (
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 mx-1 flex-shrink-0',
                            isDone ? 'text-emerald-500/50' : 'text-slate-700'
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {stage !== 'done' && stage !== 'error' && (
                <Progress
                  value={((currentIdx + 1) / stages.length) * 100}
                  className="mt-3 h-1 bg-slate-800"
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {stage === 'error' && (
          <Card className="bg-red-500/5 border-red-500/30">
            <CardContent className="py-6 flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-mono text-sm font-semibold">PIPELINE ERROR</p>
                <p className="text-red-300/70 text-sm mt-1">{errorMsg}</p>
                <p className="text-slate-500 text-xs mt-2">
                  Make sure the backend is running at {API_BASE}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Zone (idle state) */}
        {stage === 'idle' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 py-20 flex flex-col items-center justify-center gap-4',
              dragActive
                ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
                : 'border-slate-700 bg-[hsl(222,47%,8%)] hover:border-slate-500 hover:bg-[hsl(222,47%,10%)]'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
                dragActive ? 'bg-emerald-500/20' : 'bg-slate-800'
              )}
            >
              <Upload className={cn('w-7 h-7', dragActive ? 'text-emerald-400' : 'text-slate-400')} />
            </div>
            <div className="text-center">
              <p className="text-slate-200 font-medium">
                {dragActive ? 'Drop image to analyze' : 'Drag & drop an image here'}
              </p>
              <p className="text-slate-500 text-sm mt-1">or click to browse • JPG, PNG, WebP</p>
            </div>
            <div className="flex items-center gap-6 mt-2 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-blue-400" /> Stage 1: YOLO
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-purple-400" /> Stage 2: ViT
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-emerald-400" /> Visualize
              </span>
            </div>
          </div>
        )}

        {/* Results */}
        {stage === 'done' && result && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Annotated Image */}
            <div className="xl:col-span-2 space-y-6">
              {/* Annotated Image */}
              <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)] overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      Annotated Output
                    </CardTitle>
                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                      <span>{result.imageWidth}×{result.imageHeight}px</span>
                      <span>{result.detections.length} objects</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={`data:image/jpeg;base64,${result.annotatedImageBase64}`}
                      alt="Annotated"
                      className="w-full h-auto"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Original vs Annotated side-by-side on smaller result sets */}
              {previewUrl && (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)] overflow-hidden">
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                        Original Input
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <img src={previewUrl} alt="Original" className="w-full h-auto" />
                    </CardContent>
                  </Card>
                  <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)] overflow-hidden">
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                        After Pipeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <img
                        src={`data:image/jpeg;base64,${result.annotatedImageBase64}`}
                        alt="Pipeline"
                        className="w-full h-auto"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detections Table */}
              <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-base">Detection Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-xs text-slate-400 font-mono uppercase tracking-wider">
                          <th className="text-left py-3 px-2">#</th>
                          <th className="text-left py-3 px-2">Object</th>
                          <th className="text-left py-3 px-2">YOLO</th>
                          <th className="text-left py-3 px-2">ViT</th>
                          <th className="text-left py-3 px-2">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Star className="w-3 h-3" /> Final Class
                            </span>
                          </th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Bbox</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.crops.map((crop, i) => {
                          const st = statusConfig[crop.status] || statusConfig.analyzing;
                          return (
                            <tr
                              key={crop.id}
                              onClick={() => setSelectedCrop(crop)}
                              className={cn(
                                'border-b border-slate-800 cursor-pointer transition-colors',
                                selectedCrop?.id === crop.id
                                  ? 'bg-blue-500/10'
                                  : 'hover:bg-slate-800/50'
                              )}
                            >
                              <td className="py-3 px-2 text-slate-500 font-mono">{i + 1}</td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={`data:image/jpeg;base64,${crop.cropBase64}`}
                                    alt={crop.objectName}
                                    className="w-8 h-8 rounded object-cover border border-slate-700"
                                  />
                                  <span className="text-slate-100 font-medium">{crop.objectName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <span className="text-blue-400 font-mono text-xs">
                                  {crop.yoloLabel} {crop.yoloConfidence}%
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                {crop.vitLabel ? (
                                  <span className="text-purple-400 font-mono text-xs">
                                    {crop.vitLabel} {crop.vitConfidence}%
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-xs">N/A</span>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <Badge
                                  className={cn(
                                    'text-xs font-bold font-mono px-2.5 py-1 border',
                                    'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                                  )}
                                >
                                  <Star className="w-3 h-3 mr-1 inline-block" />
                                  {crop.vitLabel || crop.yoloLabel}
                                </Badge>
                              </td>
                              <td className="py-3 px-2">
                                <Badge variant="outline" className={cn('text-[10px] font-mono', st.color)}>
                                  {st.label}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-slate-500 font-mono text-xs">
                                [{crop.bbox.map((v) => Math.round(v)).join(', ')}]
                              </td>
                            </tr>
                          );
                        })}
                        {result.crops.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500">
                              No objects detected in this image
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar: Stats + Selected Crop */}
            <div className="space-y-6">
              {/* Timing Stats */}
              <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Pipeline Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-mono uppercase">Total Time</span>
                      <span className="text-sm text-slate-100 font-mono font-bold">
                        {result.processingTimeMs.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-mono uppercase flex items-center gap-1.5">
                        <Crosshair className="w-3 h-3 text-blue-400" /> YOLO
                      </span>
                      <span className="text-sm text-blue-400 font-mono">
                        {result.yoloTimeMs.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-mono uppercase flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-purple-400" /> ViT
                      </span>
                      <span className="text-sm text-purple-400 font-mono">
                        {result.vitTimeMs.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Device</span>
                      <span className="text-slate-300 font-mono">{result.modelInfo.device}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">YOLO Model</span>
                      <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">
                        {result.modelInfo.yolo}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">ViT Model</span>
                      <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30">
                        {result.modelInfo.vit}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-base">Detection Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {(['threat', 'verified', 'analyzing'] as const).map((s) => {
                      const count = result.detections.filter((d) => d.status === s).length;
                      const cfg = statusConfig[s];
                      return (
                        <div
                          key={s}
                          className={cn(
                            'rounded-lg border p-3 text-center',
                            cfg.color
                          )}
                        >
                          <div className="text-xl font-bold font-mono">{count}</div>
                          <div className="text-[10px] font-mono uppercase tracking-wider mt-1">
                            {cfg.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Crop Detail */}
              {selectedCrop && (
                <Card className="bg-[hsl(222,47%,8%)] border-blue-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                      Crop Detail
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <img
                      src={`data:image/jpeg;base64,${selectedCrop.cropBase64}`}
                      alt={selectedCrop.objectName}
                      className="w-full rounded-lg border border-slate-700"
                    />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Final Label</span>
                        <span className="text-slate-100 font-semibold">{selectedCrop.objectName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">YOLO Output</span>
                        <span className="text-blue-400 font-mono text-xs">
                          {selectedCrop.yoloLabel} ({selectedCrop.yoloConfidence}%)
                        </span>
                      </div>
                      {selectedCrop.vitLabel && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">ViT Output</span>
                          <span className="text-purple-400 font-mono text-xs">
                            {selectedCrop.vitLabel} ({selectedCrop.vitConfidence}%)
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-mono',
                            statusConfig[selectedCrop.status]?.color
                          )}
                        >
                          {statusConfig[selectedCrop.status]?.label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bbox</span>
                        <span className="text-slate-500 font-mono text-xs">
                          [{selectedCrop.bbox.map((v) => Math.round(v)).join(', ')}]
                        </span>
                      </div>
                    </div>

                    {/* Pipeline Flow Diagram */}
                    <div className="border-t border-slate-700 pt-3">
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">
                        Pipeline Flow
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="bg-slate-800 rounded px-2 py-1 text-slate-400 border border-slate-700">
                          Input
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <div className="bg-blue-500/10 rounded px-2 py-1 text-blue-400 border border-blue-500/30">
                          YOLO: {selectedCrop.yoloLabel}
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <div className="bg-purple-500/10 rounded px-2 py-1 text-purple-400 border border-purple-500/30">
                          ViT: {selectedCrop.vitLabel || 'N/A'}
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <div
                          className={cn(
                            'rounded px-2 py-1 border',
                            statusConfig[selectedCrop.status]?.color
                          )}
                        >
                          {selectedCrop.objectName}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Processing state — show preview while running */}
        {(stage === 'uploading' || stage === 'yolo' || stage === 'vit') && previewUrl && (
          <div className="flex justify-center">
            <div className="relative max-w-2xl w-full">
              <img
                src={previewUrl}
                alt="Uploading"
                className="w-full rounded-xl border border-slate-700 opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 bg-slate-900/80 backdrop-blur rounded-xl px-8 py-6 border border-slate-700">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-mono text-emerald-400 uppercase tracking-wider">
                    {stage === 'uploading' && 'Uploading image...'}
                    {stage === 'yolo' && 'Running YOLO detection...'}
                    {stage === 'vit' && 'Running ViT classification...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
