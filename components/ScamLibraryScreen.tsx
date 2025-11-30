
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, ShieldAlert, Zap, Banknote, Heart, RefreshCw, AlertTriangle, Volume2, StopCircle, PlayCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Scam {
  id: number;
  type: string;
  title: string;
  risk: 'Cao' | 'Trung bình' | 'Thấp';
  description: string;
  keywords: string[];
}

interface ScamLibraryScreenProps {
  onOpenTutorial?: () => void;
}

const initialScams: Scam[] = [
  {
    id: 1,
    type: 'Deepfake',
    title: "Giả mạo Con cái gọi Video Khẩn cấp",
    risk: 'Cao',
    description: "Kẻ gian sử dụng AI để giả khuôn mặt và giọng nói của người thân, yêu cầu chuyển tiền gấp để 'cứu mạng'.",
    keywords: ['cấp cứu', 'chuyển gấp', 'khóa tài khoản'],
  },
  {
    id: 2,
    type: 'Giả danh',
    title: "Mạo danh Công an, VKS, Thuế",
    risk: 'Cao',
    description: "Yêu cầu người dùng cài ứng dụng giả mạo hoặc chuyển tiền vào tài khoản 'tạm giữ' để điều tra tội phạm.",
    keywords: ['lệnh bắt', 'tài khoản tạm giữ', 'điều tra', 'công an'],
  },
  {
    id: 3,
    type: 'Đầu tư',
    title: "Kêu gọi Đầu tư tiền ảo, 'Sàn vàng' lợi nhuận cao",
    risk: 'Trung bình',
    description: "Dụ dỗ nạn nhân tham gia các nhóm đầu tư kín với cam kết lợi nhuận gấp nhiều lần, sau đó đánh sập sàn để chiếm đoạt tiền.",
    keywords: ['lợi nhuận x10', 'sàn vàng', 'chuyên gia', 'rút tiền'],
  },
  {
    id: 4,
    type: 'Tình cảm',
    title: "Kẻ lừa tình (Scam Romance) qua mạng xã hội",
    risk: 'Trung bình',
    description: "Xây dựng mối quan hệ tình cảm, sau đó viện cớ gặp khó khăn hoặc cần tiền làm thủ tục hải quan để xin tiền.",
    keywords: ['hải quan', 'gửi quà', 'gặp khó', 'duyên nợ'],
  },
];

