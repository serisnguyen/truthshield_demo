
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Shield, Users, MessageSquareText, 
  Bot, BookOpen, Loader2, UserCircle, BellRing, Phone, Search, Globe, ScanFace, Grip, Mail
} from 'lucide-react';
import AlertOverlay from './components/AlertOverlay';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingFlow from './components/OnboardingFlow';
import CallOverlay from './components/CallOverlay';

// Lazy Load Components
const HomeScreen = lazy(() => import('./components/HomeScreen'));
// Replaced ContactsScreen with PhoneApp
const PhoneApp = lazy(() => import('./components/PhoneApp'));
// Replaced MessageGuard with MessagesApp
const MessagesApp = lazy(() => import('./components/MessagesApp'));
const ChatScreen = lazy(() => import('./components/ChatScreen'));
const ProfileScreen = lazy(() => import('./components/ProfileScreen'));
const ScamLibraryScreen = lazy(() => import('./components/ScamLibraryScreen'));
const CallHistoryScreen = lazy(() => import('./components/CallHistoryScreen'));
const LookupScreen = lazy(() => import('./components/LookupScreen'));
const CommunityScreen = lazy(() => import('./components/CommunityScreen'));
const DeepfakeScanner = lazy(() => import('./components/DeepfakeScanner'));

export type Tab = 'home' | 'phone' | 'messages' | 'chat' | 'profile' | 'library' | 'history' | 'lookup' | 'community' | 'scanner';

const LoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#F0F4F8]">
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
    <p className="text-slate-500 font-bold animate-pulse text-sm uppercase tracking-wide">Đang tải hệ thống...</p>
  </div>
);

const AppContent: React.FC = () => {
  const { user, isLoading, isOnboarding, incomingCall, isSeniorMode } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showAlert, setShowAlert] = useState(false);

  // If loading
  if (isLoading) return <LoadingFallback />;

  // If not logged in or in onboarding process
  if (!user || isOnboarding) {
      return <OnboardingFlow />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen onNavigate={setActiveTab} />;
      case 'scanner': return <DeepfakeScanner />;
      case 'phone': return <PhoneApp />; // New Dialer App
      case 'messages': return <MessagesApp />; // New SMS App
      case 'chat': return <ChatScreen />;
      case 'profile': return <ProfileScreen />;
      case 'library': return <ScamLibraryScreen />;
      case 'history': return <CallHistoryScreen onBack={() => setActiveTab('profile')} />;
      case 'lookup': return <LookupScreen onBack={() => setActiveTab('home')} />;
      case 'community': return <CommunityScreen />;
      default: return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#F0F4F8] text-slate-800 font-sans flex flex-col h-screen overflow-hidden ${isSeniorMode ? 'text-lg' : ''}`}>
      
      {/* Desktop/Tablet Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-80 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl z-30 fixed h-full shadow-sm">
        <div className="h-24 flex items-center px-8 border-b border-slate-100">
          <div className="bg-gradient-premium p-2.5 rounded-2xl shadow-lg shadow-slate-300">
            <Shield className="w-7 h-7 text-white" fill="currentColor" />
          </div>
          <div className="ml-4">
            <h1 className="font-black text-xl tracking-tight text-slate-900">TruthShield AI</h1>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Premium Security</p>
          </div>
        </div>
        <nav className="flex-1 py-8 px-6 space-y-3 overflow-y-auto">
          <NavSideItem icon={<Shield size={20} />} label="Tổng Quan" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavSideItem icon={<Phone size={20} />} label="Điện Thoại" isActive={activeTab === 'phone'} onClick={() => setActiveTab('phone')} />
          <NavSideItem icon={<MessageSquareText size={20} />} label="Tin Nhắn" isActive={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
          <NavSideItem icon={<ScanFace size={20} />} label="Quét Deepfake" isActive={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} />
          <NavSideItem icon={<Search size={20} />} label="Tra Cứu Số" isActive={activeTab === 'lookup'} onClick={() => setActiveTab('lookup')} />
          <NavSideItem icon={<Globe size={20} />} label="Cộng Đồng" isActive={activeTab === 'community'} onClick={() => setActiveTab('community')} />
          <NavSideItem icon={<BookOpen size={20} />} label="Thư Viện Lừa Đảo" isActive={activeTab === 'library'} onClick={() => setActiveTab('library')} />
          
          <div className="pt-4 pb-2">
             <div className="h-px bg-slate-100 w-full"></div>
          </div>
          <NavSideItem icon={<Bot size={20} />} label="Trợ Lý AI" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <NavSideItem icon={<UserCircle size={20} />} label="Cài Đặt & Cá Nhân" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-80 flex flex-col h-full relative bg-[#F0F4F8]">
        {/* Mobile Header */}
        <div className={`md:hidden flex items-center justify-between px-5 bg-white/80 backdrop-blur-md border-b border-slate-200 z-20 shrink-0 mt-safe sticky top-0 ${isSeniorMode ? 'h-20' : 'h-16'}`}>
           <div className="flex items-center gap-2.5">
              <div className={`bg-gradient-premium rounded-lg ${isSeniorMode ? 'p-2' : 'p-1.5'}`}>
                <Shield className={`${isSeniorMode ? 'w-6 h-6' : 'w-5 h-5'} text-white fill-current`} />
              </div>
              <span className={`${isSeniorMode ? 'text-xl' : 'text-lg'} font-black text-slate-900 tracking-tight`}>TruthShield</span>
           </div>
           <button onClick={() => setShowAlert(true)} className="p-2.5 text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
               <BellRing size={isSeniorMode ? 24 : 20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-28 md:pb-0 scroll-smooth">
          <Suspense fallback={<LoadingFallback />}>
            {renderContent()}
          </Suspense>
        </div>

        {/* Mobile Dock (Replaced with Dialer/Messages Focus) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 pointer-events-none p-4 pb-6">
          <div className={`bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[32px] px-2 py-3 pointer-events-auto flex justify-around items-center max-w-sm mx-auto ${isSeniorMode ? 'py-4' : 'py-3'}`}>
            <NavButton icon={<Phone size={isSeniorMode ? 28 : 24} />} label="Gọi" isActive={activeTab === 'phone'} onClick={() => setActiveTab('phone')} />
            <NavButton icon={<MessageSquareText size={isSeniorMode ? 28 : 24} />} label="SMS" isActive={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
            
            <div className="relative -top-8">
                <button 
                    onClick={() => setActiveTab('home')}
                    className={`bg-gradient-premium rounded-full flex items-center justify-center text-white shadow-xl shadow-slate-400/50 active:scale-95 transition-transform border-[6px] border-[#F0F4F8] ${isSeniorMode ? 'w-20 h-20' : 'w-16 h-16'}`}
                >
                    <Shield size={isSeniorMode ? 32 : 28} fill="currentColor" />
                </button>
            </div>
            
            <NavButton icon={<ScanFace size={isSeniorMode ? 28 : 24} />} label="Scan" isActive={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} />
            <NavButton icon={<Grip size={isSeniorMode ? 28 : 24} />} label="Menu" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </div>
      </main>

      {/* Global Overlays */}
      {showAlert && <AlertOverlay onClose={() => setShowAlert(false)} />}
      {incomingCall && <CallOverlay call={incomingCall} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

// UI Components
const NavButton = ({ icon, label, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
      isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <div className={`transition-all ${isActive ? '-translate-y-0.5' : ''}`}>
      {icon}
    </div>
  </button>
);

const NavSideItem = ({ icon, label, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;
