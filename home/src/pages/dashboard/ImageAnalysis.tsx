import { useState, useCallback, useRef, useMemo } from 'react';
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
  Shield,
  Target,
  Download,
  ScanSearch,
  Radar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pushPipelineResultsToStore } from '@/store/detectionHistory';

const API_BASE = '/api';

/* ── 10 ViT classes ── */
const VIT_CLASSES = [
  'aircraft', 'artelary', 'camo_soldier', 'civilian_vehical', 'mil_truck',
  'mil_vehical', 'soldier', 'tank', 'warship', 'weapons',
] as const;

const classIcons: Record<string, string> = {
  aircraft: '✈️', artelary: '💥', camo_soldier: '🪖', civilian_vehical: '🚗',
  mil_truck: '🚛', mil_vehical: '🛡️', soldier: '🎖️', tank: '🔱', warship: '🚢', weapons: '🔫',
};

const threatClasses = new Set(['tank', 'warship', 'weapons', 'artelary']);

/* ── Types ── */

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

/* ── Status helpers ── */

const statusConfig: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  threat:    { label: 'THREAT',    color: 'text-red-400 bg-red-500/10 border-red-500/30',       icon: AlertTriangle },
  verified:  { label: 'VERIFIED',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
  analyzing: { label: 'ANALYZING', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Search },
};

