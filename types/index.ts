
export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  isAppUser: boolean; // True if they are in global DB
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
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

// Carrier / Community Data
export interface PhoneLookupResult {
  phoneNumber: string;
  carrier: string; // Viettel, Vina, etc.
  tags: ('scam' | 'spam' | 'safe' | 'delivery' | 'business')[];
  reportCount: number;
  reputationScore: number; // 0 (Scam) - 100 (Safe)
  communityLabel?: string; // e.g., "Lừa đảo công an", "Shipper Shopee"
}

export interface CallLogItem {
  id: string;
  phoneNumber: string;
  contactName?: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  duration: number; // seconds
  riskStatus: 'safe' | 'suspicious' | 'scam'; 
  communityInfo?: PhoneLookupResult; // Data from community/carrier
  aiAnalysis?: {
      riskScore: number;
      explanation: string;
      detectedKeywords: string[];
      timestamp: number;
  };
  hasRecording?: boolean;
  screeningData?: {
      isScreened: boolean;
  };
}

export type SubscriptionPlan = 'free' | 'premium' | 'family';

export interface UserUsage {
    deepfakeScans: number;
    messageScans: number;
    callLookups: number;
    lastResetDate: string; // YYYY-MM-DD
}

export interface User {
  id: string;
  name: string;
  phone: string;
  contacts: ContactItem[];
  contactsPermission: boolean;
  alertHistory: AlertHistoryItem[];
  callHistory: CallLogItem[];
  messageHistory: MessageAnalysisLog[];
  emergencyContacts: EmergencyContact[];
  securityQuestions?: string[];
  sosMessage?: string;
  familyId?: string;
  familyCodeTimestamp?: number;
  
  // Subscription
  plan: SubscriptionPlan;
  validUntil?: number;
  
  // Usage Tracking (New)
  usage: UserUsage;

  // Settings
  riskThreshold: number;
  autoHangupHighRisk: boolean;
  isSeniorMode: boolean;
  blockedNumbers: string[];
}
