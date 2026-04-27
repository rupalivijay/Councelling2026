import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex justify-center items-center space-x-3 mb-6">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0399691610.firebasestorage.app/o/logo.png?alt=media" 
            alt="Laxmi Educational Logo" 
            className="h-10 w-auto"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/100x100/f97316/ffffff?text=LE";
            }}
          />
          <span className="text-2xl font-black text-slate-900">Laxmi Educational</span>
        </div>
        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
          The ultimate platform for NEET, JEE and State CET counseling guidance. Empowering students to make the right choice for their future.
        </p>
        
        <div className="mt-8 flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Location Map Scanner</p>
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0399691610.firebasestorage.app/o/qr_code.png?alt=media" 
              alt="Location QR Code" 
              className="w-32 h-32 rounded-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/150x150/f1f5f9/94a3b8?text=QR+Code";
              }}
            />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest px-4">
          © 2026 EduCounsel Consultancy • Bajajnagar, Chh Sambhajinagar, Maharashtra, India. 431136.
        </div>
      </div>
    </footer>
  );
}
