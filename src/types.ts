export type InspectionDomain = 'industrial' | 'medical' | 'document' | 'general';
export type SensitivityLevel = 'Low' | 'Medium' | 'High';
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Region {
  label: string;
  severity: SeverityLevel;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  description: string;
}

export interface VisionAnalysisResponse {
  summary: string;
  confidenceScore: number;
  anomaliesDetected: boolean;
  regions: Region[];
  recommendations: string[];
}

export interface ScanRecord {
  id: number;
  user_id: number;
  domain: InspectionDomain;
  image_url: string;
  status: 'completed' | 'processing' | 'failed';
  summary: string;
  raw_analysis: VisionAnalysisResponse;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DomainMeta {
  id: InspectionDomain;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  focusAreas: string[];
  suggestedPrompt: string;
  icon: string;
  sampleImages: {
    title: string;
    description: string;
    url: string;
  }[];
}
