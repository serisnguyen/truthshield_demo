
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Shield, Crown, Zap, Activity, ScanFace, MessageSquareWarning, Users, User, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { useAuth, LIMITS } from '../context/AuthContext';

interface PremiumUpgradeModalProps {
  onClose: () => void;
  triggerSource?: string; // e.g., "deepfake_limit"
}

type PlanType = 'individual' | 'family';

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({ onClose, triggerSource }) => {
  const { upgradeSubscription, user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('individual');
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Determine current status
  const isFree = user?.plan === 'free';
  const isPremium = user?.plan === 'premium';

  // Default to Family if already Premium
  useEffect(() => {
      if (isPremium) setSelectedPlan('family');
  }, [isPremium]);

  // Calculate Trial Date
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7);
  const trialDateString = trialEndDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  // Focus Trap and Escape Key Handler
  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleUpgrade = () => {
      setProcessing(true);
      setTimeout(() => {
          // Pass the selected plan to the context
          upgradeSubscription(selectedPlan === 'family' ? 'family' : 'premium'); 
          setProcessing(false);
          const planName = selectedPlan === 'family' ? 'Gói Gia Đình' : 'Gói Pro';
          alert(`Đăng ký ${planName} thành công! ${isFree && selectedPlan === 'individual' ? 'Đã kích hoạt 7 ngày dùng thử.' : ''}`);
          onClose();
      }, 1500);
  };

  const getHeadline = () => {
      if (triggerSource === 'deepfake_limit') return "Hết lượt quét Deepfake hôm nay!";
      if (triggerSource === 'message_limit') return "Bạn đã dùng hết lượt quét tin nhắn!";
      if (triggerSource === 'lookup_limit') return "Hết lượt tra cứu số lạ hôm nay!";
      
      if (isPremium) return "Nâng cấp bảo vệ Gia Đình";
      return "Mở khóa sức mạnh AI";
  };

  const getSubHeadline = () => {
      if (isPremium) return "Bảo vệ thêm 4 người thân yêu";
      return "Dùng thử miễn phí 7 ngày. Hủy bất kỳ lúc nào.";
  };

  return (
    <div 
        className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
    >
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden relative flex flex-col focus:outline-none"
        tabIndex={-1}
      >
        
        <button 
            ref={closeButtonRef}
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors focus:ring-2 focus:ring-blue-500"
            aria-label="Đóng"
        >
            <X size={24} className="text-slate-700" />
        </button>

        {/* Header Image / Gradient */}
        <div className="bg-gradient-premium h-48 relative overflow-hidden flex flex-col items-center justify-center text-center px-6 shrink-0">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
            
            <div className="relative z-10 mt-2">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/30">
                    <Crown size={36} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                </div>
                <h2 id="upgrade-title" className="text-2xl font-black text-white leading-tight drop-shadow-md">
                    {getHeadline()}
                </h2>
                <div className="mt-2 inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-white text-xs font-bold">
                    <Calendar size={12} /> {getSubHeadline()}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 bg-white flex-1 overflow-y-auto">
            
            {/* PLAN TOGGLE (Hidden if upgrade flow is forced) */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex relative mb-6 shadow-inner">
                <button 
                    onClick={() => setSelectedPlan('individual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${
                        selectedPlan === 'individual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <User size={16} /> Gói Pro
                </button>
                <button 
                    onClick={() => setSelectedPlan('family')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${
                        selectedPlan === 'family' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Users size={16} /> Gói Gia Đình
                    {selectedPlan !== 'family' && (
                        <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                            HOT
                        </span>
                    )}
                </button>
            </div>

            {/* PRICING DISPLAY & TRIAL INFO */}
            <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300" key={selectedPlan}>
                {isFree && selectedPlan === 'individual' ? (
                    // Free -> Pro Trial View
                    <div className="flex flex-col items-center">
                        <div className="text-sm font-bold text-slate-400 line-through mb-1">49.000đ</div>
                        <div className="text-5xl font-black text-blue-600 mb-2">0đ</div>
                        <p className="text-sm font-bold text-slate-700 bg-blue-50 px-3 py-1 rounded-lg">
                            Trong 7 ngày đầu tiên
                        </p>
                    </div>
                ) : (
                    // Standard Pricing View
                    <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-5xl font-black ${selectedPlan === 'individual' ? 'text-blue-600' : 'text-purple-600'}`}>
                            {selectedPlan === 'individual' ? '49.000đ' : '99.000đ'}
                        </span>
                        <span className="text-slate-500 font-bold">/tháng</span>
                    </div>
                )}
                
                {selectedPlan === 'family' && (
                    <div className="mt-2 flex flex-col items-center">
                        <div className="flex -space-x-2 mt-2">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                    <User size={12} />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-bold">5 tài khoản Premium • Tiết kiệm 60%</p>
                    </div>
                )}
            </div>

            {/* FEATURES */}
            <div className="space-y-3 mb-8">
                <FeatureRow 
                    icon={<ScanFace size={20} />} 
                    color="blue" 
                    title="Quét Deepfake Không Giới Hạn" 
                    desc={isFree ? `Gói Free chỉ được ${LIMITS.FREE.DEEPFAKE_SCANS} lượt/ngày.` : "Phân tích Video/Audio nâng cao"} 
                />
                <FeatureRow 
                    icon={<MessageSquareWarning size={20} />} 
                    color="purple" 
                    title="Quét Tin Nhắn & Link Độc Hại" 
                    desc={isFree ? `Gói Free giới hạn ${LIMITS.FREE.MESSAGE_SCANS} tin nhắn/ngày.` : "Phát hiện lừa đảo thời gian thực"} 
                />
                {selectedPlan === 'family' ? (
                    <FeatureRow 
                        icon={<Users size={20} />} 
                        color="pink" 
                        title="Bảo Vệ Cả Gia Đình (5 Người)" 
                        desc="Cha mẹ, con cái dùng chung 1 gói. Quản lý tập trung." 
                        highlight
                    />
                ) : (
                    <FeatureRow 
                        icon={<Shield size={20} />} 
                        color="red" 
                        title="Tra Cứu Số & Chặn Spam" 
                        desc={isFree ? `Gói Free chỉ tra cứu ${LIMITS.FREE.CALL_LOOKUPS} số/ngày.` : "Cơ sở dữ liệu Global"} 
                    />
                )}
            </div>

            <button 
                onClick={handleUpgrade}
                disabled={processing}
                className={`w-full py-4 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group focus:ring-4 focus:outline-none ${
                    selectedPlan === 'individual' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 shadow-blue-200 focus:ring-blue-300' 
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-200 focus:ring-purple-300'
                }`}
            >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                {processing ? "Đang xử lý..." : (
                    <>
                        {isFree && selectedPlan === 'individual' ? (
                            <>Bắt đầu 7 ngày miễn phí <ArrowRight size={20} /></>
                        ) : (
                            <>Nâng Cấp {selectedPlan === 'family' ? 'Family' : 'Pro'} <Zap fill="currentColor" /></>
                        )}
                    </>
                )}
            </button>
            
            <p className="text-center text-[10px] text-slate-400 mt-4 leading-tight">
                {isFree && selectedPlan === 'individual' 
                    ? `Sau 7 ngày, phí gia hạn là 49.000đ/tháng. Hủy trước ${trialDateString} để không mất phí.`
                    : "Hủy bất kỳ lúc nào. Hoàn tiền trong 7 ngày nếu không hài lòng."
                }
            </p>
        </div>
      </div>
    </div>
  );
};

// Helper Component for cleaner code
const FeatureRow = ({ icon, color, title, desc, highlight }: { icon: any, color: string, title: string, desc: string, highlight?: boolean }) => {
    const bgMap: Record<string, string> = {
        blue: 'bg-blue-50 border-blue-100 text-blue-600',
        purple: 'bg-purple-50 border-purple-100 text-purple-600',
        red: 'bg-red-50 border-red-100 text-red-600',
        pink: 'bg-pink-50 border-pink-100 text-pink-600',
    };
    
    const bgIconMap: Record<string, string> = {
        blue: 'bg-blue-100',
        purple: 'bg-purple-100',
        red: 'bg-red-100',
        pink: 'bg-pink-100',
    };

    return (
        <div className={`flex items-center gap-4 p-3 rounded-2xl border ${bgMap[color]} ${highlight ? 'ring-2 ring-pink-400 ring-offset-1' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgIconMap[color]}`}>
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    {title}
                    {highlight && <Sparkles size={14} className="text-yellow-500 fill-current animate-pulse" />}
                </h4>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
            <Check className="text-green-500 ml-auto" size={20} />
        </div>
    );
};

export default PremiumUpgradeModal;
