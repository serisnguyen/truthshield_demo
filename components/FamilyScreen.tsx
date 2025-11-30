
import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, Wifi, Link, CheckCircle2, Copy, Trash2, PhoneOff, RefreshCw, AlertOctagon, Clock, Loader2, WifiOff, KeyRound, Mic, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VoiceSetupModal from './VoiceSetupModal';

interface FamilyMember {
  id: string;
  name: string;
  status: 'safe' | 'pending' | 'disconnected';
  device: string;
  connection: string;
}

const FamilyScreen: React.FC = () => {
  const { user, role, addEmergencyContact, removeEmergencyContact, regenerateFamilyId, isSeniorMode } = useAuth();
  
  // State for adding contacts/parents
  const [inputCode, setInputCode] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  // Family Code Timer Logic (For Elders)
  const CODE_DURATION = 60; // Set to 1 minute as requested
  const [timeLeft, setTimeLeft] = useState(CODE_DURATION);
  
  // Local state for demo if user not logged in
  const [localDemoId, setLocalDemoId] = useState("123456");
  const [localDemoTimestamp, setLocalDemoTimestamp] = useState(Date.now());

  const displayId = user?.familyId || localDemoId;
  const displayTimestamp = user?.familyCodeTimestamp || localDemoTimestamp;

  useEffect(() => {
    if (role === 'elder') {
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - displayTimestamp) / 1000);
            const remaining = Math.max(0, CODE_DURATION - elapsed);
            setTimeLeft(remaining);
            
            if (remaining === 0) {
                 if (user) regenerateFamilyId();
                 else {
                     setLocalDemoId(Math.floor(100000 + Math.random() * 900000).toString());
                     setLocalDemoTimestamp(Date.now());
                 }
            }
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [user, role, regenerateFamilyId, displayTimestamp]);

  const handleManualRefresh = () => {
      if (user) regenerateFamilyId();
      else {
           setLocalDemoId(Math.floor(100000 + Math.random() * 900000).toString());
           setLocalDemoTimestamp(Date.now());
      }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayId);
    } catch (err) {}
  };

  const handleConnectParent = () => {
      if(!inputCode) return;
      
      // Use a fixed Mock ID representing the Elder device for demo purposes.
      const MOCK_ELDER_ID = "123456"; 
      
      setIsConnecting(true);
      
      setTimeout(() => {
          setIsConnecting(false);
          // Strictly check logic and allow only exact match against the target device ID
          if (inputCode === MOCK_ELDER_ID) { 
             setInputCode('');
             alert("Kết nối thành công với thiết bị Ba/Mẹ (Mock)!");
          } else {
             alert("Mã kết nối không đúng. Vui lòng thử lại.");
          }
      }, 1500);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if(newContactName && newContactPhone) {
        addEmergencyContact({ name: newContactName, phone: newContactPhone });
        setNewContactName('');
        setNewContactPhone('');
        setShowAddContact(false);
    }
  };

  const handleRemoveContact = (id: string, name: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi danh sách SOS không?`)) {
          removeEmergencyContact(id);
      }
  };

  const formatCode = (code: string) => code ? code.match(/.{1,3}/g)?.join(' ') || code : "...";
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  // --- ELDER VIEW: SHOW CODE ---
  if (role === 'elder') {
      return (
        <div className="p-4 pt-6 pb-32 min-h-screen bg-slate-50 flex flex-col items-center animate-in fade-in">
             <div className="w-full max-w-md text-center mb-8">
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">Mã Kết Nối Của Bác</h2>
                 <p className="text-slate-500 text-lg">Đọc mã số này hoặc đưa mã QR cho con/cháu để kết nối.</p>
             </div>

             <div className="w-full max-w-md bg-white rounded-3xl border-4 border-slate-200 p-8 text-center shadow-lg mb-8 relative overflow-hidden">
                 <div className="text-6xl font-black text-slate-800 tracking-wider mb-6 font-mono">
                     {formatCode(displayId)}
                 </div>

                 {/* QR Code Section */}
                 <div className="flex justify-center mb-6">
                    <div className="p-3 bg-white rounded-xl border-2 border-slate-100 shadow-sm">
                        <img 
                            key={displayId} /* Force refresh image when ID changes */
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${displayId}&color=0f172a`} 
                            alt="Family Code QR" 
                            className="w-40 h-40 rounded-lg"
                        />
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-center gap-2 text-slate-500 font-bold bg-slate-100 py-2 rounded-xl mb-6">
                     <Clock size={20} /> Đổi sau: {formatTime(timeLeft)}
                 </div>

                 <div className="flex gap-4">
                     <button onClick={handleCopy} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                         <Copy /> Sao Chép
                     </button>
                     <button onClick={handleManualRefresh} className="w-16 bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center active:scale-95">
                         <RefreshCw size={24} />
                     </button>
                 </div>
             </div>

             <div className="w-full max-w-md">
                 <h3 className="font-bold text-slate-700 text-xl mb-4 flex items-center gap-2"><Smartphone /> Thiết bị đã kết nối</h3>
                 <div className="space-y-3">
                     {user?.emergencyContacts && user.emergencyContacts.length > 0 ? (
                         user.emergencyContacts.map(contact => (
                             <div key={contact.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600"><CheckCircle2 /></div>
                                 <div>
                                     <h4 className="font-bold text-lg text-slate-800">{contact.name}</h4>
                                     <p className="text-slate-500">Đã kết nối an toàn</p>
                                 </div>
                             </div>
                         ))
                     ) : (
                         <div className="text-center p-6 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300">
                             <p className="text-slate-500 font-medium">Chưa có thiết bị kết nối.</p>
                             <p className="text-sm text-slate-400">Hãy nhờ con cái nhập Mã Kết Nối ở trên.</p>
                         </div>
                     )}
                 </div>
             </div>
        </div>
      );
  }

  // --- RELATIVE VIEW: MANAGE & CONNECT ---
  return (
    <div className={`p-6 pt-24 md:pt-10 pb-20 max-w-4xl mx-auto animate-in fade-in ${isSeniorMode ? 'text-lg' : ''}`}>
        <h2 className={`${isSeniorMode ? 'text-4xl' : 'text-3xl'} font-bold text-slate-900 mb-6`}>Quản Lý Gia Đình</h2>

        {/* FAMILY VOICE REMINDER */}
        {(!user?.familyVoiceProfiles || user.familyVoiceProfiles.length === 0) && (
            <div 
                onClick={() => setShowVoiceModal(true)}
                className={`bg-indigo-50 border border-indigo-200 rounded-2xl mb-8 flex items-center gap-4 cursor-pointer hover:bg-indigo-100 transition-colors ${isSeniorMode ? 'p-6' : 'p-5'}`}
            >
                <div className={`bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0 ${isSeniorMode ? 'w-16 h-16' : 'w-12 h-12'}`}>
                    <Mic size={isSeniorMode ? 32 : 24} />
                </div>
                <div className="flex-1">
                    <h3 className={`font-bold text-slate-800 ${isSeniorMode ? 'text-xl' : 'text-lg'}`}>Chưa có Voice DNA Người thân?</h3>
                    <p className={`text-slate-600 ${isSeniorMode ? 'text-base' : 'text-sm'}`}>Thêm giọng nói của bạn hoặc anh/chị em để giúp Ba Mẹ nhận diện cuộc gọi giả mạo.</p>
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent double trigger
                        setShowVoiceModal(true);
                    }}
                    className={`bg-indigo-600 text-white rounded-lg font-bold whitespace-nowrap ${isSeniorMode ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'}`}
                >
                    Thêm ngay
                </button>
            </div>
        )}

        {/* Connect New Device */}
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 ${isSeniorMode ? 'p-8' : 'p-6'}`}>
            <h3 className={`font-bold text-slate-800 mb-4 flex items-center gap-2 ${isSeniorMode ? 'text-xl' : 'text-lg'}`}>
                <Link size={isSeniorMode ? 24 : 20} className="text-blue-600" /> Kết nối thiết bị Cha/Mẹ
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
                <input 
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Nhập mã 6 số từ máy Cha/Mẹ"
                    className={`flex-1 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none ${isSeniorMode ? 'p-6 text-2xl' : 'p-4 text-lg'}`}
                    maxLength={6}
                />
                <button 
                    onClick={handleConnectParent}
                    disabled={isConnecting || inputCode.length < 6}
                    className={`bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${isSeniorMode ? 'px-10 py-6 text-xl' : 'px-8 py-4'}`}
                >
                    {isConnecting ? <Loader2 className="animate-spin" /> : <UserPlus size={isSeniorMode ? 24 : 20} />}
                    Kết Nối
                </button>
            </div>
        </div>

        {/* SOS Contacts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className={`border-b border-slate-100 flex justify-between items-center ${isSeniorMode ? 'p-8' : 'p-6'}`}>
                 <h3 className={`font-bold text-slate-800 ${isSeniorMode ? 'text-xl' : 'text-lg'}`}>Danh bạ SOS</h3>
                 <button onClick={() => setShowAddContact(!showAddContact)} className={`text-blue-600 font-bold ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>+ Thêm mới</button>
             </div>
             
             {showAddContact && (
                 <form onSubmit={handleAddContact} className={`bg-slate-50 border-b border-slate-100 ${isSeniorMode ? 'p-6' : 'p-4'}`}>
                     <div className="flex gap-3 mb-3">
                         <input placeholder="Tên" value={newContactName} onChange={e=>setNewContactName(e.target.value)} className={`flex-1 rounded-lg border border-slate-300 ${isSeniorMode ? 'p-4 text-lg' : 'p-3'}`} required />
                         <input placeholder="SĐT" value={newContactPhone} onChange={e=>setNewContactPhone(e.target.value)} className={`flex-1 rounded-lg border border-slate-300 ${isSeniorMode ? 'p-4 text-lg' : 'p-3'}`} required />
                     </div>
                     <button className={`w-full bg-blue-600 text-white rounded-lg font-bold ${isSeniorMode ? 'py-4 text-lg' : 'py-3'}`}>Lưu</button>
                 </form>
             )}

             <div className={`grid gap-3 ${isSeniorMode ? 'p-6' : 'p-4'}`}>
                 {user?.emergencyContacts.map(c => (
                     <div key={c.id} className={`flex justify-between items-center hover:bg-slate-50 rounded-lg transition-colors ${isSeniorMode ? 'p-5' : 'p-3'}`}>
                         <div className="flex items-center gap-3">
                             <div className={`bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 ${isSeniorMode ? 'w-14 h-14 text-xl' : 'w-10 h-10'}`}>{c.name.charAt(0)}</div>
                             <div>
                                 <div className={`font-bold text-slate-900 ${isSeniorMode ? 'text-xl' : ''}`}>{c.name}</div>
                                 <div className={`text-slate-500 ${isSeniorMode ? 'text-base' : 'text-sm'}`}>{c.phone}</div>
                             </div>
                         </div>
                         <button 
                            onClick={() => handleRemoveContact(c.id, c.name)} 
                            className="text-slate-400 hover:text-red-500 p-2"
                            aria-label={`Xóa liên hệ ${c.name}`}
                        >
                            <Trash2 size={isSeniorMode ? 24 : 18}/>
                        </button>
                     </div>
                 ))}
                 {(!user?.emergencyContacts || user.emergencyContacts.length === 0) && (
                     <p className="text-center text-slate-400 py-4">Chưa có danh bạ khẩn cấp.</p>
                 )}
             </div>
        </div>

        {showVoiceModal && (
            <VoiceSetupModal 
                onClose={() => setShowVoiceModal(false)} 
                initialTab="family" 
            />
        )}
    </div>
  );
};

export default FamilyScreen;
