export type DetectionStatus = 'threat' | 'verified' | 'analyzing';

export interface Detection {
  id: string;
  objectName: string;
  status: DetectionStatus;
  timeDetected: string;
  confidenceScore: number;
  gradientFrom: string;
  gradientTo: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  /** The image file name this detection originated from */
  sourceImage?: string;
  /** The analysis record ID this detection belongs to */
  analysisId?: string;
}

export interface ActivityLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'alert' | 'system' | 'user';
  /** Links this log entry back to an analysis record */
  analysisId?: string;
}
