
import React, { useState, useRef, useCallback } from 'react';
import { 
  MessageSquareText, Search, Edit, ChevronLeft, Send, 
  ShieldAlert, AlertTriangle, MoreVertical, CheckCircle2, 
  Sparkles, Copy, Trash2, Share2, ArrowRight, ShieldCheck,
  ScanLine
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeMessageRisk } from '../services/aiService';

// Mock Conversation Data
const INITIAL_CONVERSATIONS = [
    {
        id: '1',
        sender: 'Vietcombank',
        preview: 'Tai khoan cua quy khach da bi khoa. Vui long dang nhap...',
        timestamp: '10:45',
        isUnread: true,
        risk: 'scam' as const,
        avatarColor: 'bg-green-600'
    },
    {
        id: '2',
        sender: 'Mẹ Yêu',
        preview: 'Con về ăn cơm chưa? Mẹ nấu món canh chua rồi nè.',
        timestamp: '09:30',
        isUnread: false,
        risk: 'safe' as const,
        avatarColor: 'bg-pink-500'
    },
    {
        id: '3',
        sender: '0909 999 888',
        preview: 'Chuc mung ban da trung thuong xe may SH. Soan tin...',
        timestamp: 'Hôm qua',
        isUnread: true,
        risk: 'suspicious' as const,
        avatarColor: 'bg-slate-500'
    },
    {
        id: '4',
        sender: 'GiaoHangTietKiem',
        preview: 'Don hang DH123 dang duoc giao den ban. Vui long chu y dien thoai.',
        timestamp: 'Hôm qua',
        isUnread: false,
        risk: 'safe' as const,
        avatarColor: 'bg-orange-500'
    },
    // New Suspicious Conversation
    {
        id: '5',
        sender: '0868 123 456',
        preview: 'TB: Quy khach duoc phe duyet khoan vay 50.000.000 VND. Lai suat 0%. L/H Zalo 09xx...',
        timestamp: 'Hôm kia',
        isUnread: true,
        risk: 'suspicious' as const,
        avatarColor: 'bg-purple-600'
    }
];

