
import React, { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, ShieldCheck, ShieldAlert, AlertTriangle, User, Globe, ThumbsDown, Ban, X } from 'lucide-react';
import { CallLogItem } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
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
    const { setIncomingCall, user, updateCallHistoryItem, lookupPhoneNumber, isSeniorMode, blockNumber } = useAuth();
    
    // Status
    const [status, setStatus] = useState<'ringing' | 'connected' | 'ended' | 'auto_ended' | 'blocked'>('ringing');
    const [timer, setTimer] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false); // Global interaction lock
    
    // Carrier / Community Data
    const [communityInfo, setCommunityInfo] = useState<PhoneLookupResult | null>(null);
    const [warningPlayed, setWarningPlayed] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const AUTO_HANGUP = user?.autoHangupHighRisk ?? false;

    // Contact Check
    const contactName = user?.contacts.find(c => c.phone === call.phoneNumber)?.name || null;

    // --- FETCH CARRIER DATA ---
    useEffect(() => {
        const fetchInfo = async () => {
            setIsLoadingData(true);
            const info = await lookupPhoneNumber(call.phoneNumber);
            if (info) {
                setCommunityInfo(info);
            }
            setIsLoadingData(false);
        };
        fetchInfo();
    }, [call.phoneNumber]);

    // Initialize Warning Sound
    useEffect(() => {
        audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg');
        audioRef.current.loop = false;
        audioRef.current.volume = 0.5;
    }, []);

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


    // --- RISK REACTION LOGIC ---
    const isRisky = communityInfo?.tags.includes('scam') || (communityInfo?.reputationScore || 100) < 50;

    useEffect(() => {
        if (!isLoadingData && isRisky && !warningPlayed && status === 'ringing') {
            audioRef.current?.play().catch(e => console.log("Audio policy:", e));
            setWarningPlayed(true);
            
            // Auto Hangup Logic
            if (AUTO_HANGUP && communityInfo?.reputationScore! < 20) {
                 setTimeout(() => handleReject(true), 3000);
            }
        }
    }, [isLoadingData, isRisky, warningPlayed, status, AUTO_HANGUP, communityInfo]);


    const handleAnswer = () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setStatus('connected');
        setIsProcessing(false); // Allow further actions (like hanging up)
    };
    
    const handleReject = (auto: boolean = false) => {
        if (isProcessing) return;
        setIsProcessing(true);

        if (auto) setStatus('auto_ended');
        else setStatus('ended');
        
        saveCallData();
        setTimeout(() => {
            setIncomingCall(null);
            setIsProcessing(false);
        }, 2000);
    };

    const handleBlock = () => {
        if (isProcessing) return;
        setIsProcessing(true);

        blockNumber(call.phoneNumber);
        setStatus('blocked');
        saveCallData();
        setTimeout(() => {
            setIncomingCall(null);
            setIsProcessing(false);
        }, 2000);
    };

    const saveCallData = () => {
        updateCallHistoryItem(call.id, {
            communityInfo: communityInfo || undefined,
            riskStatus: isRisky ? 'scam' : 'safe'
        });
    };

    return (
        <div className={`fixed inset-0 z-[100] transition-colors duration-700 flex flex-col items-center justify-between py-8 px-4 overflow-hidden ${
            isRisky ? 'bg-red-900' : 
            status === 'connected' ? 'bg-slate-900' : 'bg-slate-800'
        }`}>
            {/* Close Button */}
            <button 
                onClick={() => setIncomingCall(null)}
                className="absolute top-4 right-4 p-3 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-md z-50 transition-colors active:scale-95"
                aria-label="Đóng màn hình cuộc gọi"
            >
                <X size={isSeniorMode ? 32 : 24} />
            </button>

            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                 <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full ${
                     isRisky ? 'bg-red-950' : 'bg-blue-950'
                 }`}></div>
            </div>
            
            {/* --- TOP: CALL INFO --- */}
            <div className="relative z-10 text-center w-full mt-8 flex-shrink-0">
                
                {/* STATUS BADGE */}
                <div className="flex flex-col items-center justify-center gap-2 mb-6">
                    {contactName ? (
                         <span className={`bg-green-600 text-white border border-green-400 px-4 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${isSeniorMode ? 'text-xl' : 'text-sm'}`}>
                            <ShieldCheck size={isSeniorMode ? 24 : 16} /> NGƯỜI QUEN
                        </span>
                    ) : isRisky ? (
                         <span className={`bg-red-600 text-white border-2 border-white px-6 py-2 rounded-full font-black flex items-center gap-2 shadow-lg animate-pulse ${isSeniorMode ? 'text-xl' : 'text-sm'}`}>
                            <ThumbsDown size={isSeniorMode ? 24 : 16} /> CẢNH BÁO TỪ NHÀ MẠNG
                        </span>
                    ) : (
                         <span className={`bg-black/30 text-white border border-white/20 px-4 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                            <Globe size={isSeniorMode ? 20 : 14} /> Cuộc gọi từ số lạ
                        </span>
                    )}
                    
                    {/* Timer Badge */}
                    {status === 'connected' && (
                        <span className="bg-black/40 text-white px-3 py-1.5 rounded-full text-lg font-bold font-mono border border-white/20">
                            {formatDuration(timer)}
                        </span>
                    )}
                </div>

                {/* AVATAR */}
                <div className={`mx-auto bg-white/10 rounded-full p-1 border-2 border-white/30 shadow-2xl mb-4 relative ${isSeniorMode ? 'w-32 h-32' : 'w-24 h-24'}`}>
                     <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                        {isRisky ? <ShieldAlert size={48} className="text-red-500" /> : <User size={48} className="text-slate-400" />}
                     </div>
                     {(status === 'ringing') && (
                         <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
                     )}
                </div>

                {/* NUMBER / NAME */}
                <h2 className={`font-black text-white mb-1 tracking-tight drop-shadow-md truncate max-w-sm mx-auto ${isSeniorMode ? 'text-4xl md:text-5xl leading-tight' : 'text-4xl'}`}>
                    {contactName || call.phoneNumber}
                </h2>
                {!contactName && (
                    <p className={`text-slate-200 font-bold ${isSeniorMode ? 'text-2xl mt-2' : 'text-lg'}`}>
                        {communityInfo?.carrier || "Đang tra cứu nhà mạng..."}
                    </p>
                )}
            </div>

            {/* --- MIDDLE: WARNING BANNER (If Risky) --- */}
            <div className="relative z-10 w-full flex-1 flex items-center justify-center p-4">
                {isRisky && (status === 'ringing' || status === 'connected') && (
                    <div className={`w-full max-w-md bg-red-800/90 backdrop-blur-md rounded-3xl border-2 border-red-400 text-center shadow-2xl animate-in zoom-in duration-300 flex flex-col justify-center ${isSeniorMode ? 'p-8 min-h-[300px]' : 'p-6'}`}>
                        <AlertTriangle size={isSeniorMode ? 80 : 64} className="mx-auto text-white mb-4 animate-bounce" />
                        <h3 className={`${isSeniorMode ? 'text-3xl' : 'text-2xl'} font-black text-white uppercase mb-2 leading-tight`}>
                             {communityInfo?.tags.includes('scam') ? "SỐ LỪA ĐẢO" : "SỐ LÀM PHIỀN"}
                        </h3>
                        <p className={`text-white/90 font-bold mb-4 leading-snug break-words ${isSeniorMode ? 'text-2xl' : 'text-lg'}`}>
                            "{communityInfo?.communityLabel}"
                        </p>
                        <div className={`inline-block bg-black/30 rounded-lg text-white font-mono mx-auto ${isSeniorMode ? 'px-6 py-3 text-lg' : 'px-4 py-2 text-sm'}`}>
                            {communityInfo?.reportCount} người đã báo cáo
                        </div>
                    </div>
                )}
                
                {status === 'auto_ended' && (
                     <div className="bg-red-600 rounded-3xl p-8 shadow-2xl text-center border-4 border-white animate-in zoom-in">
                         <PhoneOff size={48} className="text-white mx-auto mb-4" />
                         <h3 className="text-3xl font-black text-white drop-shadow-md mb-2">ĐÃ NGẮT CUỘC GỌI</h3>
                         <p className="text-white text-lg font-bold">Hệ thống tự động chặn rủi ro.</p>
                     </div>
                )}
                
                {status === 'blocked' && (
                     <div className="bg-slate-700 rounded-3xl p-8 shadow-2xl text-center border-2 border-slate-500">
                         <Ban size={48} className="text-slate-300 mx-auto mb-4" />
                         <h3 className="text-2xl font-black text-white mb-2">ĐÃ CHẶN SỐ</h3>
                     </div>
                )}
            </div>

            {/* --- BOTTOM: ACTIONS --- */}
            <div className="relative z-10 w-full max-w-sm flex justify-around items-center mb-8 flex-shrink-0">
                {status === 'ringing' ? (
                    <>
                        <button onClick={handleBlock} disabled={isProcessing} className="flex flex-col items-center gap-3 group disabled:opacity-50">
                            <div className={`bg-slate-800 border-2 border-slate-600 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-all group-hover:bg-slate-700 ${isSeniorMode ? 'w-20 h-20' : 'w-16 h-16'}`}>
                                <Ban size={isSeniorMode ? 32 : 24} className="text-slate-300 fill-current" />
                            </div>
                            <span className={`text-slate-300 font-bold bg-black/50 px-2 rounded ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>Chặn Số</span>
                        </button>
                        
                        <button onClick={() => handleReject()} disabled={isProcessing} className="flex flex-col items-center gap-3 group disabled:opacity-50">
                            <div className={`bg-red-600 border-2 border-red-400 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-all group-hover:bg-red-500 ${isSeniorMode ? 'w-24 h-24' : 'w-20 h-20'}`}>
                                <PhoneOff size={isSeniorMode ? 40 : 32} className="text-white fill-current" />
                            </div>
                            <span className={`text-white font-bold bg-black/50 px-2 rounded ${isSeniorMode ? 'text-xl' : 'text-base'}`}>Từ chối</span>
                        </button>

                        <button onClick={handleAnswer} disabled={isProcessing} className="flex flex-col items-center gap-3 group disabled:opacity-50">
                            <div className={`bg-green-500 border-2 border-green-400 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-all animate-bounce group-hover:bg-green-400 ${isSeniorMode ? 'w-24 h-24' : 'w-20 h-20'}`}>
                                <Phone size={isSeniorMode ? 40 : 32} className="text-white fill-current" />
                            </div>
                            <span className={`text-white font-bold bg-black/50 px-2 rounded ${isSeniorMode ? 'text-xl' : 'text-base'}`}>Nghe</span>
                        </button>
                    </>
                ) : (status === 'connected') ? (
                     <button onClick={() => handleReject()} disabled={isProcessing} className="flex flex-col items-center gap-3 group disabled:opacity-50">
                        <div className={`bg-red-600 border-2 border-red-400 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-all group-hover:bg-red-500 ${isSeniorMode ? 'w-28 h-28' : 'w-24 h-24'}`}>
                            <PhoneOff size={isSeniorMode ? 48 : 40} className="text-white fill-current" />
                        </div>
                        <span className={`text-white font-bold bg-black/50 px-2 rounded ${isSeniorMode ? 'text-xl' : 'text-base'}`}>Kết thúc</span>
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default CallOverlay;
