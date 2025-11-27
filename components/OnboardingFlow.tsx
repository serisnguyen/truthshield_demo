
import React, { useState, useRef, useEffect } from 'react';
import { Shield, Mic, CheckCircle2, ChevronRight, Smartphone, Users, Bell, Loader2, Play, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveVoiceProfile } from '../services/storageService';

const OnboardingFlow: React.FC = () => {
  const { login, completeOnboarding, setVoiceProfileStatus, syncContacts } = useAuth();
  const [step, setStep] = useState<1|2|3>(1);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- STEP 1: LOGIN ---
  const handleLogin = async () => {
      if(phone.length < 9) return;
      setIsLoading(true);
      await login(phone);
      setIsLoading(false);
      setStep(2);
  };

  // --- STEP 2: VOICE RECORDING ---
  const [recordingStatus, setRecordingStatus] = useState<'idle'|'recording'|'success'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
      let interval: any;
      if (recordingStatus === 'recording') {
          interval = setInterval(() => {
              setRecordingTime(t => {
                  if(t >= 5) { // Demo: 5 seconds enough
                      handleStopRecording();
                      return 5;
                  }
                  return t + 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [recordingStatus]);

  const handleStartRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              await saveVoiceProfile('my_voice_dna', audioBlob);
              setVoiceProfileStatus(true);
              setRecordingStatus('success');
              stream.getTracks().forEach(t => t.stop());
          };

          mediaRecorder.start();
          setRecordingStatus('recording');
          setRecordingTime(0);
      } catch (e) {
          alert("Vui lòng cấp quyền Micro để sử dụng tính năng này.");
      }
  };

  const handleStopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
      }
  };

  // --- STEP 3: PERMISSIONS ---
  const [permContact, setPermContact] = useState<'pending'|'granted'|'denied'>('pending');
  const [isSyncing, setIsSyncing] = useState(false);

  const requestContacts = async () => {
      setIsSyncing(true);
      await syncContacts(); // This mocks the sync process
      setPermContact('granted');
      setIsSyncing(false);
  };

  const handleFinish = () => {
      completeOnboarding();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
       {/* Progress Bar */}
       <div className="h-1.5 bg-slate-100 w-full">
           <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(step/3)*100}%` }}></div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-md mx-auto w-full">
           
           {/* --- STEP 1: PHONE LOGIN --- */}
           {step === 1 && (
               <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
                   <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 mb-8 mx-auto">
                       <Shield size={40} className="text-white" />
                   </div>
                   <h1 className="text-3xl font-black text-slate-900 text-center mb-2">Chào mừng đến<br/>TruthShield AI</h1>
                   <p className="text-slate-500 text-center mb-10">Bảo vệ bạn và gia đình khỏi lừa đảo công nghệ cao.</p>

                   <div className="space-y-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase ml-1">Số điện thoại</label>
                           <input 
                               type="tel"
                               value={phone}
                               onChange={(e) => setPhone(e.target.value)}
                               placeholder="0912..."
                               className="w-full text-2xl font-bold p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-center tracking-widest"
                               autoFocus
                           />
                       </div>
                       <button 
                           onClick={handleLogin}
                           disabled={phone.length < 9 || isLoading}
                           className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                           {isLoading ? <Loader2 className="animate-spin" /> : 'Tiếp Tục'} <ChevronRight />
                       </button>
                   </div>
                   <p className="text-xs text-slate-400 text-center mt-6">
                       Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng.
                   </p>
               </div>
           )}

           {/* --- STEP 2: VOICE DNA --- */}
           {step === 2 && (
               <div className="w-full text-center animate-in fade-in slide-in-from-right-8 duration-500">
                   <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                       <Mic size={40} className="text-purple-600" />
                       {recordingStatus === 'recording' && (
                           <div className="absolute inset-0 border-4 border-purple-400 rounded-full animate-ping opacity-20"></div>
                       )}
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 mb-2">Tạo Voice DNA</h2>
                   <p className="text-slate-500 mb-8 text-sm px-4">
                       Hãy đọc câu dưới đây để tạo "chữ ký giọng nói". AI sẽ dùng nó để xác minh danh tính của bạn khi gọi cho người thân.
                   </p>

                   <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl mb-8">
                       <p className="text-xl font-bold text-slate-800">
                           "Tôi xác nhận đây là giọng nói thật của tôi, dùng để bảo vệ an ninh."
                       </p>
                   </div>

                   {recordingStatus === 'idle' && (
                       <button onClick={handleStartRecording} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-200 active:scale-95 flex items-center justify-center gap-2">
                           <Mic size={20} /> Bắt Đầu Ghi Âm
                       </button>
                   )}

                   {recordingStatus === 'recording' && (
                       <button onClick={handleStopRecording} className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-200 active:scale-95 flex items-center justify-center gap-2">
                           <Square size={20} fill="currentColor" /> Dừng ({recordingTime}s)
                       </button>
                   )}

                   {recordingStatus === 'success' && (
                       <div className="space-y-4">
                           <div className="flex items-center justify-center gap-2 text-green-600 font-bold bg-green-50 p-3 rounded-xl">
                               <CheckCircle2 /> Đã lưu Voice DNA
                           </div>
                           <button onClick={() => setStep(3)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg active:scale-95">
                               Tiếp Theo
                           </button>
                       </div>
                   )}
               </div>
           )}

           {/* --- STEP 3: PERMISSIONS --- */}
           {step === 3 && (
               <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
                   <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">Cấp Quyền Bảo Vệ</h2>
                   <p className="text-slate-500 mb-8 text-center text-sm">
                       Để AI hoạt động tự động khi có cuộc gọi, vui lòng cấp các quyền sau:
                   </p>

                   <div className="space-y-4 mb-8">
                       <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                           <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users size={24} /></div>
                           <div className="flex-1">
                               <h3 className="font-bold text-slate-900">Danh Bạ</h3>
                               <p className="text-xs text-slate-500">Để nhận diện người quen/người lạ.</p>
                           </div>
                           {permContact === 'granted' ? (
                               <CheckCircle2 className="text-green-500" />
                           ) : (
                               <button 
                                   onClick={requestContacts} 
                                   disabled={isSyncing}
                                   className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold"
                               >
                                   {isSyncing ? <Loader2 className="animate-spin" size={16} /> : 'Cho phép'}
                               </button>
                           )}
                       </div>

                       <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm opacity-50">
                           <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Mic size={24} /></div>
                           <div className="flex-1">
                               <h3 className="font-bold text-slate-900">Microphone</h3>
                               <p className="text-xs text-slate-500">Đã cấp ở bước trước.</p>
                           </div>
                           <CheckCircle2 className="text-green-500" />
                       </div>
                       
                        <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm opacity-50">
                           <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Bell size={24} /></div>
                           <div className="flex-1">
                               <h3 className="font-bold text-slate-900">Thông báo</h3>
                               <p className="text-xs text-slate-500">Để gửi cảnh báo khẩn cấp.</p>
                           </div>
                           <CheckCircle2 className="text-green-500" />
                       </div>
                   </div>

                   <button 
                       onClick={handleFinish}
                       className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                       Hoàn Tất Cài Đặt
                   </button>
                   
                   {permContact !== 'granted' && (
                        <button onClick={handleFinish} className="w-full mt-4 text-slate-400 font-bold text-sm">
                            Bỏ qua (Nhập tay sau)
                        </button>
                   )}
               </div>
           )}
       </div>
    </div>
  );
};

export default OnboardingFlow;
