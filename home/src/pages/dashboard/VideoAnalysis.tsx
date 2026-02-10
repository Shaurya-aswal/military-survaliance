// filepath: /Users/apple/Desktop/military survaliance/home/src/pages/dashboard/VideoAnalysis.tsx
import { useState, useCallback, useRef, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Upload,
  Video,
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
  Play,
  Film,
  Layers,
  Target,
  BarChart3,
  Shield,
  Download,
  Gauge,
  MonitorPlay,
  Radar,
  FileVideo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pushVideoResultsToStore } from '@/store/detectionHistory';

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

interface FrameDetection {
  frameIndex: number;
  timestamp: number;
  detections: DetectionResult[];
}

interface VideoSummary {
  totalFramesProcessed: number;
  totalDetections: number;
  uniqueObjects: string[];
  threats: number;
  verified: number;
  analyzing: number;
  avgConfidence: number;
  peakDetectionFrame: number;
}

interface VideoResponse {
  annotatedVideoBase64: string;
  thumbnailBase64: string;
  frames: FrameDetection[];
  summary: VideoSummary;
  processingTimeMs: number;
  fps: number;
  totalFrames: number;
  width: number;
  height: number;
  modelInfo: {
    yolo: string;
    vit: string;
    device: string;
    vitClasses: string[];
  };
}

type PipelineStage = 'idle' | 'uploading' | 'processing' | 'encoding' | 'done' | 'error';

/* ── Status helpers ── */

const statusConfig: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  threat:    { label: 'THREAT',    color: 'text-red-400 bg-red-500/10 border-red-500/30',       icon: AlertTriangle },
  verified:  { label: 'VERIFIED',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
  analyzing: { label: 'ANALYZING', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Search },
};

/* ── Component ── */

