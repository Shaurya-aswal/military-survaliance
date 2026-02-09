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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = '/api';

// ── Types ──

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

// ── Status helpers ──

const statusConfig: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  threat: { label: 'THREAT', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: AlertTriangle },
  verified: { label: 'VERIFIED', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
  analyzing: { label: 'ANALYZING', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Search },
};

// ── Component ──

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
        { method: 'POST', body: formData }
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

      // Auto-select the peak detection frame
      if (data.frames.length > 0) {
        const peak = data.frames.reduce((a, b) =>
          b.detections.length > a.detections.length ? b : a
        );
        setSelectedFrame(peak);
      }
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
    [processVideo]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processVideo(file);
    },
    [processVideo]
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

  // ── Pipeline stage indicator ──
  const stages = [
    { key: 'uploading', label: 'Upload', icon: Upload },
    { key: 'processing', label: 'YOLO + ViT Processing', icon: Crosshair },
    { key: 'encoding', label: 'Encoding Video', icon: Film },
    { key: 'done', label: 'Results', icon: Eye },
  ];

  const currentIdx = stages.findIndex((s) => s.key === stage);

  // ── Frame timeline with detection density ──
  const maxDetsInFrame = useMemo(() => {
    if (!result) return 1;
    return Math.max(1, ...result.frames.map((f) => f.detections.length));
  }, [result]);

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Video Analysis']}>
      <div className="space-y-6">
        {/* ── Stage Progress ── */}
        {stage !== 'idle' && (
          <div className="flex items-center gap-2 px-1">
            {stages.map((s, i) => {
              const isActive = s.key === stage;
              const isDone = currentIdx > i || stage === 'done';
              const IconComp = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 border',
                    isDone ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    isActive ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse' :
                    'bg-slate-800/50 text-slate-500 border-slate-700/50'
                  )}>
                    <IconComp className="h-3.5 w-3.5" />
                    {s.label}
                  </div>
                  {i < stages.length - 1 && (
                    <ChevronRight className={cn('h-3.5 w-3.5', isDone ? 'text-emerald-500' : 'text-slate-600')} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Error Banner ── */}
        {stage === 'error' && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">Pipeline Error</p>
                <p className="text-xs text-red-400/70 mt-0.5">{errorMsg}</p>
              </div>
              <Button size="sm" variant="outline" onClick={reset}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── LEFT: Upload / Video Player ── */}
          <div className="xl:col-span-2 space-y-6">
            {/* Upload zone (only when idle) */}
            {stage === 'idle' && (
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,6%)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Video className="h-4 w-4 text-blue-400" />
                    Video Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Settings */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Frame Interval (every Nth frame)</label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[frameInterval]}
                          onValueChange={([v]) => setFrameInterval(v)}
                          min={1} max={30} step={1}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono text-slate-300 w-8 text-right">{frameInterval}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Min Confidence (%)</label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[confidence]}
                          onValueChange={([v]) => setConfidence(v)}
                          min={0} max={100} step={5}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono text-slate-300 w-8 text-right">{confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer group',
                      dragActive
                        ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
                        : 'border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-800/30'
                    )}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 mb-4 group-hover:scale-110 transition-transform">
                      <Video className="h-8 w-8 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-200 mb-1">
                      {dragActive ? 'Drop video here' : 'Upload surveillance video'}
                    </p>
                    <p className="text-xs text-slate-500">MP4, AVI, MOV, MKV — Drag & drop or click to browse</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing state */}
            {(stage === 'uploading' || stage === 'processing' || stage === 'encoding') && (
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,6%)]">
                <CardContent className="py-16 flex flex-col items-center gap-6">
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
                    <p className="text-xs text-slate-500 mt-1">
                      {fileName && `Processing: ${fileName}`}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                      Frame interval: every {frameInterval} frames · Min confidence: {confidence}%
                    </p>
                  </div>
                  <Progress value={stage === 'uploading' ? 20 : stage === 'processing' ? 60 : 90}
                    className="w-64 h-1.5" />
                </CardContent>
              </Card>
            )}

            {/* Results — Annotated Video Player */}
            {stage === 'done' && result && (
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,6%)] overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <Play className="h-4 w-4 text-emerald-400" />
                      Annotated Video
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={reset}
                      className="text-xs border-slate-700 hover:bg-slate-800">
                      <RotateCcw className="h-3 w-3 mr-1.5" /> New Analysis
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {annotatedVideoUrl ? (
                    <video
                      ref={videoRef}
                      src={annotatedVideoUrl}
                      controls
                      className="w-full rounded-xl border border-slate-700/50 bg-black"
                      style={{ maxHeight: '480px' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-slate-900 rounded-xl border border-slate-700/50">
                      <p className="text-slate-500 text-sm">No annotated video available</p>
                    </div>
                  )}

                  {/* Quick Stats Bar */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Frames Processed', value: result.summary.totalFramesProcessed, icon: Layers, color: 'text-blue-400' },
                      { label: 'Total Detections', value: result.summary.totalDetections, icon: Target, color: 'text-cyan-400' },
                      { label: 'Processing Time', value: `${(result.processingTimeMs / 1000).toFixed(1)}s`, icon: Clock, color: 'text-amber-400' },
                      { label: 'Avg Confidence', value: `${result.summary.avgConfidence.toFixed(1)}%`, icon: Zap, color: 'text-emerald-400' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 px-3 py-2.5">
                        <s.icon className={cn('h-4 w-4 shrink-0', s.color)} />
                        <div>
                          <p className="text-[10px] text-slate-500 leading-none">{s.label}</p>
                          <p className="text-sm font-bold text-slate-100 mt-0.5">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Frame Timeline */}
            {stage === 'done' && result && result.frames.length > 0 && (
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,6%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <BarChart3 className="h-4 w-4 text-purple-400" />
                    Frame Timeline
                    <Badge variant="outline" className="ml-auto text-[10px] border-slate-700 text-slate-400">
                      {result.frames.length} frames analyzed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Timeline bar */}
                  <div className="flex items-end gap-px h-20 mb-3">
                    {result.frames.map((frame) => {
                      const height = Math.max(4, (frame.detections.length / maxDetsInFrame) * 100);
                      const hasThreat = frame.detections.some((d) => d.status === 'threat');
                      const isSelected = selectedFrame?.frameIndex === frame.frameIndex;
                      return (
                        <button
                          key={frame.frameIndex}
                          onClick={() => setSelectedFrame(frame)}
                          className={cn(
                            'flex-1 min-w-[3px] max-w-[12px] rounded-t transition-all duration-200 hover:opacity-80',
                            isSelected ? 'ring-1 ring-blue-400' : '',
                            hasThreat ? 'bg-red-500' :
                            frame.detections.length > 0 ? 'bg-blue-500' : 'bg-slate-700'
                          )}
                          style={{ height: `${height}%` }}
                          title={`Frame ${frame.frameIndex} — ${frame.detections.length} detections @ ${frame.timestamp.toFixed(1)}s`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>0s</span>
                    <span>{result.frames.length > 0 ? `${result.frames[result.frames.length - 1].timestamp.toFixed(1)}s` : ''}</span>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-red-500" /> Threat detected
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-blue-500" /> Objects detected
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-slate-700" /> No detections
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Summary Panel + Frame Details ── */}
          <div className="space-y-6">
            {/* Summary Card */}
            {stage === 'done' && result && (
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,6%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Shield className="h-4 w-4 text-cyan-400" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Threat / Verified / Analyzing counts */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Threats', value: result.summary.threats, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                      { label: 'Verified', value: result.summary.verified, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                      { label: 'Analyzing', value: result.summary.analyzing, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    ].map((item) => (
                      <div key={item.label} className={cn('rounded-xl border p-3 text-center', item.bg)}>
                        <p className={cn('text-xl font-bold', item.color)}>{item.value}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Unique objects */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Detected Objects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.summary.uniqueObjects.map((obj) => (
                        <Badge key={obj} variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                          {obj}
                        </Badge>
                      ))}
                      {result.summary.uniqueObjects.length === 0 && (
                        <p className="text-xs text-slate-600">No objects detected</p>
                      )}
                    </div>
                  </div>

                  {/* Video info */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Video Info</p>
                    {[
                      ['Resolution', `${result.width}×${result.height}`],
                      ['FPS', `${result.fps}`],
                      ['Total Frames', `${result.totalFrames}`],
                      ['Frames Analyzed', `${result.summary.totalFramesProcessed}`],
                      ['Frame Interval', `Every ${frameInterval} frames`],
                      ['Device', result.modelInfo.device.toUpperCase()],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-500">{k}</span>
                        <span className="text-slate-300 font-mono">{v}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Frame Details */}
            {stage === 'done' && selectedFrame && (
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,6%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Eye className="h-4 w-4 text-amber-400" />
                    Frame #{selectedFrame.frameIndex}
                    <Badge variant="outline" className="ml-auto text-[10px] border-slate-700 text-slate-400">
                      {selectedFrame.timestamp.toFixed(2)}s
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedFrame.detections.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No detections in this frame</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {selectedFrame.detections.map((det) => {
                        const cfg = statusConfig[det.status] || statusConfig.analyzing;
                        const StatusIcon = cfg.icon;
                        return (
                          <div
                            key={det.id}
                            className="flex items-center gap-3 rounded-xl bg-slate-800/50 border border-slate-700/40 p-3"
                          >
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', cfg.color)}>
                              <StatusIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-100 truncate">{det.objectName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-500">
                                  YOLO → ViT: {det.vitLabel || '—'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-100">{det.confidenceScore.toFixed(1)}%</p>
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

            {/* Idle helper */}
            {stage === 'idle' && (
              <Card className="border-[hsl(217,33%,17%)] bg-[hsl(222,47%,6%)]">
                <CardContent className="py-8 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 mx-auto">
                    <Film className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Video Intelligence</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                      Upload a surveillance video to run frame-by-frame YOLO + ViT detection pipeline.
                      Adjust frame interval and confidence threshold before uploading.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 text-[10px] text-slate-600">
                    <span>• Frame-by-frame object detection & classification</span>
                    <span>• Annotated output video with bounding boxes</span>
                    <span>• Interactive frame timeline with threat markers</span>
                    <span>• Per-frame detection breakdown</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
