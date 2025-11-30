
import React, { useState, Suspense, lazy } from 'react';
import { 
  Shield, MessageSquareText, 
  Bot, BookOpen, UserCircle, BellRing, Search, ScanFace, Grip, Sparkles
} from 'lucide-react';
import AlertOverlay from './components/AlertOverlay';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingFlow from './components/OnboardingFlow';
import CallOverlay from './components/CallOverlay';

// Lazy Load Components
const HomeScreen = lazy(() => import('./components/HomeScreen'));
const MessageGuard = lazy(() => import('./components/MessageGuard')); // Reused as main message app
const ChatScreen = lazy(() => import('./components/ChatScreen'));
const ProfileScreen = lazy(() => import('./components/ProfileScreen'));
const ScamLibraryScreen = lazy(() => import('./components/ScamLibraryScreen'));
const CallHistoryScreen = lazy(() => import('./components/CallHistoryScreen'));
const LookupScreen = lazy(() => import('./components/LookupScreen'));
const DeepfakeScanner = lazy(() => import('./components/DeepfakeScanner'));

export type Tab = 'home' | 'messagescan' | 'chat' | 'profile' | 'library' | 'history' | 'lookup' | 'scanner';

const LoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center h-full">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Shield size={24} className="text-blue-600 animate-pulse" />
      </div>
    </div>
    <p className="text-slate-600 font-bold mt-4 text-sm uppercase tracking-wide animate-pulse">Đang khởi tạo...</p>
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
      case 'messagescan': return <MessageGuard />;
      case 'chat': return <ChatScreen />;
      case 'profile': return <ProfileScreen />;
      case 'library': return <ScamLibraryScreen />;
      case 'history': return <CallHistoryScreen onBack={() => setActiveTab('profile')} />;
      case 'lookup': return <LookupScreen onBack={() => setActiveTab('home')} />;
      default: return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col h-screen overflow-hidden ${isSeniorMode ? 'text-lg' : ''}`}>
      
      {/* --- Desktop Sidebar (Glassmorphism) --- */}
      <aside className="hidden md:flex w-80 flex-col glass-panel z-30 fixed h-[96%] top-[2%] left-4 rounded-[32px] overflow-hidden border border-white/40 shadow-2xl">
        <div className="h-24 flex items-center px-8 bg-gradient-to-b from-white/40 to-transparent">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/30">
              <Shield className="w-7 h-7 text-white" fill="currentColor" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div className="ml-4">
            <h1 className="font-black text-xl tracking-tight text-slate-900 leading-none">TruthShield</h1>
            <div className="flex items-center gap-1 mt-1">
               <Sparkles size={12} className="text-blue-600" />
               <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">AI Protection</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto no-scrollbar">
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trung tâm chính</p>
          <NavSideItem icon={<Shield size={20} />} label="Tổng Quan" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavSideItem icon={<MessageSquareText size={20} />} label="Quét Tin Nhắn" isActive={activeTab === 'messagescan'} onClick={() => setActiveTab('messagescan')} />
          
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Công cụ AI</p>
          <NavSideItem icon={<ScanFace size={20} />} label="Quét Deepfake" isActive={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} />
          <NavSideItem icon={<Search size={20} />} label="Tra Cứu Số" isActive={activeTab === 'lookup'} onClick={() => setActiveTab('lookup')} />
          <NavSideItem icon={<Bot size={20} />} label="Trợ Lý AI" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Thư viện</p>
          <NavSideItem icon={<BookOpen size={20} />} label="Thư Viện Cảnh Báo" isActive={activeTab === 'library'} onClick={() => setActiveTab('library')} />
          <NavSideItem icon={<UserCircle size={20} />} label="Cá Nhân" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>
        
        {/* User Mini Profile */}
        <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-white/20">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                     {user.name.charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                     <p className="text-xs text-slate-600 truncate font-medium">
                        {user.plan === 'family' ? 'Gói Gia Đình' : user.plan === 'premium' ? 'Gói Premium' : 'Thành viên Free'}
                     </p>
                 </div>
             </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 md:pl-[340px] flex flex-col h-full relative">
        {/* Mobile Header (Floating Glass) */}
        <div className={`md:hidden absolute top-0 left-0 right-0 px-4 pt-4 z-20`}>
           <div className={`glass-panel rounded-2xl flex items-center justify-between px-4 shadow-xl shadow-slate-200/50 ${isSeniorMode ? 'h-20' : 'h-16'}`}>
                <div className="flex items-center gap-3">
                    <div className={`bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 ${isSeniorMode ? 'p-2.5' : 'p-2'}`}>
                        <Shield className={`${isSeniorMode ? 'w-6 h-6' : 'w-5 h-5'} text-white fill-current`} />
                    </div>
                    <div>
                        <span className={`${isSeniorMode ? 'text-xl' : 'text-lg'} font-black text-slate-900 tracking-tight leading-none block`}>TruthShield</span>
                        {!isSeniorMode && <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">AI Protection</span>}
                    </div>
                </div>
                <button onClick={() => setShowAlert(true)} className="p-2.5 text-slate-600 bg-white/80 rounded-full hover:bg-white transition-colors relative shadow-sm border border-slate-100">
                    <BellRing size={isSeniorMode ? 24 : 20} />
                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-40 md:pb-0 scroll-smooth custom-scrollbar">
          <Suspense fallback={<LoadingFallback />}>
            {renderContent()}
          </Suspense>
        </div>

        {/* Mobile Dock (Floating Island) */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-30 pointer-events-none">
          <div className={`glass-panel bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 rounded-[32px] px-2 pointer-events-auto flex justify-around items-center max-w-sm mx-auto relative ${isSeniorMode ? 'py-4' : 'py-3'}`}>
            <NavButton icon={<MessageSquareText size={isSeniorMode ? 28 : 24} />} label="Quét SMS" isActive={activeTab === 'messagescan'} onClick={() => setActiveTab('messagescan')} />
            <NavButton icon={<Search size={isSeniorMode ? 28 : 24} />} label="Tra Cứu" isActive={activeTab === 'lookup'} onClick={() => setActiveTab('lookup')} />
            
            <div className="relative -top-10 mx-2">
                <button 
                    onClick={() => setActiveTab('home')}
                    className={`bg-gradient-to-b from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/40 active:scale-95 transition-transform border-[6px] border-[#F0F4F8] relative group ${isSeniorMode ? 'w-20 h-20' : 'w-18 h-18 p-4'}`}
                >
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Shield size={isSeniorMode ? 36 : 28} fill="currentColor" />
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

// Styled Components for Nav
const NavButton = ({ icon, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
      isActive ? 'text-blue-600 bg-blue-50 scale-110 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    {icon}
    {isActive && <span className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"></span>}
  </button>
);

const NavSideItem = ({ icon, label, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm group relative overflow-hidden ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
    }`}
  >
    <div className={`relative z-10 flex items-center gap-4 transition-transform ${isActive ? 'translate-x-1' : ''}`}>
        {icon}
        <span>{label}</span>
    </div>
    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>}
  </button>
);

export default App;