const MessagesApp: React.FC = () => {
  const { isSeniorMode, user, addMessageAnalysis, clearMessageHistory } = useAuth();
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'scan'>('inbox');
  
  // Detail View State
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Manual Scan State
  const [scanInput, setScanInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<'safe' | 'suspicious' | 'scam' | null>(null);
  const [explanation, setExplanation] = useState('');
  const hasHistory = user?.messageHistory && user.messageHistory.length > 0;

  // --- HANDLERS ---
  const openChat = (id: string) => {
      setActiveChat(id);
      const conv = conversations.find(c => c.id === id);
      // Mock messages for this chat
      setMessages([
          { id: 1, text: conv?.preview || '', isMe: false, time: conv?.timestamp }
      ]);
      
      // Auto-analyze if risky
      if (conv?.risk !== 'safe') {
          handleAnalyze(conv?.preview || '');
      } else {
          setAiAnalysis(null);
      }
  };

  const handleAnalyze = async (text: string) => {
      setAiAnalysis({ loading: true });
      try {
          const result = await analyzeMessageRisk(text);
          setAiAnalysis(result);
          addMessageAnalysis({
              text: text,
              result: result.result,
              explanation: result.explanation
          });
      } catch (e) {
          setAiAnalysis(null);
      }
  };

  const handleSend = () => {
      if (!inputText.trim()) return;
      setMessages(prev => [...prev, {
          id: Date.now(),
          text: inputText,
          isMe: true,
          time: 'Vừa xong'
      }]);
      setInputText('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const analyzeManualMessage = useCallback(async () => {
    if (!scanInput.trim()) return;
    setAnalyzing(true);
    setResult(null);

    try {
      const analysis = await analyzeMessageRisk(scanInput);
      setResult(analysis.result);
      setExplanation(analysis.explanation);

      addMessageAnalysis({
        text: scanInput,
        result: analysis.result,
        explanation: analysis.explanation
      });

    } catch (error) {
      setResult('suspicious');
      setExplanation("Có lỗi xảy ra khi kết nối. Hãy cẩn trọng.");
    } finally {
      setAnalyzing(false);
    }
  }, [scanInput, addMessageAnalysis]);

  const handleShare = useCallback(async () => {
    if (!result) return;
    
    const resultText = result === 'safe' ? 'AN TOÀN' : result === 'scam' ? 'LỪA ĐẢO' : 'CẦN CẢNH GIÁC';
    const shareData = {
        title: 'Cảnh báo từ TruthShield AI',
        text: `[Kiểm tra tin nhắn]\nKết quả: ${resultText}\n\nĐánh giá: ${explanation}\n\nNội dung gốc: "${scanInput}"`,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareData.text);
            alert('Đã sao chép thông tin cảnh báo vào bộ nhớ tạm!');
        } catch (e) {
            alert('Không thể chia sẻ nội dung này.');
        }
    }
  }, [result, explanation, scanInput]);

   const getResultColor = (res: 'safe' | 'suspicious' | 'scam') => {
      switch(res) {
          case 'safe': return 'text-green-600 bg-green-50 border-green-200';
          case 'scam': return 'text-red-600 bg-red-50 border-red-200';
          default: return 'text-amber-600 bg-amber-50 border-amber-200';
      }
  };

  // --- RENDER LIST & SCAN ---
  if (!activeChat) {
      return (
        <div className={`h-full flex flex-col bg-white animate-in fade-in duration-300 pt-safe md:pt-4 max-w-3xl mx-auto w-full shadow-sm`}>
            
            {/* App Header with Tabs */}
            <div className="px-6 py-4 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-3xl text-slate-900">Tin Nhắn</h2>
                    {activeTab === 'inbox' && (
                        <button className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-blue-600">
                            <Edit size={20} />
                        </button>
                    )}
                </div>
                
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('inbox')}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <MessageSquareText size={16} /> Hộp Thư
                    </button>
                    <button 
                        onClick={() => setActiveTab('scan')}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'scan' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <ScanLine size={16} /> Scan (Quét AI)
                    </button>
                </div>
            </div>

            {activeTab === 'inbox' ? (
                /* INBOX VIEW */
                <>
                    {/* Search */}
                    <div className="px-6 mb-4 mt-2">
                        <div className="bg-slate-100 rounded-xl flex items-center px-4 py-3">
                            <Search size={18} className="text-slate-400 mr-2" />
                            <input className="bg-transparent outline-none w-full font-bold text-slate-700 placeholder-slate-400" placeholder="Tìm kiếm tin nhắn" />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto pb-20">
                        {conversations.map(conv => (
                            <div 
                                key={conv.id} 
                                onClick={() => openChat(conv.id)}
                                className={`flex gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 ${conv.isUnread ? 'bg-blue-50/30' : ''}`}
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 relative ${conv.avatarColor}`}>
                                    {conv.sender.charAt(0)}
                                    {conv.risk === 'scam' && (
                                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                                            <ShieldAlert size={16} className="text-red-600 fill-red-100" />
                                        </div>
                                    )}
                                    {conv.risk === 'suspicious' && (
                                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                                            <AlertTriangle size={16} className="text-amber-600 fill-amber-100" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className={`font-bold truncate text-slate-900 ${isSeniorMode ? 'text-xl' : 'text-base'}`}>{conv.sender}</h4>
                                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">{conv.timestamp}</span>
                                    </div>
                                    <p className={`truncate ${conv.isUnread ? 'font-bold text-slate-800' : 'text-slate-500'} ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                                        {conv.preview}
                                    </p>
                                </div>
                                {conv.isUnread && (
                                    <div className="self-center">
                                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                /* SCANNER VIEW - Message Guard Integration */
                <div className="flex-1 overflow-y-auto pb-20 p-6 bg-slate-50/50">
                    <div className="mb-4">
                        <h3 className={`font-bold text-slate-900 ${isSeniorMode ? 'text-2xl' : 'text-xl'}`}>Kiểm tra tin nhắn nghi ngờ</h3>
                        <p className={`text-slate-600 font-medium mt-1 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                            {isSeniorMode ? 'Bác dán hoặc nhập tin nhắn lạ vào ô bên dưới:' : 'Dán nội dung tin nhắn vào bên dưới để hệ thống AI kiểm tra.'}
                        </p>
                    </div>
                    
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                        <textarea 
                            className={`w-full bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none resize-none p-4 rounded-xl border focus:border-purple-400 transition-colors ${
                                isSeniorMode ? 'text-2xl h-48 border-slate-300 font-medium' : 'text-base h-40 border-slate-200'
                            }`}
                            placeholder={isSeniorMode ? "Ví dụ: Con đang cấp cứu, chuyển tiền gấp..." : "Ví dụ: 'Con đang cấp cứu, chuyển tiền gấp vào số này...'"}
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                        ></textarea>
                        
                        <div className="p-4 flex gap-3 border-t border-slate-100 bg-white">
                             <button 
                                 onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        setScanInput(text);
                                    } catch (e) {
                                        alert("Không thể truy cập bộ nhớ tạm. Vui lòng dán thủ công.");
                                    }
                                 }}
                                 className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
                             >
                                 <Copy size={20} />
                             </button>
                             <button 
                                 onClick={analyzeManualMessage}
                                 disabled={analyzing || !scanInput}
                                 className={`flex-1 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                                     analyzing ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
                                 } ${isSeniorMode ? 'text-xl' : 'text-base'}`}
                             >
                                 {analyzing ? <Sparkles size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
                                 {analyzing ? 'Đang kiểm tra...' : 'KIỂM TRA NGAY'}
                             </button>
                        </div>
                    </div>

                    {result && (
                      <div className={`rounded-3xl p-6 border-2 shadow-sm mb-6 ${
                        result === 'safe' ? 'bg-green-50 border-green-200' : 
                        result === 'scam' ? 'bg-red-50 border-red-200' : 
                        'bg-amber-50 border-amber-200'
                      }`}>
                         <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    {result === 'safe' && <CheckCircle2 className="text-green-600 fill-green-100" size={isSeniorMode ? 48 : 32} />}
                                    {result === 'scam' && <ShieldAlert className="text-red-600 fill-red-100" size={isSeniorMode ? 48 : 32} />}
                                    {result === 'suspicious' && <AlertTriangle className="text-amber-600 fill-amber-100" size={isSeniorMode ? 48 : 32} />}
                                </div>
                                
                                <div>
                                    <h3 className={`font-black uppercase tracking-wide ${
                                        result === 'safe' ? 'text-green-700' : 
                                        result === 'scam' ? 'text-red-700' : 'text-amber-700'
                                    } ${isSeniorMode ? 'text-2xl' : 'text-xl'}`}>
                                        {result === 'safe' ? 'An Toàn' : result === 'scam' ? 'LỪA ĐẢO' : 'Cần Cảnh Giác'}
                                    </h3>
                                    <p className={`text-slate-700 font-medium mt-1 ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                                        {explanation}
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={handleShare}
                                className={`w-full mt-4 flex items-center justify-center gap-2 font-bold transition-all border-2 active:scale-95 ${
                                    result === 'safe' ? 'bg-white border-green-200 text-green-700 hover:bg-green-100' :
                                    result === 'scam' ? 'bg-white border-red-200 text-red-700 hover:bg-red-100' :
                                    'bg-white border-amber-200 text-amber-700 hover:bg-amber-100'
                                } ${isSeniorMode ? 'px-6 py-4 text-xl rounded-xl' : 'px-4 py-2 rounded-lg text-sm'}`}
                            >
                                <Share2 size={isSeniorMode ? 24 : 18} />
                                Chia sẻ cảnh báo
                            </button>
                         </div>
                      </div>
                    )}

                    {/* HISTORY LIST */}
                    {hasHistory && (
                        <div className="mt-8 border-t border-slate-200 pt-6">
                            <h3 className={`font-bold text-slate-500 uppercase text-xs tracking-wider mb-4 flex items-center gap-2`}>
                                Lịch sử quét gần đây
                            </h3>
                            <div className="space-y-3">
                                {user.messageHistory.map((item) => (
                                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getResultColor(item.result)}`}>
                                                {item.result}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm line-clamp-2 italic mb-1">"{item.text}"</p>
                                        <p className="text-slate-800 text-xs font-bold">➔ {item.explanation}</p>
                                    </div>
                                ))}
                                <button 
                                    onClick={clearMessageHistory}
                                    className="w-full py-3 text-slate-400 text-sm font-bold hover:text-red-500 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={14} /> Xóa lịch sử
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      );
  }
  
  // RENDER DETAIL CHAT
  return (
    <div className={`h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 pt-safe md:pt-4 max-w-3xl mx-auto w-full`}>
         {/* Detail view implementation - already present in logic but usually rendered here */}
         <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10">
             <button onClick={() => setActiveChat(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                 <ChevronLeft size={24} />
             </button>
             <div className="flex-1">
                 <h3 className="font-bold text-slate-900 text-lg">{conversations.find(c => c.id === activeChat)?.sender}</h3>
             </div>
             <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                 <MoreVertical size={20} />
             </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
             {/* Render Messages */}
             {messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                         msg.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                     }`}>
                         <p className={isSeniorMode ? 'text-lg' : 'text-sm'}>{msg.text}</p>
                         <p className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-blue-200' : 'text-slate-400'}`}>{msg.time}</p>
                     </div>
                 </div>
             ))}
             
             {/* AI Analysis Result In-Chat */}
             {aiAnalysis && !aiAnalysis.loading && (
                 <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                     <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border-l-4 ${
                         aiAnalysis.result === 'scam' ? 'bg-red-50 border-red-500' :
                         aiAnalysis.result === 'suspicious' ? 'bg-amber-50 border-amber-500' : 'bg-green-50 border-green-500'
                     }`}>
                         <div className="flex items-center gap-2 mb-1">
                             <Sparkles size={16} className={
                                 aiAnalysis.result === 'scam' ? 'text-red-600' :
                                 aiAnalysis.result === 'suspicious' ? 'text-amber-600' : 'text-green-600'
                             } />
                             <span className="font-bold text-xs uppercase text-slate-500">Phân tích an ninh</span>
                         </div>
                         <p className={`font-bold ${
                              aiAnalysis.result === 'scam' ? 'text-red-700' :
                              aiAnalysis.result === 'suspicious' ? 'text-amber-700' : 'text-green-700'
                         }`}>
                             {aiAnalysis.result === 'scam' ? 'CẢNH BÁO LỪA ĐẢO' :
                              aiAnalysis.result === 'suspicious' ? 'CẦN CẢNH GIÁC' : 'AN TOÀN'}
                         </p>
                         <p className="text-sm text-slate-700 mt-1">{aiAnalysis.explanation}</p>
                     </div>
                 </div>
             )}
             
             <div ref={messagesEndRef} />
         </div>

         <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 pb-safe md:pb-3">
             <button 
                onClick={() => {
                     const lastReceived = [...messages].reverse().find(m => !m.isMe);
                     if (lastReceived) {
                         handleAnalyze(lastReceived.text);
                     } else {
                         alert("Không tìm thấy tin nhắn nào để quét.");
                     }
                }}
                className="p-3 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 active:scale-95 transition-all"
                title="Quét tin nhắn cuối cùng"
             >
                 <ShieldCheck size={20} />
             </button>

             <input 
                 className="flex-1 bg-slate-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                 placeholder="Nhập tin nhắn..."
                 value={inputText}
                 onChange={e => setInputText(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleSend()}
             />
             <button 
                 onClick={handleSend}
                 disabled={!inputText.trim()}
                 className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all"
             >
                 <Send size={20} className="ml-0.5" />
             </button>
         </div>
    </div>
  );
};

export default MessagesApp;
