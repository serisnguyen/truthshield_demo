
import React, { useState, useEffect } from 'react';
import { Users, Search, Mic, CheckCircle2, UserPlus, Phone, ShieldCheck, ShieldAlert, Plus, HelpCircle, Loader2, X, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VoiceSetupModal from './VoiceSetupModal';
import { PhoneLookupResult } from '../types';

const ContactsScreen: React.FC = () => {
  const { user, syncContacts, lookupPhoneNumber, isSeniorMode } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PhoneLookupResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Sync State for UX Feedback
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // FIX: Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filter contacts logic using debounced term
  const contacts = user?.contacts || [];
  
  const verifiedContacts = contacts.filter(c => c.hasVoiceProfile);
  const unverifiedContacts = contacts.filter(c => !c.hasVoiceProfile);
  
  const filteredVerified = verifiedContacts.filter(c => c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
  const filteredUnverified = unverifiedContacts.filter(c => c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

  const handleScanContact = async (phone: string) => {
    setIsScanning(true);
    setScanResult(null);
    try {
        const result = await lookupPhoneNumber(phone);
        setScanResult(result);
        setShowResultModal(true);
    } catch (error) {
        console.error("Scan failed", error);
        alert("Không thể tra cứu số điện thoại này.");
    } finally {
        setIsScanning(false);
    }
  };

  const handleSync = async () => {
      setSyncStatus('loading');
      // Simulate network delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      syncContacts();
      
      setSyncStatus('success');
      // Reset after animation
      setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const getScoreColor = (score: number) => {
      if (score > 80) return 'text-green-600 border-green-200 bg-green-50';
      if (score > 50) return 'text-amber-600 border-amber-200 bg-amber-50';
      return 'text-red-600 border-red-200 bg-red-50';
  };

  return (
    <div className="p-4 md:p-6 pt-20 md:pt-10 pb-32 animate-in fade-in max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
                <h2 className="text-3xl font-black text-slate-900 mb-1">Danh Bạ An Ninh</h2>
                <p className="text-slate-500">
                    Quản lý "Mạng Lưới Tin Cậy". AI chỉ xác thực người có Voice DNA.
                </p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <button 
                    onClick={handleSync}
                    disabled={syncStatus !== 'idle'}
                    aria-label={syncStatus === 'loading' ? "Đang đồng bộ danh bạ" : "Đồng bộ danh bạ"}
                    className={`flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 ${syncStatus === 'success' ? 'border-green-300 bg-green-50 text-green-700' : ''}`}
                >
                    {syncStatus === 'loading' ? (
                        <><Loader2 size={18} className="animate-spin" /> Đang bộ...</>
                    ) : syncStatus === 'success' ? (
                        <><CheckCircle2 size={18} className="animate-bounce" /> Đã xong</>
                    ) : (
                        "Đồng bộ"
                    )}
                </button>
                <button 
                    onClick={() => setShowVoiceModal(true)}
                    className="flex-1 md:flex-none px-4 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    aria-label="Thêm liên hệ thủ công"
                >
                    <Plus size={18} /> Thêm thủ công
                </button>
            </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
                type="text"
                placeholder="Tìm kiếm người thân..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                aria-label="Tìm kiếm người thân"
            />
        </div>

        {/* Verified List */}
        <div className="mb-8" role="region" aria-label="Danh bạ đã xác thực">
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-3 px-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-green-500" /> Đã xác thực ({filteredVerified.length})
            </h3>
            
            <div className="space-y-3">
                {filteredVerified.map(contact => (
                    <div key={contact.id} className="bg-white p-4 rounded-2xl border border-green-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
                                {contact.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{contact.name}</h4>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 mt-0.5">
                                    <CheckCircle2 size={12} /> Đã có Voice DNA
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleScanContact(contact.phone)}
                                className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                title="Quét số điện thoại"
                                aria-label={`Quét số điện thoại của ${contact.name}`}
                            >
                                <Search size={18} />
                            </button>
                            <button 
                                className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100"
                                aria-label={`Gọi cho ${contact.name}`}
                            >
                                <Phone size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {filteredVerified.length === 0 && (
                    <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <p className="text-slate-400 text-sm">Chưa có người thân nào đã xác thực.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Unverified List */}
        <div role="region" aria-label="Danh bạ chưa xác thực">
            <div className="flex items-center justify-between mb-3 px-2">
                 <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider flex items-center gap-2">
                    <HelpCircle size={14} /> Chưa bảo vệ ({filteredUnverified.length})
                </h3>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">
                    Chỉ hiện tên khi gọi
                </span>
            </div>
           
            <div className="space-y-3">
                {filteredUnverified.map(contact => (
                    <div key={contact.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg grayscale">
                                {contact.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700">{contact.name}</h4>
                                <p className="text-xs text-slate-400">{contact.phone}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleScanContact(contact.phone)}
                                className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                title="Quét số điện thoại"
                                aria-label={`Quét số điện thoại của ${contact.name}`}
                            >
                                <Search size={16} />
                            </button>
                            <button 
                                onClick={() => setShowVoiceModal(true)}
                                className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 flex items-center gap-1"
                                aria-label={`Ghi âm giọng mẫu cho ${contact.name}`}
                            >
                                <Mic size={12} /> Ghi mẫu
                            </button>
                            <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1" aria-label={`Mời ${contact.name} dùng ứng dụng`}>
                                <UserPlus size={12} /> Mời dùng
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Scan Result Modal */}
        {showResultModal && scanResult && (
            <div 
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="scan-title"
            >
                <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                    <div className="relative p-6 text-center border-b border-slate-100">
                        <button 
                            onClick={() => setShowResultModal(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                            aria-label="Đóng kết quả"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 border-4 ${getScoreColor(scanResult.reputationScore)} bg-opacity-10`}>
                             {scanResult.reputationScore < 50 ? <AlertTriangle size={40} className="text-red-600" /> : <ShieldCheck size={40} className={scanResult.reputationScore > 80 ? 'text-green-600' : 'text-amber-600'} />}
                        </div>
                        
                        <h3 id="scan-title" className="text-2xl font-black text-slate-900">{scanResult.phoneNumber}</h3>
                        <p className="text-slate-500 font-bold">{scanResult.carrier}</p>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className={`text-center p-3 rounded-2xl border ${getScoreColor(scanResult.reputationScore)} bg-opacity-10`}>
                                <div className={`text-3xl font-black ${scanResult.reputationScore > 80 ? 'text-green-600' : scanResult.reputationScore > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {scanResult.reputationScore}
                                </div>
                                <div className="text-[10px] font-bold uppercase text-slate-500 mt-1">Điểm Uy Tín</div>
                            </div>
                            <div className="text-center p-3 rounded-2xl border border-slate-200 bg-slate-50">
                                <div className="text-3xl font-black text-slate-800">
                                    {scanResult.reportCount}
                                </div>
                                <div className="text-[10px] font-bold uppercase text-slate-500 mt-1">Lượt Báo Cáo</div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Nhãn cộng đồng</h4>
                            <div className="flex flex-wrap gap-2">
                                {scanResult.tags.map((tag, i) => (
                                    <span key={i} className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                        tag === 'scam' ? 'bg-red-100 text-red-700 border-red-200' :
                                        tag === 'safe' ? 'bg-green-100 text-green-700 border-green-200' :
                                        'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                        {tag === 'scam' ? 'Lừa đảo' : tag === 'safe' ? 'An toàn' : tag}
                                    </span>
                                ))}
                                {scanResult.tags.length === 0 && <span className="text-slate-400 italic text-sm">Chưa có nhãn</span>}
                            </div>
                            {scanResult.communityLabel && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-700 font-medium border border-slate-200">
                                    "{scanResult.communityLabel}"
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => setShowResultModal(false)}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Global Loading Overlay */}
        {isScanning && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/50 backdrop-blur-sm" role="alert" aria-busy="true">
                <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                    <span className="font-bold text-slate-700">Đang tra cứu số điện thoại...</span>
                </div>
            </div>
        )}

        {showVoiceModal && (
            <VoiceSetupModal 
                onClose={() => setShowVoiceModal(false)} 
                initialTab="family" 
            />
        )}
    </div>
  );
};

export default ContactsScreen;
