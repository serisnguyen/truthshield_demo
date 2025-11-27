
import React, { useState } from 'react';
import { 
  User, Mic, LogOut, ChevronRight, Phone, MessageSquareText, Bell, Settings, Shield, Disc, PhoneOff, AlertTriangle, Eye, Type, Trash2, Ban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VoiceSetupModal from './VoiceSetupModal';

const ProfileScreen: React.FC = () => {
  const { user, logout, updateSettings, toggleSeniorMode, isSeniorMode, unblockNumber } = useAuth();
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  if (!user) return null;

  return (
    <div className={`p-4 md:p-6 pt-20 md:pt-10 pb-32 min-h-screen max-w-3xl mx-auto animate-in fade-in ${isSeniorMode ? 'text-lg' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center gap-5 mb-8">
            <div className={`rounded-full bg-gradient-premium flex items-center justify-center font-bold text-white text-3xl border-4 border-white shadow-lg relative ${isSeniorMode ? 'w-28 h-28' : 'w-24 h-24'}`}>
                {user.name?.charAt(0) || <User />}
                <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
            </div>
            <div>
                <h1 className={`font-black text-slate-900 ${isSeniorMode ? 'text-4xl' : 'text-3xl'}`}>{user.name}</h1>
                <p className="text-slate-500 font-medium">{user.phone}</p>
                <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Premium Protection
                </span>
            </div>
        </div>

        {/* Settings Grid */}
        <div className="space-y-8">
            
            {/* Display / Accessibility */}
            <section>
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-4 px-2 flex items-center gap-2">
                    <Eye size={14} /> Hiển thị & Truy cập
                </h3>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
                     <div className="flex items-center justify-between">
                        <div>
                            <h4 className={`font-bold text-slate-800 flex items-center gap-2 ${isSeniorMode ? 'text-xl' : 'text-sm'}`}>
                                <Type size={isSeniorMode ? 24 : 16} className="text-purple-600" /> Chế độ Người Cao Tuổi
                            </h4>
                            <p className={`text-slate-400 mt-0.5 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Chữ to, giao diện đơn giản, dễ nhìn hơn.</p>
                        </div>
                        <button 
                            onClick={toggleSeniorMode}
                            className={`w-14 h-8 rounded-full transition-colors relative ${isSeniorMode ? 'bg-purple-600' : 'bg-slate-200'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-sm ${isSeniorMode ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            </section>

            {/* AI Customization */}
            <section>
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-4 px-2 flex items-center gap-2">
                    <Settings size={14} /> Cấu hình AI Bảo Vệ
                </h3>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                    
                    {/* Risk Threshold Slider */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={`font-bold text-slate-800 flex items-center gap-2 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                                <Shield size={isSeniorMode ? 20 : 16} className="text-blue-600" /> Ngưỡng Cảnh Báo
                            </label>
                            <span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm">{user.riskThreshold || 70}/100</span>
                        </div>
                        <input 
                            type="range" 
                            min="50" 
                            max="95" 
                            value={user.riskThreshold || 70} 
                            onChange={(e) => updateSettings({ riskThreshold: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className={`text-slate-400 mt-2 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>
                            AI sẽ báo động đỏ khi điểm rủi ro vượt quá mức này.
                        </p>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Auto Record Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className={`font-bold text-slate-800 flex items-center gap-2 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                                <Disc size={isSeniorMode ? 20 : 16} className="text-red-500" /> Tự động Ghi âm
                            </h4>
                            <p className={`text-slate-400 mt-0.5 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Khi phát hiện cuộc gọi nguy hiểm.</p>
                        </div>
                        <button 
                            onClick={() => updateSettings({ autoRecordHighRisk: !user.autoRecordHighRisk })}
                            className={`w-12 h-7 rounded-full transition-colors relative ${user.autoRecordHighRisk ? 'bg-red-500' : 'bg-slate-200'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${user.autoRecordHighRisk ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Auto Hangup Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className={`font-bold text-slate-800 flex items-center gap-2 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                                <PhoneOff size={isSeniorMode ? 20 : 16} className="text-slate-700" /> Tự động Ngắt
                            </h4>
                            <p className={`text-slate-400 mt-0.5 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Tự tắt máy nếu rủi ro cực cao (&gt;80).</p>
                        </div>
                        <button 
                            onClick={() => updateSettings({ autoHangupHighRisk: !user.autoHangupHighRisk })}
                            className={`w-12 h-7 rounded-full transition-colors relative ${user.autoHangupHighRisk ? 'bg-slate-800' : 'bg-slate-200'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${user.autoHangupHighRisk ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            </section>

             {/* Blocked Numbers Section */}
             <section>
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-4 px-2 flex items-center gap-2">
                    <Ban size={14} /> Danh sách chặn
                </h3>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                     <button 
                        onClick={() => setShowBlocked(!showBlocked)}
                        className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                     >
                         <div className="flex items-center gap-3">
                             <div className={`bg-red-50 rounded-full flex items-center justify-center text-red-600 ${isSeniorMode ? 'w-12 h-12' : 'w-10 h-10'}`}>
                                 <PhoneOff size={isSeniorMode ? 24 : 18} />
                             </div>
                             <div>
                                 <h4 className={`font-bold text-slate-800 ${isSeniorMode ? 'text-xl' : 'text-sm'}`}>
                                     Số đã chặn ({user.blockedNumbers?.length || 0})
                                 </h4>
                                 <p className={`text-slate-500 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Quản lý danh sách đen</p>
                             </div>
                         </div>
                         <ChevronRight className={`text-slate-300 transition-transform ${showBlocked ? 'rotate-90' : ''}`} />
                     </button>
                     
                     {showBlocked && (
                         <div className="border-t border-slate-100 bg-slate-50">
                             {user.blockedNumbers && user.blockedNumbers.length > 0 ? (
                                 <div className="divide-y divide-slate-200">
                                     {user.blockedNumbers.map(phone => (
                                         <div key={phone} className="p-4 flex items-center justify-between hover:bg-slate-100">
                                             <span className="font-bold text-slate-700">{phone}</span>
                                             <button 
                                                 onClick={() => unblockNumber(phone)}
                                                 className="text-red-500 hover:bg-red-100 p-2 rounded-lg text-sm font-bold flex items-center gap-1"
                                             >
                                                 <Trash2 size={16} /> Bỏ chặn
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="p-6 text-center text-slate-400 text-sm">Chưa chặn số nào.</div>
                             )}
                         </div>
                     )}
                </div>
            </section>

            {/* Voice Security */}
            <section>
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-3 px-2">Voice DNA</h3>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <button 
                        onClick={() => setShowVoiceModal(true)}
                        className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`bg-purple-100 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform ${isSeniorMode ? 'p-4' : 'p-3'}`}>
                                <Mic size={isSeniorMode ? 28 : 20} />
                            </div>
                            <div>
                                <h4 className={`font-bold text-slate-800 ${isSeniorMode ? 'text-xl' : 'text-lg'}`}>Giọng nói của tôi</h4>
                                <p className="text-slate-500 text-xs font-medium mt-0.5">
                                    {user.hasVoiceProfile ? 'Đã thiết lập an toàn ✓' : 'Chưa thiết lập (Nguy hiểm)'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-300" />
                    </button>
                </div>
            </section>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                     <span className={`font-black text-blue-600 mb-1 ${isSeniorMode ? 'text-4xl' : 'text-3xl'}`}>{user.callHistory?.length || 0}</span>
                     <span className="text-xs font-bold text-slate-400 uppercase">Cuộc gọi giám sát</span>
                 </div>
                 <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                     <span className={`font-black text-red-500 mb-1 ${isSeniorMode ? 'text-4xl' : 'text-3xl'}`}>
                        {user.callHistory?.filter(c => (c.aiAnalysis?.riskScore || 0) > 50).length || 0}
                     </span>
                     <span className="text-xs font-bold text-slate-400 uppercase">Ngăn chặn rủi ro</span>
                 </div>
            </div>

            <button 
                onClick={logout}
                className={`w-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors ${isSeniorMode ? 'py-5 text-lg' : 'py-4 text-sm'}`}
            >
                <LogOut size={isSeniorMode ? 24 : 18} /> Đăng Xuất Tài Khoản
            </button>
            
            <div className="text-center text-[10px] text-slate-300 font-mono pb-4">
                TruthShield AI v4.2.0 • Powered by Community
            </div>
        </div>

        {showVoiceModal && (
            <VoiceSetupModal onClose={() => setShowVoiceModal(false)} initialTab="self" />
        )}
    </div>
  );
};

export default ProfileScreen;
