
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, CheckCircle, Activity, Fingerprint, Users, User, RefreshCw, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveVoiceProfile } from '../services/storageService';

interface VoiceSetupModalProps {
  onClose: () => void;
  initialTab?: 'self' | 'family';
}

const VoiceSetupModal: React.FC<VoiceSetupModalProps> = ({ onClose, initialTab = 'self' }) => {
  const { setVoiceProfileStatus, addFamilyVoiceProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'self' | 'family'>(initialTab);
  
  // State for recording flow
  const [step, setStep] = useState<'intro' | 'details' | 'recording' | 'processing' | 'finished'>('intro');
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Audio Playback
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Form state for Family
  const [famName, setFamName] = useState('');
  const [famRel, setFamRel] = useState('');

  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const RECORDING_DURATION = 15; // Reduced to 15s for better UX

  // Focus Trap and Escape Key Handler
  useEffect(() => {
    // Focus close button on mount
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

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

  // Prompts for Self
  const promptsSelf = [
    "Tôi xác nhận đây là giọng nói thật của tôi.",
    "TruthShield AI giúp bảo vệ danh tính của tôi.",
    "Mã xác thực cá nhân của tôi là an toàn.",
    "Tôi không bao giờ chuyển tiền cho người lạ.",
    "Đây là mẫu giọng nói dùng để đối chiếu bảo mật."
  ];

  // Prompts for Family
  const promptsFamily = [
    `Chào Ba/Mẹ, con là ${famName || '...'}, đây là giọng thật của con.`,
    "Nếu có số lạ gọi tự xưng là con, hãy tắt máy ngay.",
    "Chỉ tin tưởng cuộc gọi khi xác thực được giọng nói này.",
    "Gia đình mình luôn cảnh giác với lừa đảo.",
    "Mã bảo mật của gia đình mình là tuyệt mật."
  ];

  const currentPrompts = activeTab === 'self' ? promptsSelf : promptsFamily;

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setStep('processing');
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (step === 'recording') {
        interval = setInterval(() => {
            setRecordingTime(prev => {
                if (prev >= RECORDING_DURATION) { 
                    clearInterval(interval);
                    stopRecording(); // Trigger stop
                    return RECORDING_DURATION;
                }
                // Change prompt every 5 seconds
                if (prev % 5 === 0 && prev > 0) {
                    setCurrentPromptIndex(i => (i + 1) % currentPrompts.length);
                }
                return prev + 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, currentPrompts, stopRecording]);

  // Cleanup audio url on unmount
  useEffect(() => {
      return () => {
          if (audioUrl) {
              URL.revokeObjectURL(audioUrl);
          }
      };
  }, [audioUrl]);

  const startRecording = async () => {
    if (activeTab === 'family') {
        if (!famName || !famRel) {
            alert("Vui lòng nhập tên và mối quan hệ trước.");
            return;
        }
    }
    setErrorMessage(null);
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
            } 
        });
        
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            
            // Create URL for playback
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            
            // Save to IndexedDB
            const audioId = activeTab === 'self' 
                ? 'voice_profile_self' 
                : `voice_${Date.now()}`;
            
            try {
                await saveVoiceProfile(audioId, audioBlob);
                
                // Simulate processing delay then finish
                setTimeout(() => {
                    if (activeTab === 'self') {
                        setVoiceProfileStatus(true);
                    } else {
                        addFamilyVoiceProfile({
                            name: famName,
                            relationship: famRel,
                            audioId: audioId
                        });
                    }
                    setStep('finished');
                }, 2000);
            } catch (err) {
                console.error("Storage error", err);
                setErrorMessage("Lỗi khi lưu dữ liệu. Vui lòng thử lại.");
                setStep('intro');
            }
            
            // Cleanup tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };

        mediaRecorder.start();
        setStep('recording');
        setRecordingTime(0);

    } catch (err) {
        console.error("Microphone access error:", err);
        // CRITICAL FIX: Ensure stream is cleaned up if error occurs after stream creation
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setErrorMessage("Vui lòng cấp quyền Microphone để ghi âm.");
    }
  };

  const handleTabChange = (tab: 'self' | 'family') => {
      setActiveTab(tab);
      setStep('intro');
      setRecordingTime(0);
      setCurrentPromptIndex(0);
      setErrorMessage(null);
  };

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          if (streamRef.current) {
              streamRef.current.getTracks().forEach(t => t.stop());
          }
      };
  }, []);

  return (
    <div 
        className="fixed inset-0 z-[90] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in duration-300"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-setup-title"
    >
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center relative overflow-hidden flex flex-col max-h-[90vh] focus:outline-none"
        onClick={(e) => e.stopPropagation()} // FIX: Stop click propagation
        tabIndex={-1}
      >
        <button 
            ref={closeButtonRef}
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 z-10 focus:ring-2 focus:ring-blue-500 rounded-full"
            aria-label="Đóng"
        >
           <X size={24} />
        </button>

        {/* ERROR MESSAGE */}
        {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm font-bold mb-4 flex items-center gap-2" role="alert">
                <RefreshCw size={16} /> {errorMessage}
            </div>
        )}

        {/* TABS */}
        {step === 'intro' && (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 mt-6">
                <button 
                    onClick={() => handleTabChange('self')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'self' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                >
                    <User size={16} /> Giọng Của Tôi
                </button>
                <button 
                    onClick={() => handleTabChange('family')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'family' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500'}`}
                >
                    <Users size={16} /> Giọng Người Thân
                </button>
            </div>
        )}

        {/* STEP 1: INTRO / FORM */}
        {step === 'intro' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
                {activeTab === 'self' ? (
                    <>
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <Fingerprint className="text-blue-600" size={32} />
                            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <h2 id="voice-setup-title" className="text-2xl font-bold text-slate-900 mb-2">Bảo Vệ Danh Tính</h2>
                        <p className="text-slate-500 text-sm mb-6 px-4">
                            Tạo "chữ ký sinh trắc học" cho chính bạn bằng Micro. Ngăn kẻ xấu giả mạo giọng nói của bạn.
                        </p>
                        <button 
                            onClick={startRecording}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Mic size={20} /> Ghi Âm Micro (15s)
                        </button>
                    </>
                ) : (
                    <>
                         <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <Users className="text-purple-600" size={32} />
                            <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <h2 id="voice-setup-title" className="text-2xl font-bold text-slate-900 mb-2">Thêm Giọng Người Thân</h2>
                        <p className="text-slate-500 text-sm mb-6 px-4">
                            Nhờ con/cháu ghi âm trực tiếp. Hệ thống sẽ dùng mẫu này để so khớp khi có cuộc gọi đến.
                        </p>
                        
                        <div className="space-y-3 mb-6 text-left">
                            <div>
                                <label className="text-xs font-bold text-slate-500 ml-1">Tên người thân</label>
                                <input 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="VD: Hùng"
                                    value={famName}
                                    onChange={e => setFamName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 ml-1">Mối quan hệ</label>
                                <input 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="VD: Con trai cả"
                                    value={famRel}
                                    onChange={e => setFamRel(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={startRecording}
                            disabled={!famName || !famRel}
                            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Mic size={20} /> Ghi Âm Micro (15s)
                        </button>
                    </>
                )}
            </div>
        )}

        {/* STEP 2: RECORDING */}
        {step === 'recording' && (
            <div className="animate-in fade-in duration-300 pt-8" role="status" aria-label="Đang ghi âm">
                <div className="mb-8">
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse mb-4">
                        ● ĐANG GHI ÂM THỰC TẾ
                    </span>
                    <p className="text-slate-500 text-sm mb-2">Hãy đọc to rõ dòng chữ bên dưới:</p>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 transition-all min-h-[80px] p-4 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
                        "{currentPrompts[currentPromptIndex]}"
                    </h3>
                    
                    {/* Visual Sound Wave */}
                    <div className="flex items-center justify-center gap-1 h-16 mb-4" aria-hidden="true">
                        {[...Array(12)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-1.5 rounded-full animate-[bounce_0.5s_infinite] ${activeTab === 'self' ? 'bg-blue-500' : 'bg-purple-500'}`}
                                style={{ 
                                    height: `${20 + Math.random() * 80}%`,
                                    animationDelay: `${i * 0.05}s` 
                                }}
                            ></div>
                        ))}
                    </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-linear ${activeTab === 'self' ? 'bg-blue-600' : 'bg-purple-600'}`} 
                        style={{ width: `${(recordingTime / RECORDING_DURATION) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>{recordingTime}s</span>
                    <span>{RECORDING_DURATION}s</span>
                </div>

                <button 
                    onClick={stopRecording}
                    className="mt-6 bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-full font-bold text-sm"
                >
                    Dừng Sớm
                </button>
            </div>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 'processing' && (
            <div className="animate-in zoom-in duration-500 py-10" role="status">
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className={`absolute inset-0 border-4 rounded-full border-t-transparent animate-spin ${activeTab === 'self' ? 'border-blue-600' : 'border-purple-600'}`}></div>
                    <Activity className={`absolute inset-0 m-auto ${activeTab === 'self' ? 'text-blue-600' : 'text-purple-600'}`} size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Đang Lưu Voice DNA...</h3>
                <p className="text-slate-500 text-sm">Dữ liệu đang được ghi vào bộ nhớ bảo mật (IndexedDB).</p>
            </div>
        )}

        {/* STEP 4: FINISHED */}
        {step === 'finished' && (
            <div className="animate-in zoom-in duration-500 py-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-600" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Thành Công!</h3>
                <p className="text-slate-500 text-sm mb-6 px-4">
                    {activeTab === 'self' 
                        ? "Hồ sơ giọng nói của bạn đã được thiết lập." 
                        : `Đã lưu hồ sơ giọng nói của ${famName} (${famRel}).`}
                </p>

                {audioUrl && (
                    <div className="w-full bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                            <Play size={12} /> Nghe lại bản ghi
                        </div>
                        <audio controls src={audioUrl} className="w-full mt-4 h-10" />
                    </div>
                )}

                <button 
                    onClick={onClose}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                >
                    Đóng & Quay Lại
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSetupModal;
