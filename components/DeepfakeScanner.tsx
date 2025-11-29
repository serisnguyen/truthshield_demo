
import React, { useState, useRef } from 'react';
import { 
  ScanFace, Upload, FileImage, X, 
  Loader2, Play, Pause, Eye, Activity, HeartPulse, Sparkles, Database,
  Cpu, Layers, Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeMediaDeepfake } from '../services/aiService';

const DeepfakeScanner: React.FC = () => {
  const { isSeniorMode } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Analysis States
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'result'>('idle');
  const [analysisStep, setAnalysisStep] = useState(0); 
  const [result, setResult] = useState<any>(null);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const currentSteps = file?.type.startsWith('audio/') ? audioSteps : imageSteps;

  const handleFileSelect = (selectedFile: File) => {
    const isImage = selectedFile.type.startsWith('image/');
    const isAudio = selectedFile.type.startsWith('audio/');
    if (!isImage && !isAudio) return alert("Chỉ hỗ trợ file Hình ảnh hoặc Âm thanh.");
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setStatus('idle');
    setResult(null);
    setAnalysisStep(0);
    setIsPlaying(false);
  };

  const startAnalysis = async () => {
    if (!file) return;
    setStatus('analyzing');
    setAnalysisStep(0);
    const stepInterval = setInterval(() => {
        setAnalysisStep(prev => Math.min(prev + 1, currentSteps.length - 1));
    }, 1500);

    try {
        const type = file.type.startsWith('image/') ? 'image' : 'audio';
        const data = await analyzeMediaDeepfake(file, type);
        clearInterval(stepInterval);
        setResult({
            isDeepfake: data.isDeepfake,
            score: data.confidenceScore,
            indicators: data.indicators,
            explanation: data.explanation,
            details: data.details
        });
        setStatus('result');
    } catch (error) {
        clearInterval(stepInterval);
        setStatus('idle');
        alert("Lỗi phân tích.");
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setResult(null);
  };

  return (
    <div className={`p-4 md:p-6 pt-24 md:pt-10 pb-32 min-h-screen max-w-6xl mx-auto animate-in fade-in duration-300 ${isSeniorMode ? 'text-lg' : ''}`}>
      
      {/* Sci-Fi Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6">
          <div>
              <div className="flex items-center gap-2 mb-2">
                   <span className="bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-widest">Forensic Module v4.2</span>
                   <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
              </div>
              <h2 className={`${isSeniorMode ? 'text-4xl' : 'text-4xl'} font-black text-slate-900 mb-2 flex items-center gap-3 tracking-tight`}>
                  Deepfake Scanner
              </h2>
              <p className="text-slate-500 font-medium max-w-2xl text-sm">
                  Công cụ phân tích pháp y kỹ thuật số (Digital Forensics) phát hiện nội dung giả mạo bởi AI.
              </p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
               <TechBadge icon={<Eye size={14} />} label="Hive AI" color="blue" />
               <TechBadge icon={<HeartPulse size={14} />} label="Intel PPG" color="red" />
               <TechBadge icon={<Database size={14} />} label="Forensics++" color="purple" />
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
                      <p className={`text-slate-400 font-bold mb-8 relative z-10 uppercase tracking-widest text-xs`}>Hỗ trợ JPG, PNG, MP3, WAV</p>
                      
                      <label className={`bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-lg active:scale-95 relative z-10 flex items-center gap-3 ${isSeniorMode ? 'px-10 py-5 text-xl' : 'px-8 py-4'}`}>
                          <Upload size={20} /> Tải lên phân tích
                          <input type="file" className="hidden" accept="image/*,audio/*" onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])} />
                      </label>
                  </div>
              ) : (
                  <div className={`relative bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center group h-[500px]`}>
                      
                      {/* Cyberpunk Grid */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,128,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
                      
                      {/* Scanning Laser */}
                      {status === 'analyzing' && (
                          <div className="absolute inset-0 z-30 pointer-events-none border-b-[3px] border-green-400/80 animate-scan-line shadow-[0_0_20px_rgba(74,222,128,0.5)] bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-[15%]"></div>
                      )}

                      <button onClick={reset} disabled={status === 'analyzing'} className="absolute top-4 right-4 z-40 p-2 bg-black/40 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-md border border-white/10">
                          <X size={24} />
                      </button>

                      {file.type.startsWith('image/') ? (
                           <div className="relative w-full h-full flex items-center justify-center bg-black/50 p-4">
                               <img src={previewUrl!} alt="Preview" className="max-w-full max-h-full object-contain relative z-10 rounded-lg shadow-2xl" />
                               
                               {status === 'analyzing' && (
                                   <div className="absolute w-48 h-48 border-2 border-green-500/60 rounded-lg z-20 flex items-center justify-center animate-pulse">
                                       <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400 -mt-1 -ml-1"></div>
                                       <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400 -mt-1 -mr-1"></div>
                                       <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400 -mb-1 -ml-1"></div>
                                       <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400 -mb-1 -mr-1"></div>
                                       <div className="bg-black/80 text-green-400 text-[10px] font-mono px-2 py-0.5 rounded border border-green-500/30">SCANNING_FACES</div>
                                   </div>
                               )}
                           </div>
                      ) : (
                           <div className="flex flex-col items-center justify-center text-white z-10 w-full">
                               <div className={`rounded-full border-2 flex items-center justify-center mb-8 relative bg-slate-900 ${status === 'analyzing' ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'border-slate-700'} ${isSeniorMode ? 'w-48 h-48' : 'w-40 h-40'}`}>
                                   <Activity size={isSeniorMode ? 80 : 48} className={status === 'analyzing' ? 'text-green-400 animate-pulse' : 'text-slate-500'} />
                               </div>
                               <audio ref={audioRef} src={previewUrl!} onEnded={() => setIsPlaying(false)} />
                               <button 
                                  onClick={() => {
                                      if(isPlaying) audioRef.current?.pause();
                                      else audioRef.current?.play();
                                      setIsPlaying(!isPlaying);
                                  }}
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
                           <FileImage size={48} className="text-slate-400 mx-auto mb-2" />
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
                  <div className="bg-slate-900 rounded-[32px] p-8 h-full flex flex-col justify-center text-white relative overflow-hidden border border-slate-700">
                      <div className="text-center relative z-10">
                          <Loader2 size={64} className="text-green-500 animate-spin mx-auto mb-6" />
                          <h3 className="font-black mb-8 font-mono tracking-widest text-2xl">PROCESSING...</h3>
                          <div className="space-y-4 text-left">
                              {currentSteps.map((step, idx) => (
                                  <div key={idx} className={`flex items-center gap-4 transition-all duration-300 ${idx <= analysisStep ? 'opacity-100' : 'opacity-20'}`}>
                                      <div className={`w-2 h-2 rounded-full ${idx === analysisStep ? 'bg-green-400 animate-ping' : idx < analysisStep ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                                      <span className={`font-mono text-sm ${idx === analysisStep ? 'text-green-400' : 'text-slate-400'}`}>{step.text}</span>
                                  </div>
                              ))}
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
    </div>
  );
};

const TechBadge = ({icon, label, color}: any) => (
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
