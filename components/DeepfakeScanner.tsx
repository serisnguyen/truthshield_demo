
import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanFace, Upload, FileImage, X, 
  Loader2, Play, Pause, Eye, Activity, HeartPulse, Sparkles, Database,
  Cpu, Layers, Radio, Clapperboard, Video, Terminal, Lock, Crown
} from 'lucide-react';
import { useAuth, LIMITS } from '../context/AuthContext';
import { analyzeMediaDeepfake } from '../services/aiService';
import PremiumUpgradeModal from './PremiumUpgradeModal';

const DeepfakeScanner: React.FC = () => {
  const { isSeniorMode, checkLimit, incrementUsage, user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Analysis States
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'result'>('idle');
  const [analysisStep, setAnalysisStep] = useState(0); 
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  // Audio/Video Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  // Helper icon for video steps
  const ClockIcon = ({size, className}: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );

  const imageSteps = [
      { text: "Khởi tạo bộ dữ liệu FaceForensics++...", icon: Database },
      { text: "Intel FakeCatcher: Quét mạch máu (PPG)...", icon: HeartPulse },
      { text: "Hive AI: Tìm kiếm lỗi biến dạng (Artifacts)...", icon: Eye },
      { text: "Tổng hợp kết quả & Đánh giá rủi ro...", icon: Layers }
  ];

  const audioSteps = [
      { text: "AI Voice Detector: Phân tích phổ tần số...", icon: Activity },
      { text: "Kiểm tra dấu hiệu ngắt quãng tự nhiên...", icon: Radio },
      { text: "So khớp cơ sở dữ liệu giọng nói Deepfake...", icon: Database },
      { text: "Đánh giá độ tin cậy âm thanh...", icon: Layers }
  ];

  const videoSteps = [
      { text: "Phân tách khung hình (Frame Extraction)...", icon: Clapperboard },
      { text: "Deepware: Quét chuyển động môi (Lip-sync)...", icon: Activity },
      { text: "Seferbekov: Phân tích nhất quán thời gian...", icon: ClockIcon },
      { text: "Đánh giá tổng hợp Video Deepfake...", icon: Layers }
  ];

  // Cleanup effect to revoke URL and prevent memory leaks
  useEffect(() => {
      return () => {
          if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
          }
      };
  }, [previewUrl]);

  const getCurrentSteps = () => {
      if (file?.type.startsWith('audio/')) return audioSteps;
      if (file?.type.startsWith('video/')) return videoSteps;
      return imageSteps;
  };

  const addLog = (text: string) => {
      setLogs(prev => [...prev, `> ${text}`]);
  };

  const handleFileSelect = (selectedFile: File) => {
    const isImage = selectedFile.type.startsWith('image/');
    const isAudio = selectedFile.type.startsWith('audio/');
    const isVideo = selectedFile.type.startsWith('video/');
    
    if (!isImage && !isAudio && !isVideo) return alert("Chỉ hỗ trợ file Hình ảnh, Video hoặc Âm thanh.");
    
    // Revoke previous URL if exists
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setStatus('idle');
    setResult(null);
    setAnalysisStep(0);
    setLogs([]);
    setIsPlaying(false);
  };

  const startAnalysis = async () => {
    if (!file) return;

    // CHECK LIMITS
    if (!checkLimit('deepfake')) {
        setShowPremiumModal(true);
        return;
    }

    setStatus('analyzing');
    setAnalysisStep(0);
    setLogs([`INITIALIZING SCAN PROTOCOL v4.5...`]);
    const steps = getCurrentSteps();
    
    let stepCount = 0;
    const stepInterval = setInterval(() => {
        if (stepCount < steps.length) {
            addLog(steps[stepCount].text);
            setAnalysisStep(prev => Math.min(prev + 1, steps.length - 1));
            stepCount++;
        }
    }, 1500);

    try {
        let type: 'image' | 'audio' | 'video' = 'image';
        if (file.type.startsWith('audio/')) type = 'audio';
        if (file.type.startsWith('video/')) type = 'video';

        const data = await analyzeMediaDeepfake(file, type);
        clearInterval(stepInterval);
        
        incrementUsage('deepfake'); // Increment usage count

        setTimeout(() => {
            setResult({
                isDeepfake: data.isDeepfake,
                score: data.confidenceScore,
                indicators: data.indicators,
                explanation: data.explanation,
                details: data.details
            });
            setStatus('result');
        }, 1000); 
        
    } catch (error) {
        clearInterval(stepInterval);
        setStatus('idle');
        alert("Lỗi phân tích.");
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setResult(null);
    setLogs([]);
  };

  const togglePlayback = () => {
      if (!mediaRef.current) return;
      if (isPlaying) {
          mediaRef.current.pause();
      } else {
          mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
  };

  // Remaining scans for UI
  const remaining = user?.plan !== 'free' ? 999 : Math.max(0, LIMITS.FREE.DEEPFAKE_SCANS - (user?.usage?.deepfakeScans || 0));
  const isLimitReached = user?.plan === 'free' && remaining === 0;

  return (
    <div className={`p-4 md:p-6 pt-24 md:pt-10 pb-32 min-h-screen max-w-6xl mx-auto animate-in fade-in duration-300 ${isSeniorMode ? 'text-lg' : ''}`}>
      
      {/* Sci-Fi Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6">
          <div>
              <div className="flex items-center gap-2 mb-2">
                   <span className="bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                       <Terminal size={10} /> Forensic Module v4.2
                   </span>
                   {user?.plan === 'free' && (
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${isLimitReached ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                           {isLimitReached ? <><Lock size={10} /> Hết lượt miễn phí hôm nay</> : `Free: ${remaining} lượt còn lại`}
                       </span>
                   )}
              </div>
              <h2 className={`${isSeniorMode ? 'text-4xl' : 'text-4xl'} font-black text-slate-900 mb-2 flex items-center gap-3 tracking-tight`}>
                  Deepfake Scanner
              </h2>
              <p className="text-slate-500 font-medium max-w-2xl text-sm">
                  Công cụ phân tích pháp y kỹ thuật số (Digital Forensics) phát hiện nội dung giả mạo bởi AI.
              </p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
               <TechBadge icon={<Eye size={14} />} label="Hive AI" />
               <TechBadge icon={<HeartPulse size={14} />} label="Intel PPG" />
               <TechBadge icon={<Database size={14} />} label="Forensics++" />
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
          
          {/* LEFT: SCANNER VIEWPORT */}
          <div className="flex-1 lg:max-w-[60%]">
              {!file ? (
                  <div 
                      className={`border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white group hover:border-blue-500 hover:bg-blue-50/30 relative overflow-hidden ${
                          isDragging ? 'border-blue-600 bg-blue-50' : 'border-slate-300'
                      } h-[500px]`}
                  >
                      {/* Grid Background */}
                      <div className="absolute inset-0 bg-grid-slate opacity-30 pointer-events-none"></div>

                      <div className={`rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10 shadow-xl shadow-blue-100 ${isSeniorMode ? 'w-32 h-32 bg-blue-600' : 'w-24 h-24 bg-blue-600'}`}>
                          <ScanFace size={isSeniorMode ? 56 : 40} className="text-white" />
                      </div>
                      <h3 className={`font-black text-slate-900 mb-2 relative z-10 ${isSeniorMode ? 'text-3xl' : 'text-2xl'}`}>Kéo thả file Media</h3>
                      <p className={`text-slate-400 font-bold mb-8 relative z-10 uppercase tracking-widest text-xs`}>
                          Hỗ trợ Ảnh, Video, Ghi âm (JPG, MP4, MP3...)
                      </p>
                      
                      {isLimitReached ? (
                          <button 
                              onClick={() => setShowPremiumModal(true)}
                              className={`bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-lg active:scale-95 relative z-10 flex items-center gap-3 ${isSeniorMode ? 'px-10 py-5 text-xl' : 'px-8 py-4'}`}
                          >
                              <Crown size={20} className="text-yellow-400" fill="currentColor" /> Nâng cấp để quét tiếp
                          </button>
                      ) : (
                          <label className={`bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-lg active:scale-95 relative z-10 flex items-center gap-3 ${isSeniorMode ? 'px-10 py-5 text-xl' : 'px-8 py-4'}`}>
                              <Upload size={20} /> Tải lên phân tích
                              <input type="file" className="hidden" accept="image/*,audio/*,video/*" onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])} />
                          </label>
                      )}
                  </div>
              ) : (
                  <div className={`relative bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center group h-[500px]`}>
                      
                      {/* Cyberpunk Grid */}
                      <div className="absolute inset-0 hud-grid opacity-20 pointer-events-none"></div>
                      
                      {/* Scanning Laser */}
                      {status === 'analyzing' && (
                          <div className="absolute inset-0 z-30 pointer-events-none border-b-[3px] border-green-400/80 animate-scan-line shadow-[0_0_20px_rgba(74,222,128,0.5)] h-[15%]"></div>
                      )}
                      
                      {/* Corner Accents */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-green-500/50 rounded-tl-lg z-20"></div>
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-green-500/50 rounded-tr-lg z-20"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-green-500/50 rounded-bl-lg z-20"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-green-500/50 rounded-br-lg z-20"></div>

                      <button onClick={reset} disabled={status === 'analyzing'} className="absolute top-4 right-4 z-40 p-2 bg-black/40 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-md border border-white/10">
                          <X size={24} />
                      </button>

                      {/* MEDIA PREVIEW LOGIC */}
                      {file.type.startsWith('image/') ? (
                           <div className="relative w-full h-full flex items-center justify-center bg-black/50 p-4">
                               <img src={previewUrl!} alt="Preview" className="max-w-full max-h-full object-contain relative z-10 rounded-lg shadow-2xl" />
                               {status === 'analyzing' && (
                                   <div className="absolute inset-0 z-20 flex items-center justify-center">
                                       {/* Dynamic Scanning Reticle */}
                                       <div className="w-64 h-64 border border-green-500/30 rounded-full animate-ping opacity-20 absolute"></div>
                                       <div className="w-48 h-48 border-2 border-green-400 rounded-lg relative">
                                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-400"></div>
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400"></div>
                                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400"></div>
                                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400"></div>
                                            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 bg-black/80 text-green-400 text-[10px] font-mono px-2 py-0.5 rounded border border-green-500/30 whitespace-nowrap">
                                                FACE_DETECTED: 98%
                                            </div>
                                       </div>
                                   </div>
                               )}
                           </div>
                      ) : file.type.startsWith('video/') ? (
                           <div className="relative w-full h-full bg-black flex items-center justify-center">
                               <video 
                                   ref={mediaRef as React.RefObject<HTMLVideoElement>}
                                   src={previewUrl!} 
                                   className="max-w-full max-h-full relative z-10"
                                   controls={status !== 'analyzing'}
                                   onPlay={() => setIsPlaying(true)}
                                   onPause={() => setIsPlaying(false)}
                               />
                               {status === 'analyzing' && (
                                   <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                                       <div className="flex flex-col items-center">
                                           <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                           <span className="text-green-400 font-mono text-sm animate-pulse tracking-widest">ANALYZING FRAMES...</span>
                                       </div>
                                   </div>
                               )}
                           </div>
                      ) : (
                           <div className="flex flex-col items-center justify-center text-white z-10 w-full relative">
                               <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                   <div className="w-[120%] h-32 bg-green-500/20 blur-3xl rounded-full"></div>
                               </div>
                               <div className={`rounded-full border-2 flex items-center justify-center mb-8 relative bg-slate-900 ${status === 'analyzing' ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'border-slate-700'} ${isSeniorMode ? 'w-48 h-48' : 'w-40 h-40'}`}>
                                   <Activity size={isSeniorMode ? 80 : 48} className={status === 'analyzing' ? 'text-green-400 animate-pulse' : 'text-slate-500'} />
                               </div>
                               <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={previewUrl!} onEnded={() => setIsPlaying(false)} />
                               <button 
                                  onClick={togglePlayback}
                                  className="bg-white/5 hover:bg-white/10 rounded-full font-bold flex items-center gap-3 backdrop-blur-md transition-all border border-white/10 px-6 py-3"
                               >
                                   {isPlaying ? <Pause size={20} /> : <Play size={20} />} 
                                   {isPlaying ? 'Dừng phát' : 'Nghe kiểm tra'}
                               </button>
                           </div>
                      )}
                  </div>
              )}
          </div>

          {/* RIGHT: RESULTS DASHBOARD */}
          <div className="flex-1">
              
              {/* STATUS: IDLE */}
              {status === 'idle' && file && (
                  <div className="glass-panel p-8 rounded-[32px] h-full flex flex-col justify-center items-center text-center">
                      <div className="mb-6">
                           {file.type.startsWith('video/') ? (
                               <Video size={48} className="text-slate-400 mx-auto mb-2" />
                           ) : file.type.startsWith('audio/') ? (
                               <Radio size={48} className="text-slate-400 mx-auto mb-2" />
                           ) : (
                               <FileImage size={48} className="text-slate-400 mx-auto mb-2" />
                           )}
                           <h3 className="font-black text-xl text-slate-800 line-clamp-1">{file.name}</h3>
                           <p className="text-slate-500 text-sm font-mono mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      
                      <button 
                          onClick={startAnalysis}
                          className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-300/50 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group ${isSeniorMode ? 'py-6 text-2xl' : 'py-4 text-lg'}`}
                      >
                          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <Cpu size={24} /> KÍCH HOẠT QUÉT AI
                      </button>
                  </div>
              )}

              {/* STATUS: ANALYZING */}
              {status === 'analyzing' && (
                  <div className="bg-slate-900 rounded-[32px] p-6 h-full flex flex-col text-white relative overflow-hidden border border-slate-700 font-mono-code">
                      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                          <h3 className="text-green-400 font-bold text-sm tracking-widest flex items-center gap-2">
                             <Terminal size={14} /> SYSTEM_LOG
                          </h3>
                          <Loader2 size={16} className="text-green-500 animate-spin" />
                      </div>
                      
                      {/* Terminal Output */}
                      <div className="flex-1 overflow-y-auto space-y-2 text-xs md:text-sm custom-scrollbar opacity-90">
                          {logs.map((log, i) => (
                              <div key={i} className="text-green-300/80 animate-in slide-in-from-left-2 duration-300">
                                  {log}
                              </div>
                          ))}
                          <div className="text-green-500 animate-pulse">_</div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-6">
                           <div className="flex justify-between text-xs text-slate-500 mb-1">
                               <span>PROGRESS</span>
                               <span>{Math.min(100, Math.round(((analysisStep + 1) / 4) * 100))}%</span>
                           </div>
                           <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                               <div 
                                   className="h-full bg-green-500 transition-all duration-500"
                                   style={{ width: `${((analysisStep + 1) / 4) * 100}%` }}
                               ></div>
                           </div>
                      </div>
                  </div>
              )}

              {/* STATUS: RESULT */}
              {status === 'result' && result && (
                  <div className={`glass-panel rounded-[32px] h-full flex flex-col border-l-8 overflow-hidden ${
                      result.isDeepfake ? 'border-l-red-500' : 'border-l-green-500'
                  }`}>
                      <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                          <div className="flex justify-between items-start mb-8">
                              <div>
                                  <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">KẾT QUẢ PHÂN TÍCH</div>
                                  <h3 className={`font-black text-5xl uppercase tracking-tighter ${result.isDeepfake ? 'text-red-600' : 'text-green-600'}`}>
                                      {result.isDeepfake ? 'FAKE' : 'REAL'}
                                  </h3>
                              </div>
                              <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white font-black shadow-lg ${
                                  result.isDeepfake ? 'bg-red-600' : 'bg-green-600'
                              }`}>
                                  <span className="text-3xl">{result.score}</span>
                                  <span className="text-[10px] opacity-80">%</span>
                              </div>
                          </div>

                          <div className="bg-white/50 rounded-2xl p-6 border border-white/60 mb-6">
                               <h4 className="font-bold text-slate-800 uppercase text-xs mb-3 flex items-center gap-2">
                                   <Sparkles size={14} className="text-purple-600" /> Giải thích AI
                               </h4>
                               <p className="text-slate-700 font-medium leading-relaxed">{result.explanation}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-6">
                              <ResultCard label="Độ Sống (Bio)" value={result.details.biologicalScore} />
                              <ResultCard label="Dấu Hiệu Giả" value={file.type.startsWith('image/') ? result.details.visualArtifactsScore : result.details.audioSpectralScore} invert />
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
      {showPremiumModal && <PremiumUpgradeModal onClose={() => setShowPremiumModal(false)} triggerSource="deepfake_limit" />}
    </div>
  );
};

const TechBadge = ({icon, label}: any) => (
    <div className={`bg-white border border-slate-200 rounded-lg font-bold text-slate-600 flex items-center gap-2 px-3 py-1 text-xs shadow-sm`}>
        {icon} {label}
    </div>
);

const ResultCard = ({label, value, invert}: any) => (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="text-xs text-slate-400 font-bold uppercase mb-1">{label}</div>
        <div className={`text-2xl font-black ${
            (invert ? value > 50 : value < 50) ? 'text-red-500' : 'text-green-500'
        }`}>{value}%</div>
        <div className="h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
             <div className={`h-full ${ (invert ? value > 50 : value < 50) ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${value}%`}}></div>
        </div>
    </div>
);

export default DeepfakeScanner;
