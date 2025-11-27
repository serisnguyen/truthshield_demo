
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShieldAlert, Loader2, MapPin } from 'lucide-react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { useAuth } from '../context/AuthContext';
import { sanitizeInput } from '../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isWarning?: boolean;
  isStreaming?: boolean;
  groundingMetadata?: any; // To store map data
}

const ChatScreen: React.FC = () => {
  const { user, role, isSeniorMode } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize Chat Session
  useEffect(() => {
    const initChat = () => {
      try {
          // Fallback if no key provided in environment
          const apiKey = process.env.API_KEY || "";
          
          if (apiKey) {
            const ai = new GoogleGenAI({ apiKey });
            const userName = user ? user.name : (role === 'elder' ? "Bác/Cô/Chú" : "Bạn");
            
            // Customize Instruction based on Role
            const systemInstruction = role === 'elder' 
                ? `Bạn là trợ lý an ninh TruthShield. Tên người dùng: ${userName}.
                   Hãy trả lời ngắn gọn, dễ hiểu cho người cao tuổi.
                   Nhiệm vụ: Phân tích lừa đảo, đưa ra lời khuyên bảo mật, và tìm vị trí (đồn công an, bệnh viện) nếu được hỏi.`
                : `Bạn là trợ lý an ninh TruthShield chuyên sâu. Tên người dùng: ${userName}.
                   Bạn đang hỗ trợ người quản lý (con cái/người thân) bảo vệ gia đình.
                   Nhiệm vụ: Cung cấp kiến thức bảo mật chuyên sâu, cách xử lý sự cố khi cha mẹ gặp lừa đảo, giải thích các thủ đoạn công nghệ cao, và tìm kiếm địa điểm an toàn gần đây.`;

            chatSessionRef.current = ai.chats.create({
                model: "gemini-2.5-flash",
                config: { 
                  systemInstruction,
                  tools: [{ googleMaps: {} }], // ENABLE MAPS GROUNDING
                },
            });
          } else {
            console.warn("Chat initialized in offline mode (No API Key)");
          }

          // Set initial greeting based on Role
          const greeting = role === 'elder'
            ? `Xin chào ${user ? user.name : "Bác"}! Cháu là trợ lý an ninh. Bác có tin nhắn lạ hay cần tìm đường đến đồn công an không ạ?`
            : `Chào ${user ? user.name : "bạn"}! Tôi là trợ lý an ninh gia đình. Tôi có thể giúp gì để bảo vệ người thân của bạn hôm nay?`;

          setMessages([{ 
            id: 'init', 
            role: 'model', 
            text: greeting,
            isWarning: false
          }]);

      } catch (error) {
          console.error("Chat initialization failed", error);
          setMessages([{ 
            id: 'err-init', 
            role: 'model', 
            text: "Hệ thống đang bảo trì. Vui lòng thử lại sau.", 
            isWarning: true
          }]);
      }
    };

    initChat();

    // Cleanup function
    return () => {
        chatSessionRef.current = null;
    };
  }, [user, role]);

  const handleSend = async (textInput?: string) => {
    const rawText = textInput || input;
    if (!rawText.trim()) return;

    const safeText = sanitizeInput(rawText);

    const userMsgId = Date.now().toString();
    const userMsg: Message = { id: userMsgId, role: 'user', text: safeText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
         // Simulate response if no API key / session
         setTimeout(() => {
             setMessages(prev => [...prev, {
                 id: 'mock-' + Date.now(),
                 role: 'model',
                 text: role === 'elder' 
                    ? "Chế độ Offline: Cháu chưa kết nối được với máy chủ. Nhưng nếu bác thấy tin nhắn yêu cầu chuyển tiền, hãy gọi điện trực tiếp cho người thân để kiểm tra nhé!"
                    : "Chế độ Offline: Không thể kết nối AI. Vui lòng kiểm tra lại các thiết bị kết nối thủ công.",
                 isWarning: true
             }]);
             setIsLoading(false);
         }, 1000);
         return;
      }

      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { 
        id: modelMsgId, 
        role: 'model', 
        text: '', 
        isStreaming: true 
      }]);

      const result = await chatSessionRef.current.sendMessageStream({
        message: safeText
      });

      let fullText = '';
      let groundingMetadata: any = null;
      
      for await (const chunk of result) {
        const chunkText = (chunk as GenerateContentResponse).text || '';
        fullText += chunkText;

        // Check for Maps Grounding Metadata in the chunk
        if (chunk.candidates?.[0]?.groundingMetadata) {
            groundingMetadata = chunk.candidates[0].groundingMetadata;
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === modelMsgId 
            ? { 
                ...msg, 
                text: fullText,
                isWarning: /lừa đảo|cảnh báo|nguy hiểm|tuyệt đối không|chặn số|công an giả/i.test(fullText),
                groundingMetadata: groundingMetadata || msg.groundingMetadata
              } 
            : msg
        ));
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
      ));

    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { 
        id: 'err-' + Date.now(), 
        role: 'model', 
        text: "Mạng đang yếu. Vui lòng kiểm tra lại kết nối.", 
        isWarning: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const SuggestionButton = ({ text }: { text: string }) => (
    <button 
      onClick={() => handleSend(text)}
      disabled={isLoading}
      className={`flex-shrink-0 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-xl text-slate-700 font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap ${
        isSeniorMode ? 'px-6 py-3 text-lg' : 'px-4 py-2 text-sm'
      }`}
    >
      {text}
    </button>
  );

  return (
    <div className={`h-full flex flex-col bg-[#F8FAFC] relative ${isSeniorMode ? 'text-lg' : ''}`}>
      {/* Sticky Header */}
      <div className={`pt-20 md:pt-6 px-4 pb-3 border-b border-slate-200 bg-white/95 backdrop-blur-sm z-10 flex items-center gap-3 shadow-sm sticky top-0 ${isSeniorMode ? 'h-28' : ''}`}>
         <div className={`rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200 shadow-inner relative flex-shrink-0 ${isSeniorMode ? 'w-16 h-16' : 'w-10 h-10 md:w-12 md:h-12'}`}>
            <Bot size={isSeniorMode ? 32 : 24} className="text-blue-600" />
            <div className="absolute -bottom-0.5 -right-0.5 bg-white p-0.5 rounded-full">
               <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
            </div>
         </div>
         <div>
           <h2 className={`text-slate-900 font-bold ${isSeniorMode ? 'text-2xl' : 'text-lg md:text-xl'}`}>Trợ Lý An Ninh</h2>
           <p className={`text-slate-500 font-medium ${isSeniorMode ? 'text-base' : 'text-xs'}`}>Hỏi đáp & Tìm kiếm (Maps)</p>
         </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 pb-40 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
            
            {/* Avatar */}
            <div className={`rounded-full flex-shrink-0 flex items-center justify-center shadow-sm border-2 ${
              isSeniorMode ? 'w-12 h-12' : 'w-8 h-8 md:w-10 md:h-10'
            } ${
              msg.role === 'user' 
                ? 'bg-white border-slate-200' 
                : (msg.isWarning ? 'bg-red-100 border-red-200' : 'bg-blue-100 border-blue-200')
            }`}>
              {msg.role === 'user' 
                ? <User size={isSeniorMode ? 28 : 18} className="text-slate-700" /> 
                : <Bot size={isSeniorMode ? 28 : 18} className={msg.isWarning ? 'text-red-600' : 'text-blue-600'} />
              }
            </div>
            
            {/* Bubble */}
            <div className={`max-w-[85%] rounded-2xl leading-relaxed shadow-sm flex flex-col gap-2 ${
              isSeniorMode ? 'p-6 text-xl' : 'p-4 text-base'
            } ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : msg.isWarning 
                  ? 'bg-red-50 border-l-4 border-red-500 text-slate-900 rounded-tl-none ring-1 ring-red-100' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              {msg.isWarning && (
                <div className={`flex items-center gap-1.5 font-bold text-red-700 mb-1 uppercase tracking-wide border-b border-red-200 pb-1 ${isSeniorMode ? 'text-base' : 'text-xs'}`}>
                  <ShieldAlert size={isSeniorMode ? 20 : 14}/> Cảnh báo
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{msg.text}</div>
              
              {/* Display Map Grounding Sources if available */}
              {msg.groundingMetadata?.groundingChunks && (
                 <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase">
                        <MapPin size={12} /> Nguồn bản đồ Google
                    </div>
                    <div className="flex flex-col gap-2">
                        {msg.groundingMetadata.groundingChunks.map((chunk: any, idx: number) => {
                            if (chunk.web?.uri) {
                                return (
                                    <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center gap-2 transition-colors">
                                        <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center border border-slate-100 shadow-sm text-blue-600 font-bold text-xs flex-shrink-0">
                                            Map
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-blue-600 truncate">{chunk.web.title || "Vị trí trên bản đồ"}</div>
                                            <div className="text-xs text-slate-400 truncate">{chunk.web.uri}</div>
                                        </div>
                                    </a>
                                )
                            }
                            return null;
                        })}
                    </div>
                 </div>
              )}

              {msg.isStreaming && (
                 <span className="inline-block w-2 h-4 ml-1 bg-current opacity-50 animate-pulse align-middle">|</span>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                 <Loader2 size={16} className="text-blue-400 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center shadow-sm">
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Suggestions & Input */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 ${isSeniorMode ? 'p-4 pb-24' : 'p-3 pb-20 md:pb-4'}`}>
        
        {/* Quick Prompts - Horizontal Scroll */}
        {!isLoading && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar px-1">
             <SuggestionButton text={role === 'elder' ? "Đồn công an gần đây?" : "Thủ đoạn lừa đảo mới"} />
             <SuggestionButton text={role === 'elder' ? "Công an gọi đòi tiền?" : "Tìm bệnh viện gần nhất"} />
             <SuggestionButton text={role === 'elder' ? "Link lạ?" : "Cách chặn số rác"} />
             <SuggestionButton text="Kiểm tra tin nhắn" />
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isSeniorMode ? "Bác nhập câu hỏi vào đây..." : "Hỏi về lừa đảo hoặc tìm địa điểm..."}
            disabled={isLoading}
            className={`flex-1 bg-slate-100 text-slate-900 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-slate-300 focus:border-blue-500 transition-all placeholder:text-slate-500 disabled:opacity-60 disabled:bg-slate-50 shadow-inner ${
                isSeniorMode ? 'py-5 text-xl pl-6 pr-16' : 'py-3.5 pl-5 pr-12 text-base'
            }`}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`absolute aspect-square rounded-full flex items-center justify-center text-white transition-all shadow-sm active:scale-90 ${
              isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } ${isSeniorMode ? 'right-2 top-2 bottom-2 w-12' : 'right-1.5 top-1.5 bottom-1.5 w-10'}`}
          >
            {isLoading ? <Loader2 size={isSeniorMode ? 24 : 20} className="animate-spin" /> : <Send size={isSeniorMode ? 24 : 20} className="ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
