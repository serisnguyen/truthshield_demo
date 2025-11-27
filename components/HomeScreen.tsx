
import React, { useState, useEffect } from 'react';
import { ShieldCheck, MessageSquareText, Activity, AlertTriangle, Phone, BellRing, ChevronRight, Truck, Lock, Search, Users, Database, Globe, Scan, Sparkles, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Tab } from '../App';

interface HomeScreenProps {
  onNavigate: (tab: Tab) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { user, setIncomingCall, isSeniorMode } = useAuth();
  const [scanning, setScanning] = useState(true);

  // Fake scanning effect
  useEffect(() => {
      const interval = setInterval(() => {
          setScanning(prev => !prev);
      }, 4000);
      return () => clearInterval(interval);
  }, []);
  
  // 1. Shipper Call (Safe Context)
  const triggerShipperCall = () => {
      setIncomingCall({
          id: Date.now().toString(),
          phoneNumber: '0909112233', 
          direction: 'incoming',
          timestamp: Date.now(),
          duration: 0,
          riskStatus: 'safe' 
      });
  };

  // 2. Scam Call (Dangerous Context)
  const triggerScamCall = () => {
      setIncomingCall({
          id: Date.now().toString(),
          phoneNumber: '0888999000', 
          direction: 'incoming',
          timestamp: Date.now(),
          duration: 0,
          riskStatus: 'suspicious' 
      });
  };

  return (
    <div className={`p-4 md:p-8 pt-24 md:pt-10 pb-32 max-w-6xl mx-auto animate-in fade-in duration-500 ${isSeniorMode ? 'space-y-8' : 'space-y-8'}`}>
       
       {/* Greeting Section */}
       <div className="flex justify-between items-end mb-2">
           <div>
               <h1 className={`${isSeniorMode ? 'text-4xl' : 'text-3xl'} font-black text-slate-900 mb-1`}>
                   Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.name}</span> 👋
               </h1>
               <p className={`${isSeniorMode ? 'text-xl' : 'text-base'} text-slate-500 font-medium flex items-center gap-2`}>
                   <ShieldCheck size={16} className="text-green-500" /> Hệ thống đang hoạt động tối ưu.
               </p>
           </div>
           {!isSeniorMode && (
               <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                   <Wifi size={14} className="text-green-500" />
                   <span className="text-xs font-bold text-slate-600">Đã kết nối AI Core</span>
               </div>
           )}
       </div>

       {/* HERO SECTION: RADAR STATUS */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* MAIN PROTECTION CARD - RADAR STYLE */}
           <div className={`lg:col-span-2 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[32px] text-white shadow-2xl shadow-slate-300 overflow-hidden relative group min-h-[280px] flex items-center ${isSeniorMode ? 'p-8' : 'p-8'}`}>
               
               {/* Background Grid & Radar Effect */}
               <div className="absolute inset-0 bg-grid-slate opacity-10"></div>
               <div className="absolute right-[-10%] top-[-10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[80px] animate-pulse"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center w-full gap-8">
                   {/* Radar Visualization */}
                   <div className="relative w-40 h-40 flex-shrink-0">
                       <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                       <div className="absolute inset-4 border-2 border-blue-400/20 rounded-full"></div>
                       <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-transparent animate-[spin_4s_linear_infinite]"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                           <ShieldCheck size={isSeniorMode ? 64 : 48} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
                       </div>
                       {/* Scanning blips */}
                       <div className="absolute top-8 left-10 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                       <div className="absolute bottom-6 right-8 w-1.5 h-1.5 bg-blue-300 rounded-full animate-ping delay-700"></div>
                   </div>

                   <div className="flex-1 text-center md:text-left">
                       <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-1 mb-4 backdrop-blur-md">
                           <Activity size={14} className="text-blue-300 animate-pulse" />
                           <span className="text-xs font-bold text-blue-100 tracking-wider uppercase">Real-time Protection</span>
                       </div>
                       <h2 className={`${isSeniorMode ? 'text-4xl' : 'text-4xl'} font-black mb-2 leading-tight`}>
                           Bạn đang được <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Bảo vệ An toàn</span>
                       </h2>
                       <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto md:mx-0">
                           AI đang giám sát cuộc gọi, tin nhắn và môi trường mạng để ngăn chặn lừa đảo.
                       </p>
                   </div>
               </div>

               {/* Bottom Info Bar */}
               <div className="absolute bottom-0 left-0 right-0 bg-white/5 backdrop-blur-md border-t border-white/10 p-4 flex justify-around">
                   <div className="text-center">
                       <span className="block text-xl font-bold text-white">24/7</span>
                       <span className="text-[10px] text-slate-400 uppercase tracking-wider">Giám sát</span>
                   </div>
                   <div className="w-px bg-white/10"></div>
                   <div className="text-center">
                       <span className="block text-xl font-bold text-green-400">0</span>
                       <span className="text-[10px] text-slate-400 uppercase tracking-wider">Mối đe dọa</span>
                   </div>
                   <div className="w-px bg-white/10"></div>
                   <div className="text-center">
                       <span className="block text-xl font-bold text-blue-400">100%</span>
                       <span className="text-[10px] text-slate-400 uppercase tracking-wider">Pin</span>
                   </div>
               </div>
           </div>

