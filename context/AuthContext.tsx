
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  User, 
  EmergencyContact, 
  AlertHistoryItem, 
  MessageAnalysisLog, 
  CallLogItem,
  PhoneLookupResult,
  FamilyVoiceProfile,
  ContactItem
} from '../types';
import { useUserProfile } from '../hooks/useUserProfile';

// Re-export types
export * from '../types';

// --- MOCK GLOBAL DATABASES ---

const MOCK_GLOBAL_VOICE_REGISTRY: Record<string, boolean> = {
    '0901234567': true, 
    '0912345678': true, 
    '0987654321': false,
    '0999999999': true,
};

// Mock iCallMe-style Community Data
const MOCK_COMMUNITY_DB: Record<string, PhoneLookupResult> = {
    '0888999000': {
        phoneNumber: '0888999000',
        carrier: 'Vinaphone',
        tags: ['scam'],
        reportCount: 1245,
        reputationScore: 5,
        communityLabel: 'Giả danh Công an'
    },
    '0909112233': {
        phoneNumber: '0909112233',
        carrier: 'Mobifone',
        tags: ['delivery', 'safe'],
        reportCount: 0,
        reputationScore: 95,
        communityLabel: 'Shipper Giao Hàng Tiết Kiệm'
    },
    '02477778888': {
        phoneNumber: '02477778888',
        carrier: 'Cố định',
        tags: ['spam', 'business'],
        reportCount: 342,
        reputationScore: 40,
        communityLabel: 'Quảng cáo Bất động sản'
    }
};

