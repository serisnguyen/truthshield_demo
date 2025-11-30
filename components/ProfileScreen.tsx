
import React, { useState } from 'react';
import { 
  User, LogOut, ChevronRight, Settings, Shield, PhoneOff, Trash2, Ban, Eye, Type, Crown, Briefcase, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PremiumUpgradeModal from './PremiumUpgradeModal';

const ProfileScreen: React.FC = () => {
  const { user, logout, updateSettings, toggleSeniorMode, isSeniorMode, unblockNumber } = useAuth();
  const [showBlocked, setShowBlocked] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  if (!user) return null;

  const isFree = user.plan === 'free';

  return (
    <div className={`p-4 md:p-6 pt-20 md:pt-10 pb-32 min-h-screen max-w-3xl mx-auto animate-in fade-in ${isSeniorMode ? 'text-lg' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center gap-5 mb-6">
            <div className={`rounded-full bg-gradient-premium flex items-center justify-center font-bold text-white text-3xl border-4 border-white shadow-lg relative ${isSeniorMode ? 'w-28 h-28' : 'w-24 h-24'}`}>
                {user.name?.charAt(0) || <User />}
                {user.plan !== 'free' && (
                    <div className="absolute bottom-0 right-0 bg-yellow-400 p-1.5 rounded-full border-4 border-white">
                        <Crown size={14} className="text-white fill-white" />
                    </div>
                )}
            </div>
            <div>
                <h1 className={`font-black text-slate-900 ${isSeniorMode ? 'text-4xl' : 'text-3xl'}`}>{user.name}</h1>
                <p className="text-slate-500 font-medium">{user.phone}</p>
                <div className={`inline-flex items-center gap-1 mt-2 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    isFree 
                    ? 'bg-slate-100 text-slate-600' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                }`}>
                    {isFree ? 'Thành viên Free' : (
                        <>
                            <Crown size={12} fill="currentColor"/> 
                            {user.plan === 'family' ? 'Gói Gia Đình' : 'Premium Member'}
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* --- PREMIUM UPGRADE BANNER (If Free) --- */}
        {isFree && (
            <div 
                onClick={() => setShowPremiumModal(true)}
                className="mb-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 cursor-pointer relative overflow-hidden group border border-slate-700"
            >
                <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-yellow-400/30 transition-colors"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-xl mb-1 flex items-center gap-2 text-yellow-400">
                            <Crown size={20} fill="currentColor" /> Nâng cấp Premium
                        </h3>
                        <p className="text-slate-300 text-sm font-medium">Chỉ 49k/tháng. Quét AI không giới hạn.</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-full backdrop-blur-sm">
                        <ChevronRight className="text-white" />
                    </div>
                </div>
            </div>
        )}

        {/* Settings Grid */}
        <div className="space-y-6">
            
            {/* Display / Accessibility */}
            <section>
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-3 px-2 flex items-center gap-2">
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
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-3 px-2 flex items-center gap-2">
                    <Settings size={14} /> Cấu hình AI Bảo Vệ
                </h3>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6 relative">
                    
                    {/* Free Plan Lock Overlay for Advanced Settings */}
                    {isFree && (
                        <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-3xl">
                            <button 
                                onClick={() => setShowPremiumModal(true)}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
                            >
                                <Zap size={16} className="text-yellow-400" fill="currentColor" /> Mở khóa tính năng Pro
                            </button>
                        </div>
                    )}

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
                            disabled={isFree}
                        />
                        <p className={`text-slate-400 mt-2 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>
                            AI sẽ báo động đỏ khi điểm uy tín số gọi đến thấp hơn mức này.
                        </p>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Auto Hangup Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className={`font-bold text-slate-800 flex items-center gap-2 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                                <PhoneOff size={isSeniorMode ? 20 : 16} className="text-slate-700" /> Tự động Ngắt
                            </h4>
                            <p className={`text-slate-400 mt-0.5 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Tự tắt máy nếu số gọi đến là lừa đảo (Scam).</p>
                        </div>
                        <button 
                            onClick={() => updateSettings({ autoHangupHighRisk: !user.autoHangupHighRisk })}
                            className={`w-12 h-7 rounded-full transition-colors relative ${user.autoHangupHighRisk ? 'bg-slate-800' : 'bg-slate-200'}`}
                            disabled={isFree}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${user.autoHangupHighRisk ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            </section>

             {/* Blocked Numbers Section */}
             <section>
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-3 px-2 flex items-center gap-2">
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

            <button 
                onClick={logout}
                className={`w-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors ${isSeniorMode ? 'py-5 text-lg' : 'py-4 text-sm'}`}
            >
                <LogOut size={isSeniorMode ? 24 : 18} /> Đăng Xuất Tài Khoản
            </button>
            
            <div className="text-center text-[10px] text-slate-300 font-mono pb-4">
                TruthShield AI v5.0.0 • Powered by Carrier Data
            </div>
        </div>

        {showPremiumModal && <PremiumUpgradeModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  );
};

export default ProfileScreen;
