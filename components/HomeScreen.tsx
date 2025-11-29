import React from 'react';
import { ShieldCheck, Activity, AlertTriangle, ChevronRight, Truck, Search, Scan, Globe, ArrowUpRight, BellRing, Shield, Battery, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Tab } from '../App';

interface HomeScreenProps {
  onNavigate: (tab: Tab) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { user, setIncomingCall, isSeniorMode } = useAuth();

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
    <div className={`p-4 md:p-8 pt-24 md:pt-10 pb-32 max-w-6xl mx-auto animate-in fade-in duration-500 space-y-6 md:space-y-8`}>
       
       {/* Greeting Section */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
           <div>
               <div className="flex items-center gap-2 mb-1">
                    <h1 className={`${isSeniorMode ? 'text-3xl' : 'text-3xl md:text-4xl'} font-black text-slate-900 tracking-tight`}>
                        Xin chào, <span className="text-blue-600">{user?.name}</span>
                    </h1>
                    <span className="text-2xl md:text-3xl animate-wave origin-bottom">👋</span>
               </div>
               <div className={`${isSeniorMode ? 'text-lg' : 'text-base md:text-lg'} text-slate-500 font-bold flex items-center gap-2`}>
                   <div className="bg-green-100 p-1 rounded-full">
                       <ShieldCheck size={16} className="text-green-600 fill-current" />
                   </div>
                   Hệ thống hoạt động tốt.
               </div>
           </div>
           
           {!isSeniorMode && (
               <div className="self-start md:self-auto flex items-center gap-2 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-200 shadow-sm">
                   <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                   <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-wide">AI Core Online</span>
               </div>
           )}
       </div>

       {/* HERO DASHBOARD */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* MAIN PROTECTION CARD - High Contrast & No Overlap */}
           <div className="lg:col-span-2 bg-slate-900 rounded-[32px] md:rounded-[40px] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden flex flex-col justify-between min-h-[340px] border border-slate-800 group">
               
               {/* Animated Background */}
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
               
               {/* Main Content Area */}
               <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 h-full">
                   
                   {/* Radar Animation - Fixed Size Container */}
                   <div className="relative w-32 h-32 md:w-44 md:h-44 flex-shrink-0 mt-2">
                       <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping [animation-duration:3s]"></div>
                       <div className="absolute inset-4 border border-blue-500/30 rounded-full"></div>
                       <div className="absolute inset-0 rounded-full border border-blue-500/10 overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 w-[50%] h-[50%] bg-gradient-to-br from-blue-500/40 to-transparent origin-top-left animate-[spin_4s_linear_infinite] rounded-tl-full -translate-x-[0px] -translate-y-[0px]"></div>
                       </div>
                       
                       <div className="absolute inset-0 flex items-center justify-center">
                           <div className="bg-slate-900 p-4 rounded-full border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)] relative z-10">
                               <Shield size={isSeniorMode ? 48 : 40} className="text-blue-400 fill-blue-500/10" />
                           </div>
                       </div>

                       {/* Status Dot */}
                       <div className="absolute top-0 right-0">
                           <span className="relative flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-slate-900"></span>
                            </span>
                       </div>
                   </div>

                   {/* Text Content */}
                   <div className="flex-1 text-center md:text-left flex flex-col justify-center h-full">
                       <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-3">
                           <div className="bg-blue-500/20 p-1 rounded-md">
                               <Activity size={14} className="text-blue-400" />
                           </div>
                           <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Real-time Shield</span>
                       </div>
                       
                       <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
                           BẢO VỆ <br/>
                           <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-[length:200%_auto] animate-gradient">
                               TUYỆT ĐỐI
                           </span>
                       </h2>
                       
                       <p className="text-slate-400 font-medium text-sm md:text-base leading-relaxed max-w-sm mx-auto md:mx-0">
                           AI đang quét sâu mọi cuộc gọi và tin nhắn để chặn đứng rủi ro trước khi chúng tiếp cận bạn.
                       </p>
                   </div>
               </div>

               {/* Bottom Stats Bar */}
               <div className="relative z-10 bg-black/20 backdrop-blur-md border-t border-white/5 p-4 md:p-5 grid grid-cols-3 gap-px">
                   <div className="flex flex-col items-center justify-center border-r border-white/5">
                       <div className="flex items-center gap-2 text-white font-bold text-lg">
                           <Clock size={16} className="text-emerald-400" /> 24/7
                       </div>
                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Hoạt động</span>
                   </div>
                   
                   <div className="flex flex-col items-center justify-center border-r border-white/5">
                       <div className="flex items-center gap-2 text-white font-bold text-lg">
                           <ShieldCheck size={16} className="text-blue-400" /> 0
                       </div>
                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Mối đe dọa</span>
                   </div>
                   
                   <div className="flex flex-col items-center justify-center">
                       <div className="flex items-center gap-2 text-white font-bold text-lg">
                           <Battery size={16} className="text-yellow-400" /> Tối ưu
                       </div>
                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Pin & Data</span>
                   </div>
               </div>
           </div>

           {/* STATS / ACTION COLUMN */}
           <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
               {/* Community Stat */}
               <div onClick={() => onNavigate('community')} className="bg-white p-6 rounded-[32px] cursor-pointer shadow-lg shadow-slate-200/50 border border-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between h-full">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Globe size={80} className="text-indigo-600" />
                   </div>
                   <div className="flex justify-between items-start mb-4">
                       <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                           <Globe size={20} />
                       </div>
                       <ArrowUpRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                   </div>
                   <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tight">56 Tỷ</h3>
                       <p className="text-xs font-bold text-slate-500 mt-1">Spam đã chặn</p>
                   </div>
               </div>

               {/* Scan Stat */}
               <div onClick={() => onNavigate('scanner')} className="bg-white p-6 rounded-[32px] cursor-pointer shadow-lg shadow-slate-200/50 border border-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between h-full">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Scan size={80} className="text-purple-600" />
                   </div>
                   <div className="flex justify-between items-start mb-4">
                       <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                           <Scan size={20} />
                       </div>
                       <ArrowUpRight size={20} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
                   </div>
                   <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Scan</h3>
                       <p className="text-xs font-bold text-slate-500 mt-1">Quét Deepfake</p>
                   </div>
               </div>
           </div>
       </div>

       {/* QUICK ACTION: LOOKUP (Search Bar Style) */}
       <div 
         onClick={() => onNavigate('lookup')}
         className="bg-white rounded-[28px] p-2 flex items-center shadow-lg shadow-slate-200/60 border border-white cursor-pointer group hover:shadow-xl transition-all"
       >
           <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
               <Search size={24} />
           </div>
           <div className="flex-1 px-4">
               <h3 className="font-bold text-slate-900 text-lg">Tra cứu số lạ</h3>
               <p className="text-slate-400 text-sm font-medium">Nhập số điện thoại để kiểm tra...</p>
           </div>
           <div className="pr-4">
               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                   <ChevronRight size={18} />
               </div>
           </div>
       </div>

       {/* DEMO ACTIONS ROW */}
       <div>
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Giả lập tình huống</h2>
           <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={triggerShipperCall}
                    className="bg-white hover:bg-green-50 p-5 rounded-[24px] text-left transition-all border border-slate-100 hover:border-green-200 shadow-sm group"
                >
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform">
                        <Truck size={20} />
                    </div>
                    <span className="block font-bold text-slate-900">Shipper Gọi</span>
                    <span className="text-xs text-slate-500 font-medium">Kịch bản an toàn</span>
                </button>

                <button 
                    onClick={triggerScamCall}
                    className="bg-white hover:bg-red-50 p-5 rounded-[24px] text-left transition-all border border-slate-100 hover:border-red-200 shadow-sm group"
                >
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-3 group-hover:scale-110 transition-transform">
                        <AlertTriangle size={20} />
                    </div>
                    <span className="block font-bold text-slate-900">Lừa Đảo Gọi</span>
                    <span className="text-xs text-slate-500 font-medium">Kịch bản nguy hiểm</span>
                </button>
           </div>
       </div>

       {/* News Widget */}
       <div 
         onClick={() => onNavigate('library')}
         className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden cursor-pointer group"
       >
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
           
           <div className="relative z-10 flex items-center gap-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                   <BellRing size={20} className="text-yellow-400" />
               </div>
               <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                       <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">HOT</span>
                       <h3 className="font-bold">Thủ đoạn mới: SIM 5G</h3>
                   </div>
                   <p className="text-slate-400 text-sm line-clamp-1">Cảnh báo chiêu trò nâng cấp SIM để chiếm đoạt OTP ngân hàng.</p>
               </div>
               <ChevronRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
           </div>
       </div>
    </div>
  );
};

export default HomeScreen;