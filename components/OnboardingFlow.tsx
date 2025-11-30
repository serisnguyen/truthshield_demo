
import React, { useState } from 'react';
import { Shield, ChevronRight, Bell, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OnboardingFlow: React.FC = () => {
  const { login, completeOnboarding } = useAuth();
  const [step, setStep] = useState<1|2>(1); // Reduced steps
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FIX: Vietnamese phone regex
  const isValidVietnamesePhone = (phone: string): boolean => {
    const vnPhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    return vnPhoneRegex.test(phone.replace(/\s/g, ''));
  };

  // --- STEP 1: LOGIN ---
  const handleLogin = async () => {
      setError(null);
      if (!isValidVietnamesePhone(phone)) {
          setError("Số điện thoại không hợp lệ (VD: 0912...)");
          return;
      }
      setIsLoading(true);
      await login(phone);
      setIsLoading(false);
      setStep(2);
  };

  // --- STEP 2: PERMISSIONS ---
  const handleFinish = () => {
      completeOnboarding();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
       {/* Progress Bar */}
       <div className="h-1.5 bg-slate-100 w-full">
           <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(step/2)*100}%` }}></div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-md mx-auto w-full">
           
           {/* --- STEP 1: PHONE LOGIN --- */}
           {step === 1 && (
               <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
                   <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 mb-8 mx-auto">
                       <Shield size={40} className="text-white" />
                   </div>
                   <h1 className="text-3xl font-black text-slate-900 text-center mb-2">Chào mừng đến<br/>TruthShield AI</h1>
                   <p className="text-slate-500 text-center mb-10">Bảo vệ bạn và gia đình khỏi lừa đảo công nghệ cao.</p>

                   <div className="space-y-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase ml-1">Số điện thoại của bạn</label>
                           <input 
                               type="tel"
                               value={phone}
                               onChange={(e) => {
                                   setPhone(e.target.value);
                                   setError(null);
                               }}
                               placeholder="0912..."
                               className={`w-full text-2xl font-bold p-4 bg-slate-50 rounded-2xl border-2 focus:outline-none text-center tracking-widest ${
                                   error ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'
                               }`}
                               autoFocus
                           />
                           {error && <p className="text-red-500 text-xs font-bold mt-2 text-center">{error}</p>}
                       </div>
                       <button 
                           onClick={handleLogin}
                           disabled={isLoading}
                           className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                           {isLoading ? <Loader2 className="animate-spin" /> : 'Tiếp Tục'} <ChevronRight />
                       </button>
                   </div>
                   <p className="text-xs text-slate-400 text-center mt-6">
                       Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng.
                   </p>
               </div>
           )}

           {/* --- STEP 2: PERMISSIONS --- */}
           {step === 2 && (
               <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
                   <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">Cấp Quyền Bảo Vệ</h2>
                   <p className="text-slate-500 mb-8 text-center text-sm">
                       Để AI hiển thị cảnh báo khi có cuộc gọi lừa đảo, vui lòng cho phép thông báo:
                   </p>

                   <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                           <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Bell size={24} /></div>
                           <div className="flex-1">
                               <h3 className="font-bold text-slate-900">Thông báo</h3>
                               <p className="text-xs text-slate-500">Để gửi cảnh báo khẩn cấp.</p>
                           </div>
                           <CheckCircle2 className="text-green-500" />
                       </div>
                   </div>

                   <button 
                       onClick={handleFinish}
                       className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                       Hoàn Tất Cài Đặt
                   </button>
               </div>
           )}
       </div>
    </div>
  );
};

export default OnboardingFlow;
