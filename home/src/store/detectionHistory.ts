// filepath: /Users/apple/Desktop/military survaliance/home/src/store/detectionHistory.ts
import { create } from 'zustand';
import { Detection, ActivityLog } from '@/types/detection';

export interface AnalysisRecord {
  id: string;
  imageName: string;
  timestamp: string;            // ISO string
  totalDetections: number;
  threats: number;
  verified: number;
  analyzing: number;
  processingTimeMs: number;
  /** Individual detection items produced by the pipeline */
  detections: Detection[];
  /** Annotated image from the pipeline (base64 JPEG) */
  annotatedImageBase64?: string;
  /** Device geolocation at analysis time */
  coordinates?: { lat: number; lng: number };
}

interface DetectionHistoryState {
  /** Full analysis records (for History page) */
  analyses: AnalysisRecord[];
  /** Real-time activity log entries (for ActivityPanel) */
  activityLogs: ActivityLog[];
  /** All detections from all analyses (for LiveFeed) */
  allDetections: Detection[];

  /** Push a completed analysis into the store */
  addAnalysis: (record: AnalysisRecord) => void;
  /** Push a single activity log */
  addActivityLog: (log: ActivityLog) => void;
  /** Clear everything */
  clearAll: () => void;
}

let _nextActivityId = 1;
let _nextDetectionId = 1;

export const useDetectionHistory = create<DetectionHistoryState>((set) => ({
  analyses: [],
  activityLogs: [],
  allDetections: [],

  addAnalysis: (record) =>
    set((state) => ({
      analyses: [record, ...state.analyses],
      allDetections: [...record.detections, ...state.allDetections],
    })),

  addActivityLog: (log) =>
    set((state) => ({
      activityLogs: [log, ...state.activityLogs],
    })),

  clearAll: () => set({ analyses: [], activityLogs: [], allDetections: [] }),
}));

/**
 * Helper: convert pipeline results into store entries.
 * Call this from ImageAnalysis after a successful pipeline run.
 * All detections from a single photo are stored together under one AnalysisRecord.
 */
export function pushPipelineResultsToStore(
  imageName: string,
  result: {
    detections: Array<{
      id: string;
      objectName: string;
      status: string;
      confidenceScore: number;
      vitLabel: string | null;
      vitConfidence: number | null;
    }>;
    processingTimeMs: number;
  },
  extra?: {
    annotatedImageBase64?: string;
    coordinates?: { lat: number; lng: number };
  },
) {
  const store = useDetectionHistory.getState();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const analysisId = `analysis-${Date.now()}`;

  // Map pipeline detections → Detection type for the store
  const gradients: Record<string, { from: string; to: string }> = {
    threat: { from: 'from-red-600', to: 'to-orange-500' },
    verified: { from: 'from-emerald-600', to: 'to-cyan-500' },
    analyzing: { from: 'from-amber-500', to: 'to-yellow-400' },
  };

  const detections: Detection[] = result.detections.map((d) => {
    const g = gradients[d.status] || gradients.analyzing;
    return {
      id: `det-${_nextDetectionId++}`,
      objectName: d.objectName,
      status: (d.status as Detection['status']) || 'analyzing',
      timeDetected: timeStr,
      confidenceScore: d.confidenceScore,
      gradientFrom: g.from,
      gradientTo: g.to,
      description: d.vitLabel
        ? `Classified as ${d.vitLabel} (${d.vitConfidence}% confidence) via ViT pipeline.`
        : `Detected as ${d.objectName} by YOLO.`,
      sourceImage: imageName,
      analysisId,
    };
  });

  const threats = detections.filter((d) => d.status === 'threat').length;
  const verified = detections.filter((d) => d.status === 'verified').length;
  const analyzing = detections.filter((d) => d.status === 'analyzing').length;

  // Store the full analysis record (one per image — all detections grouped)
  store.addAnalysis({
    id: analysisId,
    imageName,
    timestamp: now.toISOString(),
    totalDetections: detections.length,
    threats,
    verified,
    analyzing,
    processingTimeMs: result.processingTimeMs,
    detections,
    annotatedImageBase64: extra?.annotatedImageBase64,
    coordinates: extra?.coordinates,
  });

  // One consolidated activity log per image (not one per detection)
  const objectSummary = detections.map((d) => d.objectName).join(', ');
  store.addActivityLog({
    id: `act-${_nextActivityId++}`,
    message: `Analysis of "${imageName}" — ${detections.length} object(s) detected [${objectSummary}] in ${result.processingTimeMs.toFixed(0)}ms`,
    timestamp: timeStr,
    type: threats > 0 ? 'alert' : 'system',
    analysisId,
  });

  if (threats > 0) {
    store.addActivityLog({
      id: `act-${_nextActivityId++}`,
      message: `⚠ ${threats} threat(s) identified in "${imageName}"`,
      timestamp: timeStr,
      type: 'alert',
      analysisId,
    });
  }
}
