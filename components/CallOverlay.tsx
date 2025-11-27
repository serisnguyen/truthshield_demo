
import React, { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, Mic, ShieldCheck, ShieldAlert, Loader2, User, Activity, AlertTriangle, Disc, Users, ThumbsDown, Bot, MessageSquareText, PlayCircle, Ban } from 'lucide-react';
import { CallLogItem } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { analyzeConversationContext } from '../services/aiService';
import { PhoneLookupResult } from '../types';

interface CallOverlayProps {
    call: CallLogItem;
}

const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const CallOverlay: React.FC<CallOverlayProps> = ({ call }) => {
    const { setIncomingCall, checkGlobalVoiceRegistry, user, updateCallHistoryItem, lookupPhoneNumber, isSeniorMode, blockNumber } = useAuth();
    // Determine initial status based on direction
    const [status, setStatus] = useState<'ringing' | 'calling' | 'screening' | 'connected' | 'ended' | 'auto_ended' | 'blocked'>(
        call.direction === 'outgoing' ? 'calling' : 'ringing'
    );
    const [timer, setTimer] = useState(0);
    
    // Community Data
    const [communityInfo, setCommunityInfo] = useState<PhoneLookupResult | null>(null);

    // Content Analysis State
    const [transcript, setTranscript] = useState<string[]>([]);
    const [riskScore, setRiskScore] = useState(0); // 0 - 100
    const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [warningPlayed, setWarningPlayed] = useState(false);
    const [autoHangupCountdown, setAutoHangupCountdown] = useState<number | null>(null);
    
    // Screening State
    const [screeningStep, setScreeningStep] = useState<'ai_asking' | 'caller_speaking' | 'analyzing'>('ai_asking');
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Settings
    const RISK_THRESHOLD = user?.riskThreshold || 70;
    const AUTO_RECORD = user?.autoRecordHighRisk ?? true;
    const AUTO_HANGUP = user?.autoHangupHighRisk ?? false;

    // Check verification status (Identity Layer)
    const isVerifiedContact = checkGlobalVoiceRegistry(call.phoneNumber);
    const contactName = user?.contacts.find(c => c.phone === call.phoneNumber)?.name || call.phoneNumber;
    const isOutgoing = call.direction === 'outgoing';

    // --- OUTGOING CALL SIMULATION ---
    useEffect(() => {
        if (isOutgoing && status === 'calling') {
            // Simulate waiting for answer
            const timer = setTimeout(() => {
                setStatus('connected');
                // Play connect sound if possible
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOutgoing, status]);

    // --- FETCH COMMUNITY INFO ON RINGING ---
    useEffect(() => {
        const fetchInfo = async () => {
            const info = await lookupPhoneNumber(call.phoneNumber);
            if (info) {
                setCommunityInfo(info);
                // Pre-set risk score based on reputation if it's very bad
                if (info.tags.includes('scam')) {
                    setRiskScore(60); // Start with warning
                }
            }
        };
        fetchInfo();
    }, [call.phoneNumber]);

    // --- MOCK SCRIPTS FOR DEMO ---
    const SAFE_SCRIPT = [
        "Alo, em là shipper đây ạ.",
        "Em có đơn hàng Shopee giao tới nhà mình.",
        "Tổng tiền là 50 nghìn chị nhé.",
        "Chị xuống sảnh lấy giúp em với ạ.",
        "Dạ vâng em đợi."
    ];

    const SCAM_SCRIPT = [
        "Alo, tôi là cán bộ điều tra Lê Văn Hùng.",
        "Hiện tại số căn cước của chị liên quan đến đường dây rửa tiền.",
        "Chúng tôi yêu cầu chị hợp tác điều tra bí mật.",
        "Tuyệt đối không được nói cho người thân biết.",
        "Yêu cầu chị kê khai tài sản và chuyển tiền vào tài khoản tạm giữ để xác minh."
    ];
    
    // --- SCREENING SCRIPTS ---
    const SCREENING_RESPONSE_SAFE = "Dạ chào chị, em là shipper Giao Hàng Tiết Kiệm, em có đơn hàng 200k giao cho chị ạ.";
    const SCREENING_RESPONSE_SCAM = "Đây là thông báo từ Cục Cảnh sát Giao thông. Bạn có một biên lai phạt nguội quá hạn. Yêu cầu bấm phím 9 để nghe chi tiết.";

    // Initialize Warning Sound
    useEffect(() => {
        audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg');
        audioRef.current.loop = false;
        audioRef.current.volume = 0.5;
    }, []);

    // Auto-scroll transcript
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    // Timer logic
    useEffect(() => {
        let interval: any;
        if (status === 'connected') {
            interval = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    // --- SIMULATE CONVERSATION & ANALYSIS (CONNECTED MODE) ---
    useEffect(() => {
        if (status === 'connected') {
            const scriptToPlay = call.riskStatus === 'suspicious' ? SCAM_SCRIPT : SAFE_SCRIPT;
            let currentIndex = 0;

            const conversationInterval = setInterval(() => {
                if (currentIndex >= scriptToPlay.length) {
                    clearInterval(conversationInterval);
                    return;
                }

                const newSentence = scriptToPlay[currentIndex];
                setTranscript(prev => [...prev, newSentence]);

                const analysis = analyzeConversationContext(newSentence, isVerifiedContact);
                
                // Update Risk and Keywords
                setRiskScore(prev => {
                    const newScore = Math.min(100, prev + analysis.scoreIncrease);
                    return newScore;
                });

                if (analysis.keywordsFound.length > 0) {
                    setDetectedKeywords(prev => Array.from(new Set([...prev, ...analysis.keywordsFound])));
                }

                currentIndex++;
            }, 2500);

            return () => clearInterval(conversationInterval);
        }
    }, [status, call.riskStatus, isVerifiedContact]);

    // --- SCREENING LOGIC (ASSISTANT MODE) ---
    useEffect(() => {
        if (status === 'screening') {
            // Step 1: AI Asking
            setTranscript(["AI: Xin chào, chủ thuê bao hiện đang bận. Vui lòng cho biết tên và mục đích cuộc gọi."]);
            
            setTimeout(() => {
                setScreeningStep('caller_speaking');
                
                setTimeout(() => {
                    const response = call.riskStatus === 'suspicious' ? SCREENING_RESPONSE_SCAM : SCREENING_RESPONSE_SAFE;
                    setTranscript(prev => [...prev, `Người gọi: ${response}`]);
                    
                    // Instant Analysis
                    const analysis = analyzeConversationContext(response, isVerifiedContact);
                    setRiskScore(analysis.scoreIncrease > 0 ? 85 : 10);
                    if (analysis.keywordsFound.length > 0) {
                        setDetectedKeywords(analysis.keywordsFound);
                    } else if (call.riskStatus === 'suspicious') {
                         setDetectedKeywords(["phạt nguội", "bấm phím"]);
                    }
                    
                    setScreeningStep('analyzing');
                }, 3000); // Caller speaks for 3s
            }, 2500); // AI speaks for 2.5s
        }
    }, [status, call.riskStatus, isVerifiedContact]);


    // --- RISK REACTION LOGIC ---
    useEffect(() => {
        if (status !== 'connected') return;

        // 1. Sound Alert
        if (riskScore >= RISK_THRESHOLD && !warningPlayed) {
            audioRef.current?.play().catch(e => console.log("Audio policy:", e));
            setWarningPlayed(true);
        }

        // 2. Auto Record
        if (riskScore >= 40 && AUTO_RECORD && !isRecording) {
            setIsRecording(true);
        }

        // 3. Auto Hangup
        if (riskScore > 80 && AUTO_HANGUP && autoHangupCountdown === null) {
            setAutoHangupCountdown(3);
        }

    }, [riskScore, status, RISK_THRESHOLD, AUTO_RECORD, AUTO_HANGUP, isRecording, warningPlayed, autoHangupCountdown]);

    // --- AUTO HANGUP COUNTDOWN ---
    useEffect(() => {
        if (autoHangupCountdown !== null && autoHangupCountdown > 0) {
            const timer = setTimeout(() => setAutoHangupCountdown(autoHangupCountdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (autoHangupCountdown === 0) {
             handleReject(true); // Auto Reject
        }
    }, [autoHangupCountdown]);


    const handleAnswer = () => {
        setStatus('connected');
        if (status === 'screening') {
            setTranscript(prev => [...prev, "--- Đã bắt máy ---"]);
        } else {
            setTranscript([]);
        }
    };
    
    const handleScreenCall = () => {
        setStatus('screening');
    };

    const handleReject = (auto: boolean = false) => {
        if (auto) setStatus('auto_ended');
        else setStatus('ended');
        saveCallData(status === 'screening' || status === 'connected');
        setTimeout(() => setIncomingCall(null), 1500);
    };

    const handleBlock = () => {
        blockNumber(call.phoneNumber);
        setStatus('blocked');
        saveCallData(false); // Probably didn't talk if blocked immediately
        setTimeout(() => setIncomingCall(null), 1500);
    };

    const saveCallData = (hasData: boolean) => {
        const screeningData = hasData ? {
            transcript: transcript,
            callerResponse: transcript.find(t => t.startsWith("Người gọi:"))?.replace("Người gọi: ", ""),
            analyzedRisk: riskScore > RISK_THRESHOLD ? 'scam' as const : 'safe' as const,
            aiResponse: "Xin chào, chủ thuê bao hiện đang bận. Vui lòng cho biết tên và mục đích cuộc gọi.",
            isScreened: status === 'screening' || transcript.some(t => t.includes("AI:"))
        } : undefined;

        updateCallHistoryItem(call.id, {
            aiAnalysis: {
                riskScore: riskScore,
                explanation: riskScore > RISK_THRESHOLD 
                    ? "Phát hiện nội dung lừa đảo nguy hiểm." 
                    : "Nội dung cuộc gọi an toàn.",
                detectedKeywords: detectedKeywords,
                timestamp: Date.now()
            },
            hasRecording: isRecording,
            screeningData: screeningData
        });
    };

    const getRiskLevel = (score: number) => {
        if (score >= RISK_THRESHOLD) return 'DANGER';
        if (score >= 40) return 'WARNING';
        return 'SAFE';
    };

    const riskLevel = getRiskLevel(riskScore);
    const hasCommunityWarning = communityInfo && communityInfo.reputationScore < 50;

    // Helper to highlight keywords in transcript
    const highlightKeywords = (text: string) => {
        if (!detectedKeywords.length) return text;
        
        const parts = text.split(new RegExp(`(${detectedKeywords.join('|')})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    detectedKeywords.some(k => k.toLowerCase() === part.toLowerCase()) ? (
                        <span key={i} className="text-red-400 font-black underline decoration-red-500 underline-offset-4 decoration-2">
                            {part}
                        </span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    return (
        <div className={`fixed inset-0 z-[100] transition-colors duration-700 flex flex-col items-center justify-between py-6 px-4 overflow-hidden ${
            riskLevel === 'DANGER' || hasCommunityWarning ? 'bg-red-900' : 
            riskLevel === 'WARNING' ? 'bg-amber-900' : 
            status === 'screening' ? 'bg-indigo-900' : 'bg-slate-900'
        }`}>
            {/* Background Effects - Removed blurs for better text visibility */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                 <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full ${
                     riskLevel === 'DANGER' || hasCommunityWarning ? 'bg-red-950' : 
                     riskLevel === 'WARNING' ? 'bg-amber-950' : 
                     status === 'screening' ? 'bg-indigo-950' : 'bg-blue-950'
                 }`}></div>
            </div>
            
            {/* --- TOP: CALL INFO --- */}
            <div className="relative z-10 text-center w-full mt-4 flex-shrink-0">
                <div className="flex flex-col items-center justify-center gap-2 mb-4">
                    <div className="flex gap-2">
                        {/* Status Badges */}
                        {status === 'calling' && (
                             <span className={`bg-black/40 text-white px-4 py-1.5 rounded-full font-bold animate-pulse border border-white/20 ${isSeniorMode ? 'text-lg' : 'text-xs'}`}>
                                Đang gọi đi...
                            </span>
                        )}

                        {isVerifiedContact ? (
                            <span className={`bg-green-800 text-white border border-green-400 px-4 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${isSeniorMode ? 'text-lg' : 'text-xs'}`}>
                                <ShieldCheck size={isSeniorMode ? 20 : 14} /> Voice DNA: Khớp
                            </span>
                        ) : hasCommunityWarning ? (
                             <span className={`bg-red-800 text-white border border-red-500 px-4 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-lg animate-pulse ${isSeniorMode ? 'text-lg' : 'text-xs'}`}>
                                <ThumbsDown size={isSeniorMode ? 20 : 14} /> {communityInfo?.communityLabel || "CỘNG ĐỒNG BÁO LỪA ĐẢO"}
                            </span>
                        ) : null}
                    </div>
                    
                    {/* Timer Badge */}
                    {status === 'connected' && (
                        <span className="bg-black/40 text-white px-3 py-1.5 rounded-full text-xs font-bold font-mono border border-white/20">
                            {formatDuration(timer)}
                        </span>
                    )}
                </div>

                <div className={`mx-auto bg-white/10 rounded-full p-1 border-2 border-white/30 shadow-2xl mb-3 relative ${isSeniorMode ? 'w-28 h-28' : 'w-20 h-20'}`}>
                     <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                        {status === 'screening' ? <Bot size={40} className="text-indigo-400" /> : <User size={40} className="text-slate-400" />}
                     </div>
                     {(status === 'ringing' || status === 'calling') && (
                         <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
                     )}
                </div>

                <h2 className={`font-black text-white mb-0.5 tracking-tight drop-shadow-md truncate max-w-xs mx-auto ${isSeniorMode ? 'text-4xl' : 'text-3xl'}`}>{contactName}</h2>
                <p className={`text-slate-200 font-bold ${isSeniorMode ? 'text-2xl' : 'text-lg'}`}>{call.phoneNumber}</p>
                
                {/* Community Score */}
                {communityInfo && !isOutgoing && (
                    <div className="mt-2 flex items-center justify-center gap-3">
                         <span className="text-slate-200 text-xs font-bold uppercase border border-slate-400 px-2 py-0.5 rounded bg-black/30">
                             {communityInfo.carrier}
                         </span>
                    </div>
                )}
            </div>

            {/* --- MIDDLE: VISUALIZATION & TRANSCRIPT --- */}
            <div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center gap-6 overflow-hidden my-2">
                
                {(status === 'connected' || status === 'screening') && (
                    // Solid dark background for text readability - Increased Size
                    <div className="w-full max-w-lg bg-black/95 rounded-[32px] p-6 border border-white/30 flex flex-col h-[75%] shadow-2xl transition-all duration-500 backdrop-blur-md">
                        {/* Risk Meter Header */}
                        <div className="flex items-center justify-between mb-4 border-b border-white/20 pb-4">
                             <div className="flex items-center gap-3">
                                <Activity size={24} className={
                                    riskLevel === 'DANGER' ? 'text-red-500 animate-pulse' : 
                                    riskLevel === 'WARNING' ? 'text-amber-500' : 'text-green-500'
                                } />
                                <span className={`text-white font-bold ${isSeniorMode ? 'text-lg' : 'text-base'}`}>
                                    {status === 'screening' ? 'Trợ Lý AI Phân Tích' : 'Giám Sát Cuộc Gọi'}
                                </span>
                             </div>
                             <div className={`font-black px-4 py-1.5 rounded-xl ${
                                  riskLevel === 'DANGER' ? 'bg-red-600 text-white' : 
                                  riskLevel === 'WARNING' ? 'bg-amber-500 text-black' : 'bg-green-600 text-white'
                             } ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                                 {riskScore}/100
                             </div>
                        </div>

                        {/* Live Transcript Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth">
                            {transcript.length === 0 && (
                                <div className="text-center text-slate-400 text-sm italic mt-10 flex flex-col items-center gap-2">
                                    <Loader2 className="animate-spin opacity-50" size={32} />
                                    <span className={isSeniorMode ? 'text-lg' : 'text-base'}>Đang lắng nghe & phân tích...</span>
                                </div>
                            )}
                            {transcript.map((text, idx) => (
                                <div key={idx} className={`p-4 rounded-2xl leading-relaxed shadow-sm animate-in fade-in slide-in-from-left-2 duration-300 font-bold break-words ${isSeniorMode ? 'text-2xl' : 'text-lg'} ${
                                    text.startsWith("AI:") 
                                    ? 'bg-indigo-900 text-white border border-indigo-700' 
                                    : 'bg-slate-800 text-white border border-slate-700'
                                }`}>
                                    {highlightKeywords(text)}
                                </div>
                            ))}
                        </div>

                        {/* Detected Keywords */}
                        {detectedKeywords.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <p className="text-xs text-slate-300 uppercase font-bold mb-2 flex items-center gap-1">
                                    <AlertTriangle size={12} /> Từ khóa phát hiện:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {detectedKeywords.map((kw, i) => (
                                        <span key={i} className={`bg-red-600 text-white font-bold rounded border border-red-400 ${isSeniorMode ? 'text-base px-3 py-1.5' : 'text-xs px-2 py-1'}`}>
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Danger Overlay */}
                {(riskLevel === 'DANGER' && (status === 'connected' || status === 'screening')) || (status === 'ringing' && hasCommunityWarning && !isOutgoing) ? (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4 z-50">
                        <div className="bg-red-600 text-white p-8 rounded-[32px] shadow-2xl text-center animate-in zoom-in duration-300 border-4 border-white/20">
                            <ShieldAlert size={56} className="mx-auto mb-3 animate-bounce drop-shadow-md" />
                            <h3 className={`font-black uppercase mb-1 drop-shadow-sm ${isSeniorMode ? 'text-3xl' : 'text-2xl'}`}>CẢNH BÁO LỪA ĐẢO!</h3>
                            <button 
                                onClick={() => handleReject()} 
                                className={`bg-white text-red-700 rounded-2xl font-black uppercase w-full hover:bg-red-50 transition-colors shadow-lg active:scale-95 mt-6 border-b-4 border-red-900 ${isSeniorMode ? 'px-8 py-6 text-2xl' : 'px-6 py-4'}`}
                            >
                                Tắt máy ngay
                            </button>
                        </div>
                    </div>
                ) : null}

                {status === 'auto_ended' && (
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6 text-center z-50">
                         <div className="bg-red-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white">
                             <PhoneOff size={40} className="text-white" />
                         </div>
                         <h3 className="text-3xl font-black text-white drop-shadow-md mb-2">ĐÃ NGẮT CUỘC GỌI</h3>
                         <p className="text-white text-lg font-bold">Hệ thống tự động bảo vệ bạn.</p>
                     </div>
                )}
            </div>

            {/* --- BOTTOM: ACTIONS --- */}
            <div className="relative z-10 w-full max-w-sm flex justify-around items-center mb-6 flex-shrink-0">
                {status === 'ringing' ? (
                    <>
                        <button onClick={handleBlock} className="flex flex-col items-center gap-3 group">
                            <div className={`bg-slate-800 border-2 border-slate-600 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-all group-hover:bg-slate-700 ${isSeniorMode ? 'w-16 h-16' : 'w-14 h-14'}`}>
                                <Ban size={isSeniorMode ? 28 : 24} className="text-slate-300 fill-current" />
                            </div>
                            <span className={`text-slate-300 font-bold bg-black/50 px-2 rounded ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Chặn Số</span>
                        </button>
                        
                        <button onClick={() => handleReject()} className="flex flex-col items-center gap-3 group">
                            <div className={`bg-red-600 border-2 border-red-400 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-all group-hover:bg-red-500 ${isSeniorMode ? 'w-20 h-20' : 'w-16 h-16'}`}>
                                <PhoneOff size={isSeniorMode ? 32 : 28} className="text-white fill-current" />
                            </div>
                            <span className={`text-white font-bold bg-black/50 px-2 rounded ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>Từ chối</span>
                        </button>
                        
                        <button onClick={handleScreenCall} className="flex flex-col items-center gap-3 group -mt-8">
                            <div className={`bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/30 group-active:scale-95 transition-all border-4 border-slate-900 ${isSeniorMode ? 'w-24 h-24' : 'w-20 h-20'}`}>
                                <Bot size={isSeniorMode ? 40 : 32} className="text-white fill-current" />
                            </div>
                            <span className={`text-indigo-300 font-black uppercase tracking-wide bg-black/50 px-2 rounded ${isSeniorMode ? 'text-xl' : 'text-sm'}`}>Trợ Lý AI</span>
                        </button>

                        <button onClick={handleAnswer} className="flex flex-col items-center gap-3 group">
                            <div className={`bg-green-500 border-2 border-green-400 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-all animate-bounce group-hover:bg-green-400 ${isSeniorMode ? 'w-20 h-20' : 'w-16 h-16'}`}>
                                <Phone size={isSeniorMode ? 32 : 28} className="text-white fill-current" />
                            </div>
                            <span className={`text-white font-bold bg-black/50 px-2 rounded ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>Nghe</span>
                        </button>
                    </>
                ) : status === 'calling' ? (
                     <button onClick={() => handleReject()} className="flex flex-col items-center gap-3 group">
                        <div className={`bg-red-600 border-2 border-red-400 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-all group-hover:bg-red-500 ${isSeniorMode ? 'w-24 h-24' : 'w-20 h-20'}`}>
                            <PhoneOff size={isSeniorMode ? 40 : 32} className="text-white fill-current" />
                        </div>
                        <span className={`text-white font-bold bg-black/50 px-2 rounded ${isSeniorMode ? 'text-xl' : 'text-base'}`}>Hủy cuộc gọi</span>
                    </button>
                ) : status === 'blocked' ? (
                    <div className="text-slate-400 font-bold">Đã chặn số này</div>
                ) : (
                    <>
                         <button onClick={() => setIsRecording(!isRecording)} className="flex flex-col items-center gap-2 group">
                            <div className={`rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'} ${isSeniorMode ? 'w-16 h-16' : 'w-14 h-14'}`}>
                                <Disc size={isSeniorMode ? 28 : 24} />
                            </div>
                            <span className={`text-slate-300 font-bold ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Ghi âm</span>
                        </button>

                        <button onClick={() => handleReject()} className="flex flex-col items-center gap-3 group px-8">
                            <div className={`bg-red-600 border-2 border-red-400 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-all group-hover:bg-red-500 ${isSeniorMode ? 'w-24 h-24' : 'w-20 h-20'}`}>
                                <PhoneOff size={isSeniorMode ? 40 : 32} className="text-white fill-current" />
                            </div>
                        </button>

                        <button className="flex flex-col items-center gap-2 group opacity-50">
                            <div className={`bg-slate-700 rounded-full flex items-center justify-center transition-all text-slate-300 ${isSeniorMode ? 'w-16 h-16' : 'w-14 h-14'}`}>
                                <Mic size={isSeniorMode ? 28 : 24} />
                            </div>
                            <span className={`text-slate-300 font-bold ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Tắt mic</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CallOverlay;
