import React, { useEffect, useState } from 'react';
import { Phone, MapPin, AlertOctagon, X, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SOSReceiveModal: React.FC = () => {
  const { setIncomingSOS, user } = useAuth();
  const [audio] = useState(new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'));

  useEffect(() => {
    audio.loop = true;
    audio.play().catch(e => console.log("Audio play failed (Auto-play policy)", e));
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  // Demo Coordinates for Ho Chi Minh City
  const mapUrl = `https://maps.google.com/maps?q=10.762622,106.660172&z=16&output=embed`;

  return (
    <div 
        className="fixed inset-0 z-[100] bg-red-900/90 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-title"
    >
       <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center animate-in zoom-in duration-300 relative">
           
           <button 
             onClick={() => setIncomingSOS(false)}
             className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-20"
             aria-label="Đóng cảnh báo"
           >
             <X size={20} />
           </button>

           <div className="bg-red-600 p-6 flex flex-col items-center relative overflow-hidden">
               <div className="absolute inset-0 bg-red-500 animate-pulse opacity-50"></div>
               <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
                  <AlertOctagon size={40} className="text-red-600" fill="currentColor" />
               </div>
               <h2 id="sos-title" className="relative z-10 text-3xl font-black text-white uppercase tracking-wider drop-shadow-md">BÁO ĐỘNG SOS!</h2>
               <p className="relative z-10 text-white/90 font-bold mt-1 text-lg">
                   {user?.sosMessage || "Cha/Mẹ đang gặp nguy hiểm"}
               </p>
           </div>

           <div className="p-0">
               <div className="bg-slate-50 border-b border-slate-200 shadow-inner relative group">
                  <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur text-blue-600 px-3 py-1 rounded-full font-bold text-xs shadow-sm flex items-center gap-1">
                      <MapPin size={12} /> Vị trí thời gian thực
                  </div>
                  
                  {/* Embedded Google Map */}
                  <div className="h-64 w-full bg-slate-200 relative">
                     <iframe 
                        width="100%" 
                        height="100%" 
                        src={mapUrl}
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="SOS Location"
                     ></iframe>
                     
                     {/* Overlay to ensure touch interactions work but show SOS context */}
                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/80 to-transparent p-4 pt-12">
                        <p className="text-sm text-slate-800 font-bold">
                            123 Đường Nguyễn Trãi, Quận 1, TP.HCM
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Cập nhật: Vừa xong • Chính xác cao</p>
                     </div>
                  </div>
               </div>

               <div className="p-6">
                   <div className="grid grid-cols-2 gap-3 mb-4">
                       <a 
                         href={`https://www.google.com/maps/dir/?api=1&destination=10.762622,106.660172`}
                         target="_blank"
                         rel="noreferrer"
                         className="py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                       >
                           <Navigation size={20} /> Chỉ đường
                       </a>
                       <button 
                          onClick={() => setIncomingSOS(false)}
                          className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                       >
                           Đã an toàn
                       </button>
                   </div>

                   <a 
                     href="tel:113"
                     className="w-full py-5 bg-red-600 text-white rounded-2xl font-bold shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3 text-xl border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
                   >
                       <Phone size={28} className="animate-pulse fill-current" /> GỌI ĐIỆN NGAY
                   </a>
               </div>
           </div>
       </div>
    </div>
  );
};

export default SOSReceiveModal;