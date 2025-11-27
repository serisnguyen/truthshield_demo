
import React from 'react';
import { ShieldCheck, MessageSquareText, Activity, AlertTriangle, Phone, BellRing, ChevronRight, Truck, Lock, Search, Users, Database, Globe } from 'lucide-react';
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
    <div className={`p-4 md:p-8 pt-20 md:pt-10 pb-20 max-w-5xl mx-auto animate-in fade-in duration-500 ${isSeniorMode ? 'space-y-8' : 'space-y-6'}`}>
       
       <div className="mb-4">
          <h1 className={`${isSeniorMode ? 'text-4xl' : 'text-3xl'} font-black text-slate-900 mb-2`}>Xin chào, {user?.name} 👋</h1>
          <p className={`${isSeniorMode ? 'text-xl' : 'text-lg'} text-slate-500`}>
              {isSeniorMode ? 'Hệ thống đang bảo vệ bác.' : 'Hệ thống an ninh đang hoạt động.'}
          </p>
       </div>

       {/* Quick Lookup Bar (iCallMe Style) */}
       <div 
         onClick={() => onNavigate('lookup')}
         className={`bg-white border rounded-3xl shadow-sm flex items-center cursor-pointer hover:shadow-md transition-all group ${isSeniorMode ? 'p-6 border-slate-300' : 'p-4 border-slate-200'}`}
       >
            <div className={`rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors ${isSeniorMode ? 'w-16 h-16 mr-6' : 'w-12 h-12 mr-4'}`}>
                <Search size={isSeniorMode ? 32 : 24} />
            </div>
            <div className="flex-1">
                <h3 className={`font-bold text-slate-900 ${isSeniorMode ? 'text-2xl' : 'text-lg'}`}>Tra cứu số lạ</h3>
                <p className={`text-slate-500 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>Nhập số điện thoại để kiểm tra...</p>
            </div>
            <div className="bg-slate-100 rounded-full p-2 text-slate-400">
                <ChevronRight size={isSeniorMode ? 32 : 24} />
            </div>
       </div>

       {/* Status Cards - Premium Design */}
       <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${isSeniorMode ? 'mb-10' : 'mb-8'}`}>
           
           {/* Main Status */}
           <div className={`bg-gradient-premium rounded-[32px] text-white shadow-xl shadow-slate-200 relative overflow-hidden group ${isSeniorMode ? 'p-8' : 'p-6'}`}>
               <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 rounded-full blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/4 group-hover:opacity-30 transition-opacity"></div>
               <div className="relative z-10 h-full flex flex-col justify-between">
                   <div className="flex items-center justify-between mb-6">
                       <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md">
                           <ShieldCheck size={isSeniorMode ? 32 : 24} className="text-green-400" />
                       </div>
                       <span className="text-xs font-bold uppercase tracking-wider bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/20">
                           Protected
                       </span>
                   </div>
                   <div>
                       <h3 className={`${isSeniorMode ? 'text-4xl' : 'text-3xl'} font-black mb-1`}>An Toàn</h3>
                       <p className="text-slate-400 text-sm">Giám sát 24/7 đang bật.</p>
                   </div>
               </div>
           </div>

           {/* Global Stats (Truecaller Style) */}
           <div onClick={() => onNavigate('community')} className={`bg-indigo-600 rounded-[32px] text-white shadow-xl shadow-indigo-200 relative overflow-hidden cursor-pointer group ${isSeniorMode ? 'p-8' : 'p-6'}`}>
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-[50px] opacity-20 translate-y-1/2 -translate-x-1/4"></div>
               <div className="relative z-10 h-full flex flex-col justify-between">
                   <div className="flex items-center justify-between mb-6">
                       <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                           <Globe size={isSeniorMode ? 32 : 24} className="text-white" />
                       </div>
                       <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg text-xs font-bold">
                           <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                           LIVE
                       </div>
                   </div>
                   <div>
                       <span className={`block font-black text-white mb-1 ${isSeniorMode ? 'text-5xl' : 'text-4xl'}`}>
                           56 Tỷ
                       </span>
                       <span className="text-sm text-indigo-100 font-bold uppercase tracking-wide">Spam Đã Chặn</span>
                       <p className="text-xs text-indigo-200 mt-1">Dữ liệu từ Global Community</p>
                   </div>
               </div>
           </div>

           {/* Messages Stats */}
           <div onClick={() => onNavigate('messages')} className={`bg-white border border-slate-200 rounded-[32px] cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden ${isSeniorMode ? 'p-8' : 'p-6'}`}>
                <div className="absolute right-0 top-0 w-32 h-32 bg-purple-50 rounded-bl-[100px] -z-0 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-6">
                       <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                           <MessageSquareText size={isSeniorMode ? 32 : 24} />
                       </div>
                   </div>
                   <div>
                       <span className={`block font-black text-slate-900 mb-1 ${isSeniorMode ? 'text-5xl' : 'text-4xl'}`}>OK</span>
                       <span className="text-sm text-slate-500 font-bold uppercase tracking-wide">Tin nhắn sạch</span>
                   </div>
               </div>
           </div>
       </div>

       {/* Actions Demo */}
       <h2 className={`${isSeniorMode ? 'text-2xl' : 'text-lg'} font-bold text-slate-900 mb-4 px-1 flex items-center gap-2`}>
           <Lock size={isSeniorMode ? 24 : 18} className="text-slate-400"/> Giả lập tình huống (Demo)
       </h2>
       <div className={`grid grid-cols-2 gap-4 ${isSeniorMode ? 'mb-12' : 'mb-8'}`}>
            <button 
                onClick={triggerShipperCall}
                className="bg-white hover:bg-green-50 border border-slate-200 hover:border-green-200 p-5 rounded-3xl text-left transition-all relative overflow-hidden group shadow-sm hover:shadow-md active:scale-95"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-full text-green-600"><Truck size={isSeniorMode ? 28 : 20} /></div>
                    <span className="font-bold text-green-700 text-xs uppercase bg-green-50 px-2 py-1 rounded-lg">An toàn</span>
                </div>
                <span className={`block font-black text-slate-800 ${isSeniorMode ? 'text-2xl' : 'text-lg'}`}>Shipper Gọi</span>
                <span className={`text-slate-500 ${isSeniorMode ? 'text-sm' : 'text-xs'}`}>Mô phỏng cuộc gọi bình thường.</span>
            </button>

            <button 
                onClick={triggerScamCall}
                className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 p-5 rounded-3xl text-left transition-all relative overflow-hidden group shadow-sm hover:shadow-md active:scale-95"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-100 rounded-full text-red-600"><AlertTriangle size={isSeniorMode ? 28 : 20} /></div>
                    <span className="font-bold text-red-700 text-xs uppercase bg-red-50 px-2 py-1 rounded-lg">Nguy hiểm</span>
                </div>
                <span className={`block font-black text-slate-800 ${isSeniorMode ? 'text-2xl' : 'text-lg'}`}>Lừa Đảo Gọi</span>
                <span className={`text-slate-500 ${isSeniorMode ? 'text-sm' : 'text-xs'}`}>Mô phỏng kẻ giả danh công an.</span>
            </button>
       </div>

       {/* News Widget */}
       <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
           <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
               <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                   <BellRing size={32} className="text-yellow-400 animate-pulse" />
               </div>
               <div className="flex-1">
                   <h3 className={`${isSeniorMode ? 'text-2xl' : 'text-xl'} font-bold mb-2`}>Cảnh báo thủ đoạn mới</h3>
                   <p className={`text-slate-300 mb-6 leading-relaxed ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                       Gần đây xuất hiện chiêu lừa đảo "nâng cấp SIM 5G" để chiếm đoạt tài khoản ngân hàng. Tuyệt đối không làm theo hướng dẫn qua điện thoại.
                   </p>
                   <button onClick={() => onNavigate('library')} className={`bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg active:scale-95 ${isSeniorMode ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-sm'}`}>
                       Xem chi tiết
                   </button>
               </div>
           </div>
           
           {/* Decor */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
       </div>
    </div>
  );
};

export default HomeScreen;