           {/* STATS CARD (Right Column) */}
           <div className="grid grid-rows-2 gap-6">
               {/* Community Stat */}
               <div onClick={() => onNavigate('community')} className="glass-panel p-6 rounded-[32px] cursor-pointer hover:border-blue-300 transition-all group relative overflow-hidden">
                   <div className="absolute right-[-20px] top-[-20px] bg-indigo-50 w-24 h-24 rounded-full blur-xl group-hover:bg-indigo-100 transition-colors"></div>
                   <div className="relative z-10">
                       <div className="flex justify-between items-start mb-4">
                           <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
                               <Globe size={24} />
                           </div>
                           <ArrowUpRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                       </div>
                       <h3 className="text-3xl font-black text-slate-900">56 Tỷ</h3>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Spam đã chặn</p>
                   </div>
               </div>

               {/* Scan Stat */}
               <div onClick={() => onNavigate('scanner')} className="glass-panel p-6 rounded-[32px] cursor-pointer hover:border-purple-300 transition-all group relative overflow-hidden">
                   <div className="absolute right-[-20px] top-[-20px] bg-purple-50 w-24 h-24 rounded-full blur-xl group-hover:bg-purple-100 transition-colors"></div>
                   <div className="relative z-10">
                       <div className="flex justify-between items-start mb-4">
                            <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
                               <Scan size={24} />
                           </div>
                           <ArrowUpRight size={20} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
                       </div>
                       <h3 className="text-3xl font-black text-slate-900">Deepfake</h3>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Quét Hình/Tiếng</p>
                   </div>
               </div>
           </div>
       </div>

       {/* QUICK ACTIONS BAR (Glassmorphism) */}
       <div 
         onClick={() => onNavigate('lookup')}
         className={`glass-panel rounded-[28px] flex items-center cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group relative overflow-hidden ${isSeniorMode ? 'p-6' : 'p-4'}`}
       >
            <div className={`rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 transition-colors ${isSeniorMode ? 'w-20 h-20 mr-6' : 'w-14 h-14 mr-5'}`}>
                <Search size={isSeniorMode ? 32 : 24} />
            </div>
            <div className="flex-1 z-10">
                <h3 className={`font-bold text-slate-900 mb-1 ${isSeniorMode ? 'text-2xl' : 'text-lg'}`}>Tra cứu số lạ (Truecaller)</h3>
                <p className={`text-slate-500 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>Nhập số điện thoại để kiểm tra uy tín...</p>
            </div>
            <div className="bg-slate-100 rounded-full p-2 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ChevronRight size={isSeniorMode ? 32 : 20} />
            </div>
       </div>

       {/* DEMO SECTION */}
       <div>
           <h2 className={`${isSeniorMode ? 'text-2xl' : 'text-lg'} font-bold text-slate-900 mb-4 px-1 flex items-center gap-2`}>
               <Lock size={isSeniorMode ? 24 : 18} className="text-slate-400"/> Giả lập tình huống (Demo)
           </h2>
           <div className={`grid grid-cols-2 gap-4`}>
                <button 
                    onClick={triggerShipperCall}
                    className="glass-panel hover:bg-green-50/50 p-6 rounded-3xl text-left transition-all relative overflow-hidden group active:scale-95 border-b-4 border-transparent hover:border-green-400"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-100 rounded-2xl text-green-600 shadow-sm"><Truck size={isSeniorMode ? 28 : 24} /></div>
                    </div>
                    <span className={`block font-black text-slate-800 mb-1 ${isSeniorMode ? 'text-2xl' : 'text-lg'}`}>Shipper Gọi</span>
                    <span className={`text-slate-500 font-medium ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Mô phỏng an toàn</span>
                </button>

                <button 
                    onClick={triggerScamCall}
                    className="glass-panel hover:bg-red-50/50 p-6 rounded-3xl text-left transition-all relative overflow-hidden group active:scale-95 border-b-4 border-transparent hover:border-red-400"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-100 rounded-2xl text-red-600 shadow-sm"><AlertTriangle size={isSeniorMode ? 28 : 24} /></div>
                    </div>
                    <span className={`block font-black text-slate-800 mb-1 ${isSeniorMode ? 'text-2xl' : 'text-lg'}`}>Lừa Đảo Gọi</span>
                    <span className={`text-slate-500 font-medium ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Mô phỏng nguy hiểm</span>
                </button>
           </div>
       </div>

       {/* News Widget */}
       <div className="bg-[#0F172A] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl group cursor-pointer" onClick={() => onNavigate('library')}>
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/30 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
               <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                   <BellRing size={32} className="text-yellow-400 group-hover:animate-swing" />
               </div>
               <div className="flex-1">
                   <div className="flex items-center gap-2 mb-2">
                       <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">Mới</span>
                       <h3 className={`${isSeniorMode ? 'text-2xl' : 'text-lg'} font-bold`}>Cảnh báo thủ đoạn: SIM 5G</h3>
                   </div>
                   <p className={`text-slate-300 leading-relaxed mb-0 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                       Chiêu lừa "nâng cấp SIM" để chiếm đoạt mã OTP ngân hàng đang bùng phát. Xem cách phòng tránh ngay.
                   </p>
               </div>
               <div className="self-center bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                   <ChevronRight size={24} />
               </div>
           </div>
       </div>
    </div>
  );
};

// Helper for icon used in stats
const ArrowUpRight = ({size, className}: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="7" y1="17" x2="17" y2="7"></line>
        <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
);

export default HomeScreen;
