export enum Category {
  GENERAL = "General",
  OBC = "OBC",
  SC = "SC",
  ST = "ST",
  EWS = "EWS"
}

export enum ExamType {
  NEET = "NEET",
  JEE = "JEE",
  CET_PCM = "CET-PCM",
  CET_PCB = "CET-PCB"
}

export enum QuotaType {
  AIQ = "All India Quota",
  STATE = "State Quota"
}

export type DocumentStatus = 'Pending' | 'Uploaded' | 'Verified' | 'Needs Attention';

export interface UserDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  url?: string;
  feedback?: string;
  updatedAt: any;
  required: boolean;
}

export interface HistoricalData {
  year: number;
  rank: number;
}

export interface College {
  id: string;
  name: string;
  state: string;
  city: string;
  examType: ExamType;
  cutoffRank: {
    [key in Category]: number;
  };
  link: string;
  type: "Medical" | "Engineering";
  quota: QuotaType;
  fees: {
    tuition: number;
    hostel: number;
  };
  nirfRanking?: number;
  description?: string;
  historicalTrends?: {
    [key in Category]?: HistoricalData[];
  };
}

export interface PredictionRequest {
  rank: number;
  category: Category;
  domicile: string;
  examType: ExamType;
  quota: QuotaType;
}

export interface NotificationSettings {
  scheduleUpdates: boolean;
  meritListAlerts: boolean;
  choiceFillingReminders: boolean;
  emailNotifications: boolean;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  role: 'student' | 'counselor';
}
