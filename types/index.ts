
export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  hasVoiceProfile: boolean; // True if they have recorded voice
  isAppUser: boolean; // True if they are in global DB
  status: 'verified' | 'unverified' | 'pending';
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface FamilyVoiceProfile {
  id: string;
  name: string;
  relationship: string;
  audioId: string;
  timestamp: number;
}

export interface AlertHistoryItem {
  id: string;
  timestamp: number;
  type: 'deepfake' | 'scam_msg' | 'sos' | 'community_block';
  riskScore: number;
  details: string;
}

export interface MessageAnalysisLog {
  id: string;
  text: string;
  result: 'safe' | 'suspicious' | 'scam';
  explanation: string;
  timestamp: number;
}

// New Interface for Community Data
export interface PhoneLookupResult {
  phoneNumber: string;
  carrier: string; // Viettel, Vina, etc.
  tags: ('scam' | 'spam' | 'safe' | 'delivery' | 'business')[];
  reportCount: number;
  reputationScore: number; // 0 (Scam) - 100 (Safe)
  communityLabel?: string; // e.g., "Lừa đảo công an", "Shipper Shopee"
}

export interface ScreeningTranscript {
  transcript: string[];
  callerResponse?: string;
  analyzedRisk?: 'safe' | 'suspicious' | 'scam';
  aiResponse?: string;
  isScreened: boolean;
}

export interface CallLogItem {
  id: string;
  phoneNumber: string;
  contactName?: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  duration: number; // seconds
  riskStatus: 'safe' | 'suspicious' | 'scam'; 
  hasRecording?: boolean;
  communityInfo?: PhoneLookupResult; // New: Data from community
  aiAnalysis?: {
    riskScore: number;
    explanation: string;
    detectedKeywords: string[];
    timestamp: number;
  };
  screeningData?: ScreeningTranscript;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  hasVoiceProfile: boolean;
  contacts: ContactItem[];
  contactsPermission: boolean;
  alertHistory: AlertHistoryItem[];
  callHistory: CallLogItem[];
  messageHistory: MessageAnalysisLog[];
  emergencyContacts: EmergencyContact[];
  familyVoiceProfiles: FamilyVoiceProfile[];
  securityQuestions?: string[];
  sosMessage?: string;
  familyId?: string;
  familyCodeTimestamp?: number;
  
  // Settings
  riskThreshold: number;
  autoRecordHighRisk: boolean;
  autoHangupHighRisk: boolean;
  isSeniorMode: boolean; // New setting
  blockedNumbers: string[]; // New: Blocked numbers list
}
