// filepath: /Users/apple/Desktop/military survaliance/home/src/store/detectionHistory.ts
import { create } from 'zustand';
import { Detection, ActivityLog } from '@/types/detection';

const API_BASE = '/api';

// ── Types ────────────────────────────────────────────────────────
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
  /** Whether the initial load from MongoDB has completed */
  hydrated: boolean;

  /** Push a completed analysis into the store (and persist to MongoDB) */
  addAnalysis: (record: AnalysisRecord) => void;
  /** Push a single activity log (and persist to MongoDB) */
  addActivityLog: (log: ActivityLog) => void;
  /** Delete a single analysis by ID (from store + MongoDB) */
  removeAnalysis: (analysisId: string) => Promise<void>;
  /** Clear everything (store + MongoDB) */
  clearAll: () => Promise<void>;
  /** Load all data from MongoDB into the store */
  hydrate: () => Promise<void>;
}

let _nextActivityId = 1;
let _nextDetectionId = 1;

// ── Persistence helpers (fire-and-forget) ────────────────────────
async function persistAnalysis(record: AnalysisRecord) {
  try {
    await fetch(`${API_BASE}/db/analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch (e) {
    console.warn('[store] Failed to persist analysis to MongoDB:', e);
  }
}

async function persistActivityLog(log: ActivityLog) {
  try {
    await fetch(`${API_BASE}/db/activity-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  } catch (e) {
    console.warn('[store] Failed to persist activity log to MongoDB:', e);
  }
}

async function deleteAnalysisFromDB(analysisId: string) {
  try {
    await fetch(`${API_BASE}/db/analyses/${analysisId}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[store] Failed to delete analysis from MongoDB:', e);
  }
}

async function clearAllFromDB() {
  try {
    await fetch(`${API_BASE}/db/analyses`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[store] Failed to clear MongoDB:', e);
  }
}

// ── Store ────────────────────────────────────────────────────────
export const useDetectionHistory = create<DetectionHistoryState>((set) => ({
  analyses: [],
  activityLogs: [],
  allDetections: [],
  hydrated: false,

  addAnalysis: (record) => {
    set((state) => ({
      analyses: [record, ...state.analyses],
      allDetections: [...record.detections, ...state.allDetections],
    }));
    persistAnalysis(record);
  },

  addActivityLog: (log) => {
    set((state) => ({
      activityLogs: [log, ...state.activityLogs],
    }));
    persistActivityLog(log);
  },

  removeAnalysis: async (analysisId) => {
    set((state) => {
      const remaining = state.analyses.filter((a) => a.id !== analysisId);
      return {
        analyses: remaining,
        allDetections: remaining.flatMap((a) => a.detections),
        activityLogs: state.activityLogs.filter((l) => l.analysisId !== analysisId),
      };
    });
    await deleteAnalysisFromDB(analysisId);
  },

  clearAll: async () => {
    set({ analyses: [], activityLogs: [], allDetections: [], hydrated: false });
    await clearAllFromDB();
  },

  hydrate: async () => {
    try {
      const [analysesRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/db/analyses`),
        fetch(`${API_BASE}/db/activity-logs`),
      ]);
      const analyses: AnalysisRecord[] = analysesRes.ok ? await analysesRes.json() : [];
      const activityLogs: ActivityLog[] = logsRes.ok ? await logsRes.json() : [];
      const allDetections = analyses.flatMap((a) => a.detections);

      // Keep auto-increment IDs in sync so new entries don't collide
      if (allDetections.length > 0) {
        const maxDetId = Math.max(
          0,
          ...allDetections
            .map((d) => parseInt(d.id.replace('det-', ''), 10))
            .filter((n) => !isNaN(n))
        );
        _nextDetectionId = maxDetId + 1;
      }
      if (activityLogs.length > 0) {
        const maxActId = Math.max(
          0,
          ...activityLogs
            .map((l) => parseInt(l.id.replace('act-', ''), 10))
            .filter((n) => !isNaN(n))
        );
        _nextActivityId = maxActId + 1;
      }

      set({ analyses, activityLogs, allDetections, hydrated: true });
    } catch (e) {
      console.warn('[store] Failed to hydrate from MongoDB, starting empty:', e);
      set({ hydrated: true });
    }
  },
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

/**
 * Helper: convert VIDEO pipeline results into store entries.
 * Call this from VideoAnalysis after a successful pipeline run.
 * Groups all detections from all frames under one AnalysisRecord.
 */
export function pushVideoResultsToStore(
  videoName: string,
  result: {
    frames: Array<{
      frameIndex: number;
      timestamp: number;
      detections: Array<{
        id: string;
        objectName: string;
        status: string;
        confidenceScore: number;
        vitLabel: string | null;
        vitConfidence: number | null;
      }>;
    }>;
    summary: {
      totalDetections: number;
      threats: number;
      verified: number;
      analyzing: number;
    };
    processingTimeMs: number;
  },
  extra?: {
    annotatedImageBase64?: string;   // thumbnail
    coordinates?: { lat: number; lng: number };
  },
) {
  const store = useDetectionHistory.getState();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const analysisId = `analysis-${Date.now()}`;

  const gradients: Record<string, { from: string; to: string }> = {
    threat: { from: 'from-red-600', to: 'to-orange-500' },
    verified: { from: 'from-emerald-600', to: 'to-cyan-500' },
    analyzing: { from: 'from-amber-500', to: 'to-yellow-400' },
  };

  // Flatten all per-frame detections into one list
  const detections: Detection[] = result.frames.flatMap((frame) =>
    frame.detections.map((d) => {
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
          ? `Frame #${frame.frameIndex} @ ${frame.timestamp.toFixed(1)}s — ${d.vitLabel} (${d.vitConfidence}% ViT)`
          : `Frame #${frame.frameIndex} @ ${frame.timestamp.toFixed(1)}s — ${d.objectName} (YOLO)`,
        sourceImage: videoName,
        analysisId,
      };
    })
  );

  const threats = result.summary.threats;
  const verified = result.summary.verified;
  const analyzing = result.summary.analyzing;

  store.addAnalysis({
    id: analysisId,
    imageName: `🎬 ${videoName}`,
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

  const uniqueObjects = [...new Set(detections.map((d) => d.objectName))];
  store.addActivityLog({
    id: `act-${_nextActivityId++}`,
    message: `Video analysis of "${videoName}" — ${detections.length} detection(s) across ${result.frames.length} frames [${uniqueObjects.join(', ')}] in ${result.processingTimeMs.toFixed(0)}ms`,
    timestamp: timeStr,
    type: threats > 0 ? 'alert' : 'system',
    analysisId,
  });

  if (threats > 0) {
    store.addActivityLog({
      id: `act-${_nextActivityId++}`,
      message: `⚠ ${threats} threat(s) identified in video "${videoName}"`,
      timestamp: timeStr,
      type: 'alert',
      analysisId,
    });
  }
}
