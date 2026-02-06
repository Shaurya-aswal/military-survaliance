// Mock data has been removed — all detections and activity logs now come from
// the zustand store (src/store/detectionHistory.ts) populated by real pipeline results.

import { Detection, ActivityLog } from '@/types/detection';

export const mockDetections: Detection[] = [];

export const mockActivityLogs: ActivityLog[] = [];