const MOCK_PHONE_CONTACTS = [
    { name: 'Mẹ Yêu', phone: '0901234567' },
    { name: 'Bố', phone: '0912345678' },
    { name: 'Anh Trai', phone: '0987654321' },
    { name: 'Chị Gái', phone: '0999888777' }, 
    { name: 'Sếp', phone: '0911223344' }, 
];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnboarding: boolean;
  completeOnboarding: () => void;
  login: (phone: string) => Promise<void>;
  logout: () => void;
  syncContacts: () => Promise<void>;
  checkGlobalVoiceRegistry: (phone: string) => boolean;
  incomingCall: CallLogItem | null;
  setIncomingCall: (call: CallLogItem | null) => void;
  addAlertToHistory: (alert: Omit<AlertHistoryItem, 'id' | 'timestamp'>) => void;
  clearAlertHistory: () => void;
  addMessageAnalysis: (log: Omit<MessageAnalysisLog, 'id' | 'timestamp'>) => void;
  clearMessageHistory: () => void;
  updateMessageHistoryItem: (id: string, result: 'safe' | 'suspicious' | 'scam', explanation: string) => void;
  setVoiceProfileStatus: (status: boolean) => void;
  updateCallHistoryItem: (callId: string, updates: Partial<CallLogItem>) => void;
  updateSettings: (settings: Partial<User>) => void;
  blockNumber: (phone: string) => void;
  unblockNumber: (phone: string) => void;
  isOnline: boolean;
  isSeniorMode: boolean;
  
  // New Features
  lookupPhoneNumber: (phone: string) => Promise<PhoneLookupResult | null>;
  reportPhoneNumber: (phone: string, type: 'scam' | 'spam' | 'safe', label: string) => Promise<void>;
  toggleSeniorMode: () => void;

  // Added missing properties
  role: 'elder' | 'user';
  incomingSOS: boolean;
  setIncomingSOS: (value: boolean) => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  removeEmergencyContact: (id: string) => void;
  regenerateFamilyId: () => void;
  addFamilyVoiceProfile: (profile: Omit<FamilyVoiceProfile, 'id' | 'timestamp'>) => void;
  addContact: (contact: Omit<ContactItem, 'id' | 'hasVoiceProfile' | 'isAppUser' | 'status'>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallLogItem | null>(null);
  const [incomingSOS, setIncomingSOS] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('truthshield_token');
    if (token) {
      try {
        const storedProfile = localStorage.getItem('truthshield_profile_cache');
        if (storedProfile) {
          const parsedUser = JSON.parse(storedProfile);
          // Defaults for new fields
          if (parsedUser.isSeniorMode === undefined) parsedUser.isSeniorMode = false;
          if (parsedUser.blockedNumbers === undefined) parsedUser.blockedNumbers = [];
          setUser(parsedUser);
        }
      } catch (e) {
        localStorage.removeItem('truthshield_token');
      }
    }
    setIsLoading(false);
  }, []);

  const persistUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('truthshield_profile_cache', JSON.stringify(userData));
  };

  const userActions = useUserProfile({ user, persistUser });
  
  const regenerateFamilyIdWrapper = () => {
    userActions.regenerateFamilyId(() => Math.floor(100000 + Math.random() * 900000).toString());
  };

  const login = async (phone: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const storedProfile = localStorage.getItem('truthshield_profile_cache');
        let finalUser: User | null = null;
        
        if (storedProfile) {
            const u = JSON.parse(storedProfile);
            if (u.phone === phone) finalUser = u;
        }

        if (!finalUser) {
          setIsOnboarding(true);
          finalUser = {
            id: Date.now().toString(),
            name: "Người dùng", 
            phone: phone,
            hasVoiceProfile: false,
            contacts: [],
            alertHistory: [],
            messageHistory: [],
            callHistory: [],
            contactsPermission: false,
            emergencyContacts: [],
            familyVoiceProfiles: [],
            riskThreshold: 70,
            autoRecordHighRisk: true,
            autoHangupHighRisk: false,
            isSeniorMode: false,
            blockedNumbers: []
          };
        }

        persistUser(finalUser);
        localStorage.setItem('truthshield_token', 'mock_token_' + phone);
        resolve();
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('truthshield_token');
    localStorage.removeItem('truthshield_profile_cache');
    setIsOnboarding(false);
  };

  const completeOnboarding = () => {
      setIsOnboarding(false);
  };

  const syncContacts = async () => {
      if (!user) return;
      await new Promise<void>(r => setTimeout(r, 1500));
      
      const syncedContacts = MOCK_PHONE_CONTACTS.map(contact => {
          const hasGlobalProfile = MOCK_GLOBAL_VOICE_REGISTRY[contact.phone] || false;
          return {
              id: contact.phone, 
              name: contact.name,
              phone: contact.phone,
              hasVoiceProfile: hasGlobalProfile,
              isAppUser: hasGlobalProfile, 
              status: hasGlobalProfile ? 'verified' : 'unverified'
          };
      });

      const updatedUser = { 
          ...user, 
          contacts: syncedContacts as any,
          contactsPermission: true 
      };
      persistUser(updatedUser);
  };

  const checkGlobalVoiceRegistry = (phone: string) => {
      return MOCK_GLOBAL_VOICE_REGISTRY[phone] || false;
  };

  // --- NEW FEATURES IMPLEMENTATION ---

  const lookupPhoneNumber = async (phone: string): Promise<PhoneLookupResult | null> => {
      return new Promise<PhoneLookupResult | null>((resolve) => {
          setTimeout(() => {
              const result = MOCK_COMMUNITY_DB[phone];
              if (result) {
                  resolve(result);
              } else {
                  // Simulate clean number
                  resolve({
                      phoneNumber: phone,
                      carrier: 'Unknown',
                      tags: [],
                      reportCount: 0,
                      reputationScore: 80, // Neutral/Good
                      communityLabel: 'Chưa có báo cáo'
                  });
              }
          }, 800);
      });
  };

  const reportPhoneNumber = async (phone: string, type: 'scam' | 'spam' | 'safe', label: string) => {
      return new Promise<void>((resolve) => {
          setTimeout(() => {
              // Update mock DB locally for demo
              MOCK_COMMUNITY_DB[phone] = {
                  phoneNumber: phone,
                  carrier: 'Unknown',
                  tags: [type],
                  reportCount: 1,
                  reputationScore: type === 'safe' ? 100 : 10,
                  communityLabel: label
              };
              resolve();
          }, 1000);
      });
  };

  const toggleSeniorMode = () => {
      if (user) {
          const updated = { ...user, isSeniorMode: !user.isSeniorMode };
          persistUser(updated);
      }
  };

  const role = user?.isSeniorMode ? 'elder' : 'user';

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      isOnboarding,
      completeOnboarding,
      login, 
      logout,
      syncContacts,
      checkGlobalVoiceRegistry,
      incomingCall,
      setIncomingCall,
      isOnline,
      isSeniorMode: user?.isSeniorMode || false,
      lookupPhoneNumber,
      reportPhoneNumber,
      toggleSeniorMode,
      role,
      incomingSOS,
      setIncomingSOS,
      ...userActions,
      regenerateFamilyId: regenerateFamilyIdWrapper,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