export default function VideoAnalysis() {
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [result, setResult] = useState<VideoResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFrame, setSelectedFrame] = useState<FrameDetection | null>(null);
  const [frameInterval, setFrameInterval] = useState(5);
  const [confidence, setConfidence] = useState(25);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const reset = () => {
    setStage('idle');
    setResult(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    setFileName('');
    setSelectedFrame(null);
  };

  const processVideo = useCallback(async (file: File) => {
    reset();
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);

    try {
      setStage('uploading');
      await new Promise((r) => setTimeout(r, 300));

      setStage('processing');
      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch(
        `${API_BASE}/detect/video?frame_interval=${frameInterval}&confidence=${confidence}`,
        { method: 'POST', body: formData },
      );

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Server error: ${resp.status} — ${text}`);
      }

      setStage('encoding');
      await new Promise((r) => setTimeout(r, 300));

      const data: VideoResponse = await resp.json();
      setResult(data);
      setStage('done');

      // Auto-select peak detection frame
      if (data.frames.length > 0) {
        const peak = data.frames.reduce((a, b) =>
          b.detections.length > a.detections.length ? b : a,
        );
        setSelectedFrame(peak);
      }

      // ── Push to History store ──
      let coords: { lat: number; lng: number } | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
        );
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch { /* geolocation unavailable */ }

      pushVideoResultsToStore(file.name, data, {
        annotatedImageBase64: data.thumbnailBase64,
        coordinates: coords,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Video pipeline failed');
      setStage('error');
    }
  }, [frameInterval, confidence]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('video/')) processVideo(file);
    },
    [processVideo],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processVideo(file);
    },
    [processVideo],
  );

  // Annotated video URL from base64
  const annotatedVideoUrl = useMemo(() => {
    if (!result?.annotatedVideoBase64) return null;
    const binary = atob(result.annotatedVideoBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'video/mp4' });
    return URL.createObjectURL(blob);
  }, [result?.annotatedVideoBase64]);

  // Pipeline stages
  const stages = [
    { key: 'uploading',   label: 'Upload',     icon: Upload },
    { key: 'processing',  label: 'YOLO + ViT', icon: Crosshair },
    { key: 'encoding',    label: 'Encoding',    icon: Film },
    { key: 'done',        label: 'Results',     icon: Eye },
  ];
  const currentIdx = stages.findIndex((s) => s.key === stage);

  // Frame timeline density
  const maxDetsInFrame = useMemo(() => {
    if (!result) return 1;
    return Math.max(1, ...result.frames.map((f) => f.detections.length));
  }, [result]);

  // Class distribution for summary
  const classDistribution = useMemo(() => {
    if (!result) return [];
    const map: Record<string, number> = {};
    result.frames.forEach((f) =>
      f.detections.forEach((d) => {
        const label = d.vitLabel || d.objectName;
        map[label] = (map[label] || 0) + 1;
      }),
    );
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => ({ label, count }));
  }, [result]);

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Video Analysis']} showActivityPanel={false}>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 shrink-0">
              <MonitorPlay className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Video Analysis Pipeline</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Frame-by-frame YOLO detection → ViT classification → Annotated output
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

        {/* ── Stage Progress ── */}
        {stage !== 'idle' && (
          <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
            <CardContent className="py-3 sm:py-4">
              <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1">
                {stages.map((s, i) => {
                  const isActive = s.key === stage;
                  const isDone = currentIdx > i || stage === 'done';
                  const IconComp = s.icon;
                  return (
                    <div key={s.key} className="flex items-center gap-1 sm:gap-2 flex-1">
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border transition-all shrink-0',
                        isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : isActive ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 animate-pulse'
                          : 'bg-slate-800 border-slate-700 text-slate-500',
                      )}>
                        <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className={cn(
                        'text-[10px] sm:text-xs font-mono uppercase tracking-wider hidden sm:block whitespace-nowrap',
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

        {/* ── Error Banner ── */}
        {stage === 'error' && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-300">Pipeline Error</p>
                <p className="text-xs text-red-400/70 mt-0.5 break-all">{errorMsg}</p>
              </div>
              <Button size="sm" variant="outline" onClick={reset}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── IDLE: Upload Zone ── */}
        {stage === 'idle' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Upload card — spans 2 cols */}
            <div className="lg:col-span-2">
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <FileVideo className="h-4 w-4 text-blue-400" />
                    Video Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Settings row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-blue-400" /> Frame Interval
                      </label>
                      <div className="flex items-center gap-3 bg-slate-900/50 rounded-xl border border-slate-700/50 px-3 py-2.5">
                        <Slider value={[frameInterval]} onValueChange={([v]) => setFrameInterval(v)}
                          min={1} max={30} step={1} className="flex-1" />
                        <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 min-w-[40px] text-center">
                          {frameInterval}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600">Process every Nth frame</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Gauge className="h-3 w-3 text-purple-400" /> Min Confidence
                      </label>
                      <div className="flex items-center gap-3 bg-slate-900/50 rounded-xl border border-slate-700/50 px-3 py-2.5">
                        <Slider value={[confidence]} onValueChange={([v]) => setConfidence(v)}
                          min={0} max={100} step={5} className="flex-1" />
                        <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 min-w-[40px] text-center">
                          {confidence}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600">Minimum detection threshold</p>
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 transition-all duration-300 cursor-pointer group',
                      dragActive
                        ? 'border-blue-400 bg-blue-500/10 scale-[1.01] shadow-lg shadow-blue-500/10'
                        : 'border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-800/30',
                    )}
                  >
                    <div className={cn(
                      'flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border mb-4 transition-all duration-300 group-hover:scale-110',
                      dragActive
                        ? 'bg-blue-500/20 border-blue-500/30'
                        : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20',
                    )}>
                      <Video className={cn('h-8 w-8 sm:h-10 sm:w-10 transition-colors', dragActive ? 'text-blue-400' : 'text-blue-400/70')} />
                    </div>
                    <p className="text-sm font-medium text-slate-200 mb-1">
                      {dragActive ? 'Drop video here' : 'Drag & drop surveillance video'}
                    </p>
                    <p className="text-xs text-slate-500">or click to browse • MP4, AVI, MOV, MKV</p>
                    <div className="flex items-center gap-4 sm:gap-6 mt-4 text-[10px] text-slate-600 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Crosshair className="w-3 h-3 text-blue-400" /> YOLO
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-purple-400" /> ViT
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Film className="w-3 h-3 text-cyan-400" /> Annotate
                      </span>
                    </div>
                    <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileInput} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]">
                <CardContent className="py-6 sm:py-8 text-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 mx-auto">
                    <Radar className="h-7 w-7 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Video Intelligence</p>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                      Upload surveillance footage to run frame-by-frame detection with annotated output video.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-[11px] text-slate-500 text-left max-w-[240px] mx-auto">
                    {[
                      'Frame-by-frame YOLO + ViT pipeline',
                      'Annotated video with bounding boxes',
                      'Interactive frame timeline & density',
                      'Class distribution breakdown',
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

              {/* 10 ViT classes reference */}
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

        {/* ── Processing State ── */}
        {(stage === 'uploading' || stage === 'processing' || stage === 'encoding') && (
          <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]">
            <CardContent className="py-12 sm:py-16 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                  {stage === 'uploading' && <Upload className="h-9 w-9 text-blue-400 animate-bounce" />}
                  {stage === 'processing' && <Crosshair className="h-9 w-9 text-blue-400 animate-spin" />}
                  {stage === 'encoding' && <Film className="h-9 w-9 text-purple-400 animate-pulse" />}
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-400 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-100">
                  {stage === 'uploading' && 'Uploading video…'}
                  {stage === 'processing' && 'Running YOLO + ViT detection on frames…'}
                  {stage === 'encoding' && 'Encoding annotated video…'}
                </p>
                {fileName && (
                  <p className="text-xs text-slate-500 mt-1">Processing: {fileName}</p>
                )}
                <p className="text-xs text-slate-600 mt-2">
                  Frame interval: every {frameInterval} frames · Min confidence: {confidence}%
                </p>
              </div>
              <Progress
                value={stage === 'uploading' ? 20 : stage === 'processing' ? 60 : 90}
                className="w-48 sm:w-64 h-1.5"
              />
            </CardContent>
          </Card>
        )}

        {/* ── Results ── */}
        {stage === 'done' && result && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

            {/* LEFT: Annotated Video + Timeline */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">

              {/* Annotated Video Player */}
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)] overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <Play className="h-4 w-4 text-emerald-400" />
                      Annotated Video Output
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {annotatedVideoUrl && (
                        <a href={annotatedVideoUrl} download={`annotated_${fileName}`}
                          className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400 border border-blue-500/30 bg-blue-500/5 rounded-lg px-2.5 py-1 hover:bg-blue-500/15 transition-colors">
                          <Download className="h-3 w-3" /> Download
                        </a>
                      )}
                      <span className="text-[10px] font-mono text-slate-500">
                        {result.width}×{result.height} · {result.fps}fps
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {annotatedVideoUrl ? (
                    <video
                      ref={videoRef}
                      src={annotatedVideoUrl}
                      controls
                      className="w-full bg-black"
                      style={{ maxHeight: '500px' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 sm:h-64 bg-slate-900">
                      <p className="text-slate-500 text-sm">No annotated video available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: 'Frames', value: result.summary.totalFramesProcessed, icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  { label: 'Detections', value: result.summary.totalDetections, icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                  { label: 'Time', value: `${(result.processingTimeMs / 1000).toFixed(1)}s`, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                  { label: 'Avg Conf', value: `${result.summary.avgConfidence.toFixed(1)}%`, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                ].map((s) => (
                  <div key={s.label} className={cn('flex items-center gap-2.5 rounded-xl border p-3', s.bg)}>
                    <s.icon className={cn('h-4 w-4 shrink-0', s.color)} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 leading-none truncate">{s.label}</p>
                      <p className="text-sm font-bold text-slate-100 mt-0.5">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Frame Timeline */}
              {result.frames.length > 0 && (
                <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-400" />
                        Detection Timeline
                      </div>
                      <Badge variant="outline" className="ml-0 sm:ml-auto text-[10px] border-slate-700 text-slate-400 self-start sm:self-auto">
                        {result.frames.length} frames · peak at #{result.summary.peakDetectionFrame}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Timeline bar chart */}
                    <div className="flex items-end gap-px h-16 sm:h-20 mb-2 overflow-x-auto">
                      {result.frames.map((frame) => {
                        const height = Math.max(6, (frame.detections.length / maxDetsInFrame) * 100);
                        const hasThreat = frame.detections.some((d) => d.status === 'threat');
                        const isSelected = selectedFrame?.frameIndex === frame.frameIndex;
                        return (
                          <button
                            key={frame.frameIndex}
                            onClick={() => setSelectedFrame(frame)}
                            className={cn(
                              'flex-1 min-w-[2px] max-w-[14px] rounded-t-sm transition-all duration-150 hover:opacity-80',
                              isSelected ? 'ring-1 ring-blue-400 ring-offset-1 ring-offset-[hsl(222,47%,8%)]' : '',
                              hasThreat ? 'bg-red-500' :
                              frame.detections.length > 0 ? 'bg-blue-500' : 'bg-slate-700/50',
                            )}
                            style={{ height: `${height}%` }}
                            title={`Frame ${frame.frameIndex} — ${frame.detections.length} det @ ${frame.timestamp.toFixed(1)}s`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>0s</span>
                      <span>{result.frames.length > 0 ? `${result.frames[result.frames.length - 1].timestamp.toFixed(1)}s` : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 sm:gap-4 mt-2">
                      {[
                        { color: 'bg-red-500', label: 'Threat detected' },
                        { color: 'bg-blue-500', label: 'Objects detected' },
                        { color: 'bg-slate-700/50', label: 'No detections' },
                      ].map((l) => (
                        <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className={cn('h-2 w-2 rounded-full', l.color)} /> {l.label}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selected Frame Detections */}
              {selectedFrame && (
                <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-amber-400" />
                        Frame #{selectedFrame.frameIndex} Details
                      </div>
                      <Badge variant="outline" className="ml-0 sm:ml-auto text-[10px] border-slate-700 text-slate-400 self-start sm:self-auto">
                        {selectedFrame.detections.length} detection{selectedFrame.detections.length !== 1 ? 's' : ''} · {selectedFrame.timestamp.toFixed(2)}s
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedFrame.detections.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No detections in this frame</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {selectedFrame.detections.map((det) => {
                          const cfg = statusConfig[det.status] || statusConfig.analyzing;
                          const StatusIcon = cfg.icon;
                          const isThreatCls = threatClasses.has(det.vitLabel || det.objectName);
                          return (
                            <div key={det.id}
                              className={cn(
                                'flex items-center gap-3 rounded-xl border p-3 transition-all duration-200',
                                isThreatCls
                                  ? 'bg-red-500/5 border-red-500/20'
                                  : 'bg-slate-800/50 border-slate-700/40',
                              )}>
                              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg border shrink-0', cfg.color)}>
                                <StatusIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-semibold text-slate-100 truncate">{det.objectName}</p>
                                  {det.vitLabel && (
                                    <span className="text-[10px] text-purple-400 font-mono shrink-0">
                                      {classIcons[det.vitLabel] || ''} {det.vitLabel}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  YOLO → ViT: {det.vitLabel || '—'} ({det.vitConfidence ?? 0}%)
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-slate-100 font-mono">{det.confidenceScore.toFixed(1)}%</p>
                                <Badge variant="outline" className={cn('text-[9px] mt-0.5 border', cfg.color)}>
                                  {cfg.label}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT: Summary Sidebar */}
            <div className="space-y-4 sm:space-y-6">

              {/* Threat / Verified / Analyzing */}
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Shield className="h-4 w-4 text-cyan-400" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Threats', value: result.summary.threats, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                      { label: 'Verified', value: result.summary.verified, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                      { label: 'Pending', value: result.summary.analyzing, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    ].map((item) => (
                      <div key={item.label} className={cn('rounded-xl border p-3 text-center', item.bg)}>
                        <p className={cn('text-xl font-bold font-mono', item.color)}>{item.value}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Class distribution */}
                  {classDistribution.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Class Distribution
                      </p>
                      <div className="space-y-1.5">
                        {classDistribution.map(({ label, count }) => {
                          const pct = (count / result.summary.totalDetections) * 100;
                          const isThreat = threatClasses.has(label);
                          return (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                                  <span>{classIcons[label] || '•'}</span>
                                  {label.replace(/_/g, ' ')}
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

                  {/* Unique objects */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Detected Classes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.summary.uniqueObjects.map((obj) => (
                        <Badge key={obj} variant="outline"
                          className={cn(
                            'text-[10px] font-mono border px-2 py-0.5',
                            threatClasses.has(obj)
                              ? 'text-red-400 border-red-500/30 bg-red-500/5'
                              : 'text-slate-300 border-slate-700',
                          )}>
                          {classIcons[obj] || '•'} {obj.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {result.summary.uniqueObjects.length === 0 && (
                        <p className="text-xs text-slate-600">None</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Video Info */}
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <MonitorPlay className="h-3.5 w-3.5" />
                    Video Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    ['File', fileName],
                    ['Resolution', `${result.width}×${result.height}`],
                    ['FPS', `${result.fps}`],
                    ['Total Frames', `${result.totalFrames}`],
                    ['Analyzed', `${result.summary.totalFramesProcessed}`],
                    ['Interval', `Every ${frameInterval}`],
                    ['Device', result.modelInfo.device.toUpperCase()],
                    ['YOLO', result.modelInfo.yolo],
                    ['ViT', result.modelInfo.vit],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-slate-300 font-mono text-[11px] truncate ml-3 text-right max-w-[160px]">{v}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