const ScamLibraryScreen: React.FC<ScamLibraryScreenProps> = ({ onOpenTutorial }) => {
  const { isSeniorMode } = useAuth();
  const [scams, setScams] = useState<Scam[]>(initialScams);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Reference to current utterance to prevent GC and handle cancellation
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Improved Voice Loading Logic
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Cleanup function to cancel any ongoing speech when component unmounts
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      utteranceRef.current = null;
    };
  }, []);

  const fetchNewScams = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newScam: Scam = {
        id: Date.now(),
        type: 'Mới',
        title: "Kỹ thuật 'Hack' Camera qua link lạ",
        risk: 'Cao',
        description: "Yêu cầu người dùng nhấp vào link 'kiểm tra đường truyền' để chiếm quyền điều khiển Camera/Mic từ xa.",
        keywords: ['đường truyền', 'kiểm tra bảo mật', 'nhấp vào'],
      };
      setScams([newScam, ...initialScams]);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      setIsLoading(false);
    }, 1500);
  };

  const speak = (scam: Scam) => {
    if (!('speechSynthesis' in window)) {
      setErrorMsg("Thiết bị không hỗ trợ đọc văn bản.");
      return;
    }

    const synth = window.speechSynthesis;

    // Toggle logic
    if (speakingId === scam.id) {
      synth.cancel();
      if (utteranceRef.current) utteranceRef.current = null;
      setSpeakingId(null);
      return;
    }

    synth.cancel();
    if (utteranceRef.current) utteranceRef.current = null;
    
    const text = `Cảnh báo lừa đảo dạng ${scam.type}. ${scam.title}. ${scam.description}`;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Robust Voice Selection
    let availableVoices = voices.length > 0 ? voices : synth.getVoices();
    
    const vnVoice = 
        availableVoices.find(v => v.lang === 'vi-VN') ||
        availableVoices.find(v => v.lang.startsWith('vi')) ||
        availableVoices.find(v => v.name.toLowerCase().includes('viet')) ||
        availableVoices.find(v => v.name.includes('Google') && v.lang.startsWith('vi')) ||
        availableVoices.find(v => v.lang.includes('VN'));

    if (vnVoice) {
        utterance.voice = vnVoice;
        utterance.lang = vnVoice.lang;
    } else {
        utterance.lang = 'vi-VN';
    }
    
    utterance.rate = isSeniorMode ? 0.85 : 0.95;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setSpeakingId(scam.id);
    utterance.onend = () => {
        setSpeakingId(null);
        utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
        setSpeakingId(null);
        utteranceRef.current = null;
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
            let msg = "Không thể phát âm thanh.";
            if (event.error === 'network') msg = "Lỗi mạng khi tải giọng đọc.";
            if (event.error === 'synthesis-unavailable') msg = "Giọng đọc chưa sẵn sàng.";
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };
    
    // FIX: Keep a reference to prevent Garbage Collection
    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const getIcon = (type: string) => {
    const size = isSeniorMode ? 40 : 20;
    switch (type) {
      case 'Deepfake': return <ShieldAlert size={size} className="text-red-600" />;
      case 'Giả danh': return <Banknote size={size} className="text-blue-600" />;
      case 'Đầu tư': return <Zap size={size} className="text-yellow-600" />;
      case 'Tình cảm': return <Heart size={size} className="text-pink-600" />;
      default: return <AlertTriangle size={size} className="text-slate-600" />;
    }
  };

  return (
    <div className={`p-4 md:p-6 pt-20 md:pt-10 pb-32 min-h-screen max-w-4xl mx-auto animate-in fade-in duration-300 ${isSeniorMode ? 'bg-slate-50' : 'bg-[#F8FAFC]'}`}>
      
      {/* Toast Notification for Errors */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <XCircle size={20} /> {errorMsg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b-2 border-slate-200 pb-6 gap-4">
        <div>
          <h2 className={`${isSeniorMode ? 'text-3xl md:text-4xl' : 'text-3xl'} font-black text-slate-900 mb-2 flex items-center gap-2`}>
            <BookOpen size={isSeniorMode ? 48 : 32} className="text-blue-600" /> 
            {isSeniorMode ? 'THƯ VIỆN CẢNH BÁO' : 'Thư Viện Cảnh Báo'}
          </h2>
          <p className={`${isSeniorMode ? 'text-lg md:text-xl font-medium' : 'text-base'} text-slate-500`}>
            {isSeniorMode ? 'Danh sách các thủ đoạn kẻ xấu hay dùng. Bác bấm vào để nghe.' : 'Hệ thống AI tổng hợp các thủ đoạn lừa đảo phổ biến và mới nhất.'}
          </p>
        </div>
        
        {isSeniorMode && onOpenTutorial && (
            <button 
                onClick={onOpenTutorial}
                className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
            >
                <PlayCircle size={32} />
                <span className="text-xl">HƯỚNG DẪN</span>
            </button>
        )}
      </div>

      {/* SEARCH/REFRESH BAR */}
      <div className={`flex justify-between items-center mb-6 p-4 bg-white rounded-2xl shadow-sm border ${isSeniorMode ? 'border-slate-300 p-6' : 'border-slate-200'}`}>
        <div className={`text-slate-500 font-bold ${isSeniorMode ? 'text-base' : 'text-sm'}`}>
          Cập nhật lúc: {lastUpdated}
        </div>
        <button
          onClick={fetchNewScams}
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70 shadow-md active:scale-95 ${isSeniorMode ? 'text-lg px-8 py-4' : ''}`}
        >
          {isLoading ? (
            <RefreshCw size={isSeniorMode ? 28 : 18} className="animate-spin" />
          ) : (
            <Zap size={isSeniorMode ? 28 : 18} />
          )}
          {isLoading ? 'Đang tải...' : (isSeniorMode ? 'TÌM MỚI' : 'Tìm Mới')}
        </button>
      </div>

      {/* SCAM LIST */}
      <div className="space-y-6">
        {scams.map((scam) => (
          <div 
            key={scam.id} 
            onClick={() => isSeniorMode && speak(scam)} 
            className={`bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all relative overflow-hidden group cursor-pointer ${
                isSeniorMode ? 'border-4 border-slate-200 p-6 active:bg-blue-50' : 'border border-slate-200 p-5'
            }`}
          >
             <div className={`absolute top-0 right-0 rounded-bl-2xl text-white font-bold uppercase tracking-wide shadow-sm flex items-center gap-1 ${
               scam.risk === 'Cao' ? 'bg-red-600' : scam.risk === 'Trung bình' ? 'bg-amber-500' : 'bg-blue-600'
             } ${isSeniorMode ? 'text-lg px-6 py-2' : 'text-xs px-3 py-1'}`}>
                <AlertTriangle size={isSeniorMode ? 20 : 12} fill="currentColor" />
                {scam.risk}
             </div>

            <div className="flex flex-col md:flex-row md:items-start gap-4 mb-3 pt-8 md:pt-0">
              <div className={`flex-shrink-0 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-slate-200 ${isSeniorMode ? 'w-20 h-20' : 'w-12 h-12'}`}>
                {getIcon(scam.type)}
              </div>

              <div className="flex-1 pr-4">
                <span className={`font-bold text-slate-500 uppercase tracking-wide block mb-1 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>
                    {scam.type}
                </span>
                <h3 className={`font-black text-slate-900 leading-tight ${isSeniorMode ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                    {scam.title}
                </h3>
              </div>
              
              {isSeniorMode && (
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        speak(scam);
                    }}
                    className={`flex-shrink-0 w-full md:w-auto px-6 py-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all shadow-md active:scale-95 mt-4 md:mt-0 ${
                        speakingId === scam.id 
                        ? 'bg-red-100 border-red-500 text-red-700 animate-pulse' 
                        : 'bg-white border-blue-600 text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                      {speakingId === scam.id ? <StopCircle size={32} /> : <Volume2 size={32} />}
                      <span className="font-bold text-xl uppercase">
                          {speakingId === scam.id ? 'Dừng Lại' : 'Đọc Nghe'}
                      </span>
                  </button>
              )}
            </div>
            
            <p className={`text-slate-700 leading-relaxed mb-4 mt-2 ${isSeniorMode ? 'text-xl font-medium' : 'text-base'}`}>
              {scam.description}
            </p>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-slate-100">
              <span className={`font-bold text-red-600 mr-2 uppercase tracking-wide py-1 flex items-center gap-1 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>
                  <Zap size={16} /> Dấu hiệu:
              </span>
              {scam.keywords.map((kw, idx) => (
                <span key={idx} className={`bg-red-50 text-red-700 font-bold rounded-lg border border-red-100 ${isSeniorMode ? 'text-base px-3 py-1.5' : 'text-xs px-2 py-1'}`}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScamLibraryScreen;