/* ── Component ── */

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
      setStage('uploading');
      await new Promise((r) => setTimeout(r, 300));

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

      setStage('vit');
      await new Promise((r) => setTimeout(r, 400));

      const data: PipelineResponse = await resp.json();
      setResult(data);
      setStage('done');

      let coords: { lat: number; lng: number } | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
        );
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch { /* geolocation unavailable */ }

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
    [processImage],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImage(file);
    },
    [processImage],
  );

  const stages = [
    { key: 'uploading', label: 'Upload',    icon: Upload },
    { key: 'yolo',      label: 'YOLO',      icon: Crosshair },
    { key: 'vit',       label: 'ViT',       icon: Cpu },
    { key: 'done',      label: 'Results',   icon: Eye },
  ];
  const currentIdx = stages.findIndex((s) => s.key === stage);

  // Class distribution
  const classDistribution = useMemo(() => {
    if (!result) return [];
    const map: Record<string, number> = {};
    result.crops.forEach((c) => {
      const label = c.vitLabel || c.yoloLabel;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => ({ label, count }));
  }, [result]);

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Image Analysis']} showActivityPanel={false}>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20 shrink-0">
              <ScanSearch className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Image Analysis Pipeline</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Two-stage detection: YOLO object detection → ViT classification
              </p>
            </div>
          </div>
          {stage !== 'idle' && (
            <Button variant="outline" size="sm" onClick={reset}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 self-start sm:self-auto">
              <RotateCcw className="w-4 h-4 mr-2" /> New Analysis
            </Button>
          )}
        </div>

        {/* Pipeline Progress Bar */}
        {stage !== 'idle' && (
          <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
            <CardContent className="py-3 sm:py-4">
              <div className="flex items-center justify-between gap-1 sm:gap-2">
                {stages.map((s, i) => {
                  const isActive = s.key === stage;
                  const isDone = currentIdx > i || stage === 'done';
                  const Icon = s.icon;
                  return (
                    <div key={s.key} className="flex items-center gap-1 sm:gap-2 flex-1">
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border transition-all shrink-0',
                        isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : isActive ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 animate-pulse'
                          : 'bg-slate-800 border-slate-700 text-slate-500',
                      )}>
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className={cn(
                        'text-[10px] sm:text-xs font-mono uppercase tracking-wider hidden sm:block',
                        isDone ? 'text-emerald-400' : isActive ? 'text-blue-400' : 'text-slate-500',
                      )}>
                        {s.label}
                      </span>
                      {i < stages.length - 1 && (
                        <ChevronRight className={cn('w-3.5 h-3.5 shrink-0 mx-0.5', isDone ? 'text-emerald-500/50' : 'text-slate-700')} />
                      )}
                    </div>
                  );
                })}
              </div>
              {stage !== 'done' && stage !== 'error' && (
                <Progress value={((currentIdx + 1) / stages.length) * 100} className="mt-3 h-1 bg-slate-800" />
              )}
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {stage === 'error' && (
          <Card className="bg-red-500/5 border-red-500/30">
            <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-400 font-mono text-sm font-semibold">PIPELINE ERROR</p>
                <p className="text-red-300/70 text-sm mt-1 break-all">{errorMsg}</p>
              </div>
              <Button size="sm" variant="outline" onClick={reset}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Upload Zone (idle state) ── */}
        {stage === 'idle' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 py-12 sm:py-20 flex flex-col items-center justify-center gap-4',
                  dragActive
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                    : 'border-slate-700 bg-[hsl(222,47%,8%)] hover:border-slate-500 hover:bg-[hsl(222,47%,10%)]',
                )}
              >
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                <div className={cn(
                  'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 border',
                  dragActive
                    ? 'bg-emerald-500/20 border-emerald-500/30'
                    : 'bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 hover:scale-110',
                )}>
                  <Upload className={cn('w-8 h-8 sm:w-10 sm:h-10 transition-colors', dragActive ? 'text-emerald-400' : 'text-emerald-400/70')} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-200">
                    {dragActive ? 'Drop image to analyze' : 'Drag & drop an image here'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse • JPG, PNG, WebP</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 mt-2 text-[10px] text-slate-600 font-mono">
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
            </div>

            {/* Info sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]">
                <CardContent className="py-6 sm:py-8 text-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20 mx-auto">
                    <Radar className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Image Intelligence</p>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                      Upload any image for two-stage military object detection and classification.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-[11px] text-slate-500 text-left max-w-[240px] mx-auto">
                    {[
                      'YOLO object detection with bounding boxes',
                      'ViT classification for 10 military classes',
                      'Annotated output with crop details',
                      'Pipeline flow visualization',
                      'Auto-push to History & Activity Feed',
                    ].map((item) => (
                      <span key={item} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                        {item}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 10 ViT classes */}
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Supported Classes (10)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {VIT_CLASSES.map((cls) => (
                      <Badge key={cls} variant="outline"
                        className={cn(
                          'text-[10px] font-mono border px-2 py-0.5',
                          threatClasses.has(cls)
                            ? 'text-red-400 border-red-500/30 bg-red-500/5'
                            : 'text-slate-400 border-slate-700 bg-slate-800/30',
                        )}>
                        {classIcons[cls] || '•'} {cls.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Processing state */}
        {(stage === 'uploading' || stage === 'yolo' || stage === 'vit') && previewUrl && (
          <div className="flex justify-center">
            <div className="relative max-w-2xl w-full">
              <img src={previewUrl} alt="Uploading" className="w-full rounded-xl border border-slate-700 opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 bg-slate-900/80 backdrop-blur-sm rounded-xl px-6 sm:px-8 py-5 sm:py-6 border border-slate-700">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs sm:text-sm font-mono text-emerald-400 uppercase tracking-wider text-center">
                    {stage === 'uploading' && 'Uploading image...'}
                    {stage === 'yolo' && 'Running YOLO detection...'}
                    {stage === 'vit' && 'Running ViT classification...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {stage === 'done' && result && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

            {/* Left: Annotated Image + Detections Table */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">

              {/* Annotated Image */}
              <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)] overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-slate-100 text-sm sm:text-base flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      Annotated Output
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`data:image/jpeg;base64,${result.annotatedImageBase64}`}
                        download={`annotated_${fileName}`}
                        className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400 border border-blue-500/30 bg-blue-500/5 rounded-lg px-2.5 py-1 hover:bg-blue-500/15 transition-colors"
                      >
                        <Download className="h-3 w-3" /> Download
                      </a>
                      <span className="text-[10px] font-mono text-slate-500">
                        {result.imageWidth}×{result.imageHeight}px · {result.detections.length} objects
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <img
                    src={`data:image/jpeg;base64,${result.annotatedImageBase64}`}
                    alt="Annotated"
                    className="w-full h-auto"
                  />
                </CardContent>
              </Card>

              {/* Original vs Annotated */}
              {previewUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)] overflow-hidden">
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider">
                        Original Input
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <img src={previewUrl} alt="Original" className="w-full h-auto" />
                    </CardContent>
                  </Card>
                  <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)] overflow-hidden">
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider">
                        After Pipeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <img src={`data:image/jpeg;base64,${result.annotatedImageBase64}`} alt="Pipeline" className="w-full h-auto" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detections Table (responsive) */}
              <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-sm sm:text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    Detection Results
                    <Badge variant="outline" className="ml-auto text-[10px] border-slate-700 text-slate-400">
                      {result.crops.length} objects
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Mobile: card list; Desktop: table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                          <th className="text-left py-3 px-2">#</th>
                          <th className="text-left py-3 px-2">Object</th>
                          <th className="text-left py-3 px-2">YOLO</th>
                          <th className="text-left py-3 px-2">ViT</th>
                          <th className="text-left py-3 px-2">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Star className="w-3 h-3" /> Final
                            </span>
                          </th>
                          <th className="text-left py-3 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.crops.map((crop, i) => {
                          const st = statusConfig[crop.status] || statusConfig.analyzing;
                          const isThreatCls = threatClasses.has(crop.vitLabel || crop.yoloLabel);
                          return (
                            <tr key={crop.id}
                              onClick={() => setSelectedCrop(crop)}
                              className={cn(
                                'border-b border-slate-800 cursor-pointer transition-colors',
                                selectedCrop?.id === crop.id ? 'bg-blue-500/10' : 'hover:bg-slate-800/50',
                              )}>
                              <td className="py-3 px-2 text-slate-500 font-mono">{i + 1}</td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <img src={`data:image/jpeg;base64,${crop.cropBase64}`} alt={crop.objectName}
                                    className="w-8 h-8 rounded object-cover border border-slate-700" />
                                  <span className="text-slate-100 font-medium">{crop.objectName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <span className="text-blue-400 font-mono text-xs">{crop.yoloLabel} {crop.yoloConfidence}%</span>
                              </td>
                              <td className="py-3 px-2">
                                {crop.vitLabel ? (
                                  <span className="text-purple-400 font-mono text-xs">
                                    {classIcons[crop.vitLabel] || ''} {crop.vitLabel} {crop.vitConfidence}%
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-xs">N/A</span>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <Badge className={cn(
                                  'text-xs font-bold font-mono px-2 py-1 border',
                                  isThreatCls
                                    ? 'bg-red-500/15 text-red-300 border-red-500/40'
                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
                                )}>
                                  <Star className="w-3 h-3 mr-1 inline-block" />
                                  {crop.vitLabel || crop.yoloLabel}
                                </Badge>
                              </td>
                              <td className="py-3 px-2">
                                <Badge variant="outline" className={cn('text-[10px] font-mono', st.color)}>
                                  {st.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                        {result.crops.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              No objects detected in this image
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card view */}
                  <div className="sm:hidden space-y-2">
                    {result.crops.map((crop, i) => {
                      const st = statusConfig[crop.status] || statusConfig.analyzing;
                      const StatusIcon = st.icon;
                      const isThreatCls = threatClasses.has(crop.vitLabel || crop.yoloLabel);
                      return (
                        <div key={crop.id}
                          onClick={() => setSelectedCrop(crop)}
                          className={cn(
                            'flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all',
                            selectedCrop?.id === crop.id ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/50',
                          )}>
                          <img src={`data:image/jpeg;base64,${crop.cropBase64}`} alt={crop.objectName}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-slate-100 truncate">{crop.objectName}</p>
                              <Badge variant="outline" className={cn('text-[9px] border shrink-0', st.color)}>
                                {st.label}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {classIcons[crop.vitLabel || ''] || ''} YOLO: {crop.yoloLabel} → ViT: {crop.vitLabel || '—'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-slate-100 font-mono">
                              {(crop.vitConfidence ?? crop.yoloConfidence)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 sm:space-y-6">

              {/* Pipeline Metrics */}
              <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Pipeline Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: 'Total Time', value: `${result.processingTimeMs.toFixed(0)}ms`, color: 'text-slate-100' },
                      { label: 'YOLO', value: `${result.yoloTimeMs.toFixed(0)}ms`, color: 'text-blue-400', icon: Crosshair, iconColor: 'text-blue-400' },
                      { label: 'ViT', value: `${result.vitTimeMs.toFixed(0)}ms`, color: 'text-purple-400', icon: Cpu, iconColor: 'text-purple-400' },
                    ].map((m) => (
                      <div key={m.label} className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-mono uppercase flex items-center gap-1.5">
                          {m.icon && <m.icon className={cn('w-3 h-3', m.iconColor)} />}
                          {m.label}
                        </span>
                        <span className={cn('text-sm font-mono font-bold', m.color)}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-700 pt-3 space-y-2">
                    {[
                      ['Device', result.modelInfo.device.toUpperCase()],
                      ['YOLO', result.modelInfo.yolo],
                      ['ViT', result.modelInfo.vit],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-500">{k}</span>
                        <span className="text-slate-300 font-mono text-[11px]">{v}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detection Summary */}
              <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Detection Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(['threat', 'verified', 'analyzing'] as const).map((s) => {
                      const count = result.detections.filter((d) => d.status === s).length;
                      const cfg = statusConfig[s];
                      return (
                        <div key={s} className={cn('rounded-xl border p-3 text-center', cfg.color)}>
                          <div className="text-xl font-bold font-mono">{count}</div>
                          <div className="text-[10px] font-mono uppercase tracking-wider mt-1">{cfg.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Class distribution */}
                  {classDistribution.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Class Distribution</p>
                      <div className="space-y-1.5">
                        {classDistribution.map(({ label, count }) => {
                          const pct = (count / result.crops.length) * 100;
                          const isThreat = threatClasses.has(label);
                          return (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                                  {classIcons[label] || '•'} {label.replace(/_/g, ' ')}
                                </span>
                                <span className={cn('text-[10px] font-mono', isThreat ? 'text-red-400' : 'text-slate-400')}>
                                  {count} ({pct.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full transition-all duration-500', isThreat ? 'bg-red-500' : 'bg-blue-500')}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Crop Detail */}
              {selectedCrop && (
                <Card className="bg-[hsl(222,47%,8%)] border-blue-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-sm flex items-center gap-2">
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
                      {[
                        ['Final Label', selectedCrop.objectName],
                        ['YOLO', `${selectedCrop.yoloLabel} (${selectedCrop.yoloConfidence}%)`],
                        ...(selectedCrop.vitLabel
                          ? [['ViT', `${classIcons[selectedCrop.vitLabel] || ''} ${selectedCrop.vitLabel} (${selectedCrop.vitConfidence}%)`]]
                          : []),
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-400 text-xs">{k}</span>
                          <span className="text-slate-100 text-xs font-medium">{v}</span>
                        </div>
                      ))}
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Status</span>
                        <Badge variant="outline"
                          className={cn('text-[10px] font-mono', statusConfig[selectedCrop.status]?.color)}>
                          {statusConfig[selectedCrop.status]?.label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Bbox</span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          [{selectedCrop.bbox.map((v) => Math.round(v)).join(', ')}]
                        </span>
                      </div>
                    </div>

                    {/* Pipeline Flow */}
                    <div className="border-t border-slate-700 pt-3">
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">Pipeline Flow</p>
                      <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                        <span className="bg-slate-800 rounded px-2 py-1 text-slate-400 border border-slate-700">Input</span>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                        <span className="bg-blue-500/10 rounded px-2 py-1 text-blue-400 border border-blue-500/30">
                          {selectedCrop.yoloLabel}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                        <span className="bg-purple-500/10 rounded px-2 py-1 text-purple-400 border border-purple-500/30">
                          {selectedCrop.vitLabel || 'N/A'}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                        <span className={cn('rounded px-2 py-1 border', statusConfig[selectedCrop.status]?.color)}>
                          {selectedCrop.objectName}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
