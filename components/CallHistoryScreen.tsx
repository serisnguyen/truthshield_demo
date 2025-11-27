
import React, { useState, useEffect } from 'react';
import { ArrowLeft, PhoneIncoming, PhoneOutgoing, ShieldCheck, ShieldAlert, AlertTriangle, Sparkles, Loader2, RefreshCw, Radio, Disc, Play } from 'lucide-react';
import { useAuth, CallLogItem } from '../context/AuthContext';
import { analyzeCallRisk } from '../services/aiService';

interface CallHistoryScreenProps {
  onBack: () => void;
}

const CallHistoryScreen: React.FC<CallHistoryScreenProps> = ({ onBack }) => {
  const { user, isSeniorMode, updateCallHistoryItem } = useAuth();
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}p ${sec}s`;
  };

  // Automatic "Real-time" Scan Logic
  useEffect(() => {
    const autoScanCalls = async () => {
        if (!user?.callHistory) return;
        const unanalyzedCalls = user.callHistory.filter(c => !c.aiAnalysis && !analyzingIds.includes(c.id));
        if (unanalyzedCalls.length === 0) return;

        setAnalyzingIds(prev => [...prev, ...unanalyzedCalls.map(c => c.id)]);

        for (const call of unanalyzedCalls) {
            try {
                await new Promise(r => setTimeout(r, 800));
                const analysis = await analyzeCallRisk(call);
                updateCallHistoryItem(call.id, {
                    aiAnalysis: {
                        riskScore: analysis.riskScore,
                        explanation: analysis.explanation,
                        detectedKeywords: [], // Basic scan doesn't have keywords
                        timestamp: Date.now()
                    }
                });
                setAnalyzingIds(prev => prev.filter(id => id !== call.id));
            } catch (e) { console.error(e); }
        }
    };
    autoScanCalls();
  }, [user?.callHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const getRiskColor = (score: number) => {
      if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
      if (score >= 30) return 'text-amber-600 bg-amber-50 border-amber-200';
      return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskLabel = (score: number) => {
      if (score >= 70) return 'Nguy Hiểm';
      if (score >= 30) return 'Cảnh Giác';
      return 'An Toàn';
  };

  return (
    <div className={`p-4 md:p-6 pt-20 md:pt-10 pb-32 min-h-screen max-w-2xl mx-auto animate-in fade-in duration-300`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
                 <h2 className="font-bold text-slate-900 text-2xl">Nhật Ký Cuộc Gọi</h2>
                 <p className="text-slate-500 text-sm">Chi tiết phân tích AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-blue-600 border-blue-200' : ''}`}
             >
                <RefreshCw size={20} />
             </button>
          </div>
      </div>

      <div className="space-y-4">
        {user?.callHistory && user.callHistory.length > 0 ? (
          [...user.callHistory].reverse().map(call => (
            <div 
                key={call.id} 
                onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all cursor-pointer hover:shadow-md ${isSeniorMode ? 'p-6' : 'p-0'}`}
            >
              <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      call.direction === 'incoming' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      {call.direction === 'incoming' ? <PhoneIncoming className="text-blue-600" size={24} /> : <PhoneOutgoing className="text-green-600" size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {call.contactName || call.phoneNumber}
                      </h3>
                      <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{formatTime(call.timestamp)}</span>
                          {call.hasRecording && (
                              <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold border border-red-100">
                                  <Disc size={10} /> REC
                              </span>
                          )}
                          {call.screeningData?.isScreened && (
                              <span className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-bold border border-indigo-100">
                                  <Radio size={10} /> SCREENED
                              </span>
                          )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Score Bubble */}
                  {call.aiAnalysis && (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xs border-4 ${
                          call.aiAnalysis.riskScore > 70 ? 'border-red-100 bg-red-500 text-white' : 
                          call.aiAnalysis.riskScore > 30 ? 'border-amber-100 bg-amber-500 text-white' : 
                          'border-green-100 bg-green-500 text-white'
                      }`}>
                          {call.aiAnalysis.riskScore}
                      </div>
                  )}
              </div>

              {/* Expanded / AI Analysis Section */}
              {call.aiAnalysis && (
                   <div className={`px-5 pb-5 ${expandedId === call.id ? 'block' : 'hidden'}`}>
                       <div className={`p-4 rounded-2xl border ${getRiskColor(call.aiAnalysis.riskScore)}`}>
                           <div className="flex justify-between items-center mb-2">
                               <div className="flex items-center gap-2">
                                    {call.aiAnalysis.riskScore >= 70 ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                                    <span className="font-black uppercase text-sm">
                                        Đánh giá: {getRiskLabel(call.aiAnalysis.riskScore)}
                                    </span>
                               </div>
                           </div>
                           
                           <p className="text-sm font-medium mb-3">
                               "{call.aiAnalysis.explanation}"
                           </p>

                           {/* Keywords */}
                           {call.aiAnalysis.detectedKeywords && call.aiAnalysis.detectedKeywords.length > 0 && (
                               <div className="border-t border-current/10 pt-3 mt-3">
                                   <p className="text-[10px] font-bold uppercase mb-2 opacity-70 flex items-center gap-1">
                                       <AlertTriangle size={10} /> Từ khóa phát hiện:
                                   </p>
                                   <div className="flex flex-wrap gap-1.5">
                                       {call.aiAnalysis.detectedKeywords.map((kw, idx) => (
                                           <span key={idx} className="bg-white/50 px-2 py-1 rounded text-xs font-bold border border-current/20">
                                               {kw}
                                           </span>
                                       ))}
                                   </div>
                               </div>
                           )}

                           {/* Playback Simulation */}
                           {call.hasRecording && (
                               <div className="mt-4 bg-white/60 p-3 rounded-xl flex items-center gap-3 cursor-not-allowed opacity-80" title="Chỉ mô phỏng">
                                   <button className="w-8 h-8 bg-current rounded-full flex items-center justify-center text-white">
                                       <Play size={12} fill="currentColor" />
                                   </button>
                                   <div className="h-1 bg-current/20 flex-1 rounded-full overflow-hidden">
                                       <div className="w-1/3 h-full bg-current"></div>
                                   </div>
                                   <span className="text-xs font-mono font-bold">00:15 / {formatDuration(call.duration)}</span>
                               </div>
                           )}
                       </div>
                   </div>
              )}
            </div>
          ))
        ) : (
           <p className="text-center text-slate-500 mt-10">Chưa có cuộc gọi nào được ghi lại.</p>
        )}
      </div>
    </div>
  );
};

export default CallHistoryScreen;