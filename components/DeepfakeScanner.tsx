
import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanFace, Upload, FileImage, FileAudio, X, AlertTriangle, 
  CheckCircle2, Loader2, Play, Pause, Scan, Fingerprint, ShieldAlert,
  Search, Eye, Activity, HeartPulse, Sparkles, BarChart3, Database,
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
  const [result, setResult] = useState<{
      isDeepfake: boolean;
      score: number;
      indicators: string[];
      explanation: string;
      details: {
          biologicalScore: number;
          visualArtifactsScore: number;
          audioSpectralScore: number;
          integrityScore: number;
          faceForensicsMatch: number;
      }
  } | null>(null);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simulated Scanning Steps matching the "Integrated" tools
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const isImage = selectedFile.type.startsWith('image/');
    const isAudio = selectedFile.type.startsWith('audio/');

    if (!isImage && !isAudio) {
      alert("Chỉ hỗ trợ file Hình ảnh hoặc Âm thanh.");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
         alert("File quá lớn. Vui lòng chọn file dưới 20MB.");
         return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    
    // Reset states
    setStatus('idle');
    setResult(null);
    setAnalysisStep(0);
    setIsPlaying(false);
  };

  const startAnalysis = async () => {
    if (!file) return;

    setStatus('analyzing');
    setAnalysisStep(0);

    // Simulate Step Progress for visual effect
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
        alert("Có lỗi khi phân tích. Vui lòng thử lại.");
        setStatus('idle');
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setResult(null);
  };

  // Cleanup
  useEffect(() => {
    return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className={`p-4 md:p-6 pt-20 md:pt-10 pb-32 min-h-screen max-w-6xl mx-auto animate-in fade-in duration-300 ${isSeniorMode ? 'text-lg' : ''}`}>
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end">
          <div>
              <h2 className={`${isSeniorMode ? 'text-4xl' : 'text-3xl'} font-black text-slate-900 mb-2 flex items-center gap-3`}>
                  <ScanFace size={isSeniorMode ? 48 : 32} className="text-blue-600" />
                  Forensic Deepfake Scan
              </h2>
              <p className="text-slate-500 font-medium max-w-2xl text-sm md:text-base">
                  Phân tích đa động cơ: Tích hợp <span className="font-bold text-slate-700">Intel FakeCatcher</span>, <span className="font-bold text-slate-700">Hive AI</span> & <span className="font-bold text-slate-700">FaceForensics++</span>.
              </p>
          </div>
          
          {/* Engine Badges */}
          <div className="flex gap-2 mt-4 md:mt-0 flex-wrap">
               <div className={`bg-blue-50 border border-blue-200 rounded-lg font-bold text-blue-700 flex items-center gap-1.5 shadow-sm ${isSeniorMode ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'}`} title="Phát hiện lỗi hình ảnh">
                   <Eye size={isSeniorMode ? 16 : 12} /> Hive AI
               </div>
               <div className={`bg-red-50 border border-red-200 rounded-lg font-bold text-red-700 flex items-center gap-1.5 shadow-sm ${isSeniorMode ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'}`} title="Phân tích mạch máu/PPG">
                   <HeartPulse size={isSeniorMode ? 16 : 12} /> Intel FakeCatcher
               </div>
               <div className={`bg-purple-50 border border-purple-200 rounded-lg font-bold text-purple-700 flex items-center gap-1.5 shadow-sm ${isSeniorMode ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'}`} title="So khớp dữ liệu đào tạo">
                   <Database size={isSeniorMode ? 16 : 12} /> FaceForensics++
               </div>
          </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: Upload & Preview */}
          <div className="flex-1 lg:max-w-[60%]">
              {!file ? (
                  // UPLOAD STATE
                  <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-4 border-dashed rounded-[32px] flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white group hover:border-blue-500 hover:bg-blue-50/50 relative overflow-hidden ${
                          isDragging ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                      } ${isSeniorMode ? 'h-[500px]' : 'h-96'}`}
                  >
                      {/* Decorative Background grid */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                      <div className={`rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10 ${isSeniorMode ? 'w-32 h-32 bg-blue-100' : 'w-24 h-24 bg-blue-100'}`}>
                          <Upload size={isSeniorMode ? 56 : 40} className="text-blue-600" />
                      </div>
                      <h3 className={`font-black text-slate-800 mb-2 relative z-10 ${isSeniorMode ? 'text-4xl' : 'text-2xl'}`}>Kéo thả Media để Kiểm tra</h3>
                      <p className={`text-slate-400 font-bold mb-6 relative z-10 ${isSeniorMode ? 'text-xl' : 'text-sm'}`}>Hỗ trợ Ảnh & Âm thanh</p>
                      <label className={`bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-lg active:scale-95 relative z-10 flex items-center gap-2 ${isSeniorMode ? 'px-10 py-5 text-xl' : 'px-8 py-4'}`}>
                          <FileImage size={isSeniorMode ? 28 : 20} /> Tải lên từ thiết bị
                          <input type="file" className="hidden" accept="image/*,audio/*" onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])} />
                      </label>
                  </div>
              ) : (
                  // PREVIEW STATE
                  <div className={`relative bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-slate-700 flex items-center justify-center group ${isSeniorMode ? 'h-[500px] lg:h-[700px]' : 'h-96 lg:h-[600px]'}`}>
                      
                      {/* Grid Overlay for "Scanning" Effect */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                      
                      {/* Scanner Line Animation */}
                      {status === 'analyzing' && (
                          <div className="absolute inset-0 z-30 pointer-events-none border-b-2 border-green-500/80 animate-[scan_2s_linear_infinite] bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-[20%] shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                      )}

                      {/* Remove Button */}
                      <button onClick={reset} disabled={status === 'analyzing'} className="absolute top-4 right-4 z-40 p-3 bg-black/40 hover:bg-red-500/80 text-white rounded-full transition-colors backdrop-blur-md border border-white/10">
                          <X size={isSeniorMode ? 32 : 24} />
                      </button>

                      {/* Content Preview */}
                      {file.type.startsWith('image/') ? (
                           <div className="relative w-full h-full flex items-center justify-center bg-black">
                               <img src={previewUrl!} alt="Preview" className="max-w-full max-h-full object-contain relative z-10" />
                               
                               {/* Biological Heatmap Simulation (FakeCatcher) */}
                               {status === 'result' && (
                                   <div className={`absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-40 bg-gradient-to-tr ${result?.details.biologicalScore && result.details.biologicalScore > 50 ? 'from-transparent via-green-500/30 to-transparent' : 'from-transparent via-gray-500/50 to-transparent'}`}></div>
                               )}

                               {/* Visual Artifacts Highlight (Hive) */}
                               {status === 'result' && result?.isDeepfake && (
                                   <div className="absolute inset-0 z-20 pointer-events-none border-4 border-red-500/50 shadow-[inset_0_0_50px_rgba(220,38,38,0.5)]"></div>
                               )}

                               {/* Face Target Rects (Visual Only) */}
                               {status === 'analyzing' && (
                                   <div className="absolute w-48 h-48 border-2 border-green-400/80 rounded-lg animate-pulse z-20 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.3)]">
                                       <div className="w-1 h-3 bg-green-400 absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"></div>
                                       <div className="w-3 h-1 bg-green-400 absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"></div>
                                       
                                       <div className="w-1 h-3 bg-green-400 absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"></div>
                                       <div className="w-3 h-1 bg-green-400 absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"></div>
                                       
                                       <div className="w-1 h-3 bg-green-400 absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2"></div>
                                       <div className="w-3 h-1 bg-green-400 absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2"></div>
                                       
                                       <div className="w-1 h-3 bg-green-400 absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2"></div>
                                       <div className="w-3 h-1 bg-green-400 absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2"></div>
                                       
                                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded border border-green-500/30 text-center">
                                            <div className="text-[10px] font-mono font-bold text-green-400">INTEL_PPG_SCANNING</div>
                                            <div className="text-[8px] font-mono text-green-600">Blood Flow Analysis</div>
                                       </div>
                                   </div>
                               )}
                           </div>
                      ) : (
                           <div className="flex flex-col items-center justify-center text-white z-10 w-full px-10">
                               <div className={`rounded-full border-4 flex items-center justify-center mb-8 relative ${status === 'analyzing' ? 'border-green-500 animate-pulse' : 'border-slate-500'} ${isSeniorMode ? 'w-48 h-48' : 'w-32 h-32'}`}>
                                   <FileAudio size={isSeniorMode ? 80 : 48} />
                                   {/* Audio Wave Animation */}
                                   {status === 'analyzing' && (
                                       <>
                                        <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-20"></div>
                                        <div className="absolute -inset-4 rounded-full border border-green-500/30 animate-pulse delay-75"></div>
                                       </>
                                   )}
                               </div>
                               
                               {/* Spectral Analysis Visualization (Fake) */}
                               <div className="flex items-end justify-center gap-1 h-16 w-full max-w-xs mb-8 opacity-80">
                                   {[...Array(20)].map((_, i) => (
                                       <div 
                                         key={i} 
                                         className={`w-2 bg-green-500 rounded-t-sm ${status === 'analyzing' || isPlaying ? 'animate-bounce' : 'h-2'}`}
                                         style={{ 
                                             height: status === 'analyzing' || isPlaying ? `${Math.random() * 100}%` : '10%',
                                             animationDuration: `${0.5 + Math.random() * 0.5}s`
                                         }}
                                       ></div>
                                   ))}
                               </div>

                               <audio ref={audioRef} src={previewUrl!} onEnded={() => setIsPlaying(false)} />
                               <button 
                                  onClick={() => {
                                      if(isPlaying) audioRef.current?.pause();
                                      else audioRef.current?.play();
                                      setIsPlaying(!isPlaying);
                                  }}
                                  className={`bg-white/10 hover:bg-white/20 rounded-full font-bold flex items-center gap-3 backdrop-blur-md transition-all border border-white/20 ${isSeniorMode ? 'px-10 py-5 text-xl' : 'px-8 py-3'}`}
                               >
                                   {isPlaying ? <Pause size={isSeniorMode ? 28 : 20} /> : <Play size={isSeniorMode ? 28 : 20} />} 
                                   {isPlaying ? 'Tạm dừng phân tích' : 'Nghe mẫu âm thanh'}
                               </button>
                           </div>
                      )}
                  </div>
              )}
          </div>

          {/* RIGHT: Action & Results Dashboard */}
          <div className="flex-1">
              
              {/* STATUS: IDLE */}
              {status === 'idle' && file && (
                  <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl h-full flex flex-col justify-center items-center text-center">
                      <div className={`bg-blue-50 rounded-3xl flex items-center justify-center mb-6 text-blue-600 shadow-inner ${isSeniorMode ? 'w-28 h-28' : 'w-20 h-20'}`}>
                          {file.type.startsWith('image/') ? <FileImage size={isSeniorMode ? 56 : 40} /> : <FileAudio size={isSeniorMode ? 56 : 40} />}
                      </div>
                      <h3 className={`font-black text-slate-800 mb-2 line-clamp-1 break-all px-4 ${isSeniorMode ? 'text-3xl' : 'text-2xl'}`}>{file.name}</h3>
                      <div className="flex gap-4 mb-8">
                          <span className={`font-bold bg-slate-100 text-slate-500 rounded-full uppercase ${isSeniorMode ? 'text-base px-4 py-2' : 'text-xs px-3 py-1'}`}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className={`font-bold bg-slate-100 text-slate-500 rounded-full uppercase ${isSeniorMode ? 'text-base px-4 py-2' : 'text-xs px-3 py-1'}`}>
                              {file.type.split('/')[1].toUpperCase()}
                          </span>
                      </div>
                      
                      <button 
                          onClick={startAnalysis}
                          className={`w-full bg-gradient-premium text-white rounded-2xl font-bold shadow-xl shadow-slate-300 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group ${isSeniorMode ? 'py-6 text-2xl' : 'py-5 text-xl'}`}
                      >
                          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <Cpu size={isSeniorMode ? 32 : 24} /> KÍCH HOẠT QUÉT
                      </button>
                      <p className={`text-slate-400 mt-4 font-medium max-w-xs ${isSeniorMode ? 'text-base' : 'text-xs'}`}>
                          Sẽ phân tích bằng: Intel FakeCatcher, Hive AI, FaceForensics++ Dataset và AI Voice Detector.
                      </p>
                  </div>
              )}

              {/* STATUS: ANALYZING */}
              {status === 'analyzing' && (
                  <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl h-full flex flex-col justify-center text-white relative overflow-hidden border border-slate-700">
                      {/* Matrix rain effect simplified */}
                      <div className="absolute inset-0 opacity-10 font-mono text-[10px] leading-3 overflow-hidden pointer-events-none">
                          {Array(500).fill(0).map((_, i) => <span key={i}>{Math.random() > 0.5 ? '1' : '0'} </span>)}
                      </div>

                      <div className="relative z-10 text-center">
                          <div className={`border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-8 ${isSeniorMode ? 'w-28 h-28' : 'w-20 h-20'}`}></div>
                          <h3 className={`font-black mb-6 font-mono tracking-widest ${isSeniorMode ? 'text-3xl' : 'text-2xl'}`}>ĐANG XỬ LÝ...</h3>
                          
                          <div className="space-y-4 text-left bg-black/40 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                              {currentSteps.map((step, idx) => (
                                  <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${idx <= analysisStep ? 'opacity-100 translate-x-0' : 'opacity-30 -translate-x-2'}`}>
                                      <div className={`rounded-full flex items-center justify-center shadow-[0_0_10px_currentcolor] ${isSeniorMode ? 'w-10 h-10' : 'w-8 h-8'} ${idx < analysisStep ? 'bg-green-500 text-black' : idx === analysisStep ? 'bg-green-400 text-black animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                                          <step.icon size={isSeniorMode ? 20 : 14} />
                                      </div>
                                      <span className={`font-bold font-mono ${isSeniorMode ? 'text-lg' : 'text-sm'} ${idx === analysisStep ? 'text-green-400' : 'text-slate-400'}`}>{step.text}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {/* STATUS: RESULT */}
              {status === 'result' && result && (
                  <div className={`rounded-[32px] shadow-2xl h-full flex flex-col border-4 relative overflow-hidden animate-in slide-in-from-right duration-500 ${
                      isSeniorMode ? 'p-8' : 'p-6'
                  } ${
                      result.isDeepfake 
                      ? 'bg-red-50 border-red-500' 
                      : 'bg-green-50 border-green-500'
                  }`}>
                      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                          {/* Top Verdict */}
                          <div className="flex items-center justify-between mb-6">
                              <div>
                                  <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">KẾT QUẢ TỔNG HỢP</div>
                                  <h3 className={`font-black uppercase tracking-tight ${result.isDeepfake ? 'text-red-600' : 'text-green-600'} ${isSeniorMode ? 'text-7xl' : 'text-5xl'}`}>
                                      {result.isDeepfake ? 'GIẢ' : 'THẬT'}
                                  </h3>
                              </div>
                              <div className={`rounded-2xl flex flex-col items-center justify-center font-black border-4 shadow-lg ${isSeniorMode ? 'w-28 h-28' : 'w-20 h-20'} ${
                                  result.isDeepfake ? 'bg-red-600 text-white border-red-400' : 'bg-green-600 text-white border-green-400'
                              }`}>
                                  <span className={isSeniorMode ? 'text-5xl' : 'text-3xl'}>{result.score}</span>
                                  <span className="text-[10px] opacity-80">% FAKE</span>
                              </div>
                          </div>

                          {/* Forensic Breakdown Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                              
                              {/* Intel FakeCatcher Card (Image only) */}
                              {file.type.startsWith('image/') && (
                                <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${isSeniorMode ? 'p-5' : 'p-3'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <HeartPulse size={isSeniorMode ? 24 : 16} className="text-red-500" />
                                        <span className="text-xs font-bold uppercase text-slate-500">Intel FakeCatcher</span>
                                    </div>
                                    <div className="flex-1 flex items-end justify-between">
                                        <span className={`text-slate-400 ${isSeniorMode ? 'text-sm' : 'text-xs'}`}>Độ sống (Liveness)</span>
                                        <span className={`font-black ${isSeniorMode ? 'text-lg' : ''} ${result.details.biologicalScore > 50 ? 'text-green-600' : 'text-red-600'}`}>
                                            {result.details.biologicalScore > 50 ? 'Có mạch đập' : 'Không mạch'}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div className={`h-full rounded-full ${result.details.biologicalScore > 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{width: `${result.details.biologicalScore}%`}}></div>
                                    </div>
                                </div>
                              )}

                              {/* Hive AI Card */}
                              <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${isSeniorMode ? 'p-5' : 'p-3'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {file.type.startsWith('image/') ? <Eye size={isSeniorMode ? 24 : 16} className="text-blue-500" /> : <Activity size={isSeniorMode ? 24 : 16} className="text-blue-500" />}
                                        <span className="text-xs font-bold uppercase text-slate-500">
                                            {file.type.startsWith('image/') ? 'Hive AI Vision' : 'Voice Detector'}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex items-end justify-between">
                                        <span className={`text-slate-400 ${isSeniorMode ? 'text-sm' : 'text-xs'}`}>Dấu hiệu nhân tạo</span>
                                        <span className={`font-black ${isSeniorMode ? 'text-lg' : ''} ${
                                            (file.type.startsWith('image/') ? result.details.visualArtifactsScore : result.details.audioSpectralScore) > 30 ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                            {(file.type.startsWith('image/') ? result.details.visualArtifactsScore : result.details.audioSpectralScore)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full rounded-full bg-blue-500" style={{width: `${(file.type.startsWith('image/') ? result.details.visualArtifactsScore : result.details.audioSpectralScore)}%`}}></div>
                                    </div>
                              </div>

                              {/* FaceForensics++ Card */}
                              <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:col-span-2 ${isSeniorMode ? 'p-5' : 'p-3'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Database size={isSeniorMode ? 24 : 16} className="text-purple-500" />
                                        <span className="text-xs font-bold uppercase text-slate-500">FaceForensics++ Benchmark</span>
                                    </div>
                                    <div className="flex-1 flex items-end justify-between">
                                        <span className={`text-slate-400 ${isSeniorMode ? 'text-sm' : 'text-xs'}`}>Khớp dữ liệu mẫu lừa đảo</span>
                                        <span className={`font-black ${isSeniorMode ? 'text-lg' : ''} ${result.details.faceForensicsMatch > 40 ? 'text-red-600' : 'text-green-600'}`}>
                                            {result.details.faceForensicsMatch}% Match
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full rounded-full bg-purple-500" style={{width: `${result.details.faceForensicsMatch}%`}}></div>
                                    </div>
                              </div>
                          </div>

                          {/* AI Explanation */}
                          <div className={`bg-white/70 rounded-2xl mb-6 backdrop-blur-md border border-black/5 shadow-sm ${isSeniorMode ? 'p-6' : 'p-4'}`}>
                              <h4 className={`font-bold text-slate-800 uppercase mb-2 flex items-center gap-2 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>
                                  <Sparkles size={isSeniorMode ? 20 : 14} className="text-purple-500" /> Phân tích tổng hợp
                              </h4>
                              <p className={`text-slate-800 font-medium leading-relaxed ${isSeniorMode ? 'text-xl' : 'text-sm'}`}>
                                  {result.explanation}
                              </p>
                          </div>
                          
                          {/* Tags */}
                          {result.indicators.length > 0 && (
                               <div className="flex flex-wrap gap-2 mb-4">
                                   {result.indicators.map((ind, i) => (
                                       <span key={i} className={`rounded-lg font-bold border flex items-center gap-1 ${isSeniorMode ? 'text-lg px-4 py-2' : 'text-xs px-2.5 py-1.5'} ${
                                           result.isDeepfake 
                                           ? 'bg-red-100 text-red-700 border-red-200' 
                                           : 'bg-green-100 text-green-700 border-green-200'
                                       }`}>
                                           {result.isDeepfake ? <AlertTriangle size={isSeniorMode ? 20 : 10} /> : <CheckCircle2 size={isSeniorMode ? 20 : 10} />}
                                           {ind}
                                       </span>
                                   ))}
                               </div>
                          )}
                      </div>

                      <button 
                          onClick={reset}
                          className={`w-full rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${isSeniorMode ? 'py-6 text-2xl mt-4' : 'py-4 mt-2'} ${
                              result.isDeepfake ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                      >
                          <Scan size={isSeniorMode ? 32 : 20} /> QUÉT FILE KHÁC
                      </button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default DeepfakeScanner;
