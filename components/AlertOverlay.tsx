import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, ShieldAlert, HelpCircle, AlertTriangle, Lock, BrainCircuit, LocateFixed, Send, MessageSquareWarning } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AlertOverlayProps {
  onClose: () => void;
}

const AlertOverlay: React.FC<AlertOverlayProps> = ({ onClose }) => {
  const { addAlertToHistory, user, isSeniorMode } = useAuth();
  const [riskScore, setRiskScore] = useState(0);
  const [challengeQuestion, setChallengeQuestion] = useState("");
  const [autoSMSStatus, setAutoSMSStatus] = useState<'sending' | 'sent' | 'idle'>('idle');
  
  // Ref to track if SMS has been triggered in this session to prevent duplicate sends
  const smsTriggeredRef = useRef(false);

  // Default challenges if user hasn't set one
  const defaultChallenges = [
    "Hôm qua nhà mình ăn món gì?",
    "Tên con vật nuôi đầu tiên là gì?",
    "Sinh nhật của Bà là ngày mấy?",
    "Chuyến đi du lịch gần nhất ở đâu?",
    "Món ăn mẹ nấu thích nhất là gì?"
  ];

  useEffect(() => {
    // 1. Pick a random question from User's list or Defaults
    const questions = (user?.securityQuestions && user.securityQuestions.length > 0) 
        ? user.securityQuestions 
        : defaultChallenges;
    
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    setChallengeQuestion(randomQ);

    // 2. Risk Score Animation
    const targetScore = Math.floor(Math.random() * (99 - 88 + 1) + 88);
    let current = 0;
    
    const interval = setInterval(() => {
      current += 2;
      
      // Check if we reached target
      if (current >= targetScore) {
        current = targetScore;
        clearInterval(interval);
        
        // 3. Trigger Auto-SMS when risk is high (Simulated)
        // Only trigger if not already triggered
        if (targetScore > 80 && !smsTriggeredRef.current) {
            smsTriggeredRef.current = true;
            setAutoSMSStatus('sending');
            
            setTimeout(() => {
                setAutoSMSStatus('sent');
                console.log("Auto SMS sent to emergency contacts");
            }, 2000);
        }
      }
      setRiskScore(current);
    }, 20);

    return () => clearInterval(interval);
  }, [user]); // Depend on user to refresh questions if user changes

  const handleAction = (action: 'dismiss' | 'block') => {
    addAlertToHistory({
      type: 'deepfake',
      riskScore: riskScore,
      details: action === 'block' ? 'Đã chặn cuộc gọi Deepfake' : 'Đã bỏ qua cảnh báo Deepfake'
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-red-600/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-title"
    >
      
      {/* Removed infinite shake animation for better accessibility/UX */}
      <div className={`relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 border-8 border-red-600 ${isSeniorMode ? 'max-w-xl' : ''}`}>
        
        {/* Header - High Contrast */}
        <div className="bg-red-600 p-8 text-center border-b-4 border-red-800 relative overflow-hidden">
           {/* Scanline effect */}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-[scan_1.5s_linear_infinite] h-[20%] w-full"></div>
           
           <div className="flex items-center justify-center gap-3 mb-3 relative z-10">
             <AlertTriangle className="text-white w-16 h-16 animate-bounce" fill="currentColor" />
           </div>
           <h1 id="alert-title" className={`${isSeniorMode ? 'text-5xl' : 'text-4xl'} font-black text-white uppercase tracking-wider relative z-10 drop-shadow-md`}>CẢNH BÁO!</h1>
           <p className="text-white font-bold text-xl mt-2 relative z-10">Phát hiện dấu hiệu Lừa Đảo</p>
        </div>

        <div className="p-6 flex flex-col items-center text-center space-y-6 bg-red-50">
           
           {/* Risk Score & Auto SMS Status */}
           <div className="w-full flex justify-between items-center px-2 bg-white rounded-xl p-4 border border-red-200 shadow-sm">
               <div className="text-left">
                    <div className="flex items-center gap-2 text-red-800 font-bold uppercase text-sm tracking-wider">
                        <BrainCircuit size={20} /> Độ rủi ro
                    </div>
                    <div className={`${isSeniorMode ? 'text-7xl' : 'text-6xl'} font-black text-red-600 tracking-tighter leading-none mt-1`}>
                    {riskScore}%
                    </div>
               </div>
               
               {/* Simulated SMS Status */}
               <div className={`flex flex-col items-end text-sm font-bold transition-opacity duration-500 ${autoSMSStatus !== 'idle' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                        <MessageSquareWarning size={18} /> Tin nhắn cảnh báo
                    </div>
                    {autoSMSStatus === 'sending' ? (
                        <span className="text-amber-600 animate-pulse">Đang gửi cho con...</span>
                    ) : (
                        <span className="text-green-700 flex items-center gap-1 text-base">
                            Đã gửi thành công <span className="text-sm bg-green-100 p-1 rounded-full">✓</span>
                        </span>
                    )}
               </div>
           </div>

           {/* Challenge Box - BIG AND CLEAR */}
           <div className="w-full bg-yellow-50 border-4 border-blue-600 rounded-3xl p-6 text-left relative shadow-lg transform scale-105 mt-4">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-base font-bold px-6 py-2 rounded-full uppercase tracking-wide shadow-md whitespace-nowrap">
                  HÃY HỎI CÂU NÀY
              </div>
              <div className="mt-4 text-center">
                 <p className={`text-slate-900 font-black leading-tight ${isSeniorMode ? 'text-3xl' : 'text-2xl'}`}>
                   "{challengeQuestion}"
                 </p>
                 <div className="w-full h-0.5 bg-red-200 my-4"></div>
                 <p className="text-red-600 text-lg font-bold flex items-center justify-center gap-2">
                    <ShieldAlert size={24} /> Nếu trả lời sai ➔ TẮT MÁY!
                 </p>
              </div>
           </div>

           {/* Action Buttons - HUGE TARGETS */}
           <div className="w-full space-y-4 pt-4">
              <button 
                onClick={() => handleAction('block')}
                className="w-full h-28 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center gap-4 shadow-xl shadow-red-200 transition-transform active:scale-95 group border-b-8 border-red-800 active:border-b-0 active:translate-y-2 touch-target"
              >
                 <PhoneOff size={48} className="fill-current group-hover:animate-shake" />
                 <span className="text-4xl font-black uppercase">TẮT MÁY NGAY</span>
              </button>

              <button 
                onClick={() => handleAction('dismiss')}
                className={`w-full bg-white border-4 border-slate-300 hover:bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center gap-2 transition-colors font-bold touch-target ${isSeniorMode ? 'h-20 text-2xl' : 'h-16 text-lg'}`}
              >
                 <Lock size={isSeniorMode ? 32 : 24} />
                 Tôi biết người này (Bỏ qua)
              </button>
           </div>
           
           {/* Disclaimer */}
           <p className="text-xs text-slate-500 uppercase font-bold">
             * Đây là tình huống mô phỏng giả định *
           </p>

        </div>
      </div>
    </div>
  );
};

export default AlertOverlay;