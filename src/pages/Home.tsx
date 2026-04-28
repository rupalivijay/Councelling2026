import { motion } from 'motion/react';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Video, Star, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import React from 'react';

export default function Home() {
  const [testimonials, setTestimonials] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => setTestimonials(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl -z-10" />

      <section className="max-w-7xl mx-auto px-4 py-20 lg:py-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-full mb-8"
        >
          <Sparkles className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-bold text-orange-700 uppercase tracking-wider">Predict your future with Laxmi Educational</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl lg:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]"
        >
          Expert Guidance for <br />
          <span className="text-blue-600">NEET, JEE & CET</span> 2026
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed"
        >
          Navigate the complex landscape of CAP rounds and admissions with our AI-powered predictor and professional consulting team.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link
            to="/predictor"
            className="group flex items-center justify-center space-x-2 bg-orange-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-orange-700 transition shadow-2xl shadow-orange-200"
          >
            <span>Start Predictor</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
          </Link>
          <Link
            to="/online-guidance"
            className="flex items-center justify-center space-x-2 bg-white border-2 border-slate-200 px-10 py-5 rounded-2xl font-bold text-lg hover:border-blue-400 hover:text-blue-600 transition"
          >
            <Video className="h-5 w-5" />
            <span>Book Online Guidance</span>
          </Link>
        </motion.div>
      </section>

      <section className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon={ShieldCheck} 
            title="Trusted Data" 
            description="Verified historical cutoffs from MCC, JOSAA, and State CET cells for 100% accuracy."
          />
          <FeatureCard 
            icon={Zap} 
            title="Instant Analysis" 
            description="Get your eligible college list in seconds based on your rank and specific category."
          />
          <FeatureCard 
            icon={Video} 
            title="Online Guidance" 
            description="Personalized 1-on-1 virtual sessions with expert counselors at your convenient time."
          />
          <FeatureCard 
            icon={GraduationCap} 
            title="Strategic Choice filling" 
            description="Expert strategies to maximize your chances of getting your dream institution."
          />
        </div>
      </section>

      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black text-slate-900 mb-4 tracking-tight">Student Success Stories</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Hear from students who successfully secured admissions in top institutions with our guidance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 flex flex-col"
              >
                <div className="flex items-center space-x-1 text-orange-400 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                </div>
                
                <Quote className="h-10 w-10 text-blue-100 mb-4" />
                
                <p className="text-slate-700 text-lg leading-relaxed mb-8 italic">
                  "{t.content}"
                </p>

                <div className="mt-auto pt-8 border-t border-slate-50 flex items-center space-x-4">
                  <img 
                    src={t.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&h=100&auto=format&fit=crop"} 
                    alt={t.studentName} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-100" 
                  />
                  <div>
                    <h4 className="font-black text-slate-900">{t.studentName}</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t.college} • {t.rank}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black mb-6 tracking-tight">Visit Our Office</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Connect with us in person for a detailed consultation. Scan the QR code to find us on Google Maps.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600/20 p-3 rounded-2xl">
                    <ShieldCheck className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-white">Main Branch</h4>
                    <p className="text-blue-300 font-bold bg-blue-600/10 px-4 py-2 rounded-xl mt-2 border border-blue-500/20">
                      RX 8, Gulmohar Colony, Bajajnagar, Wadgaon Ko, Waluj MIDC, 431136
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="flex flex-col items-center">
                <span className="text-blue-500 font-black text-xs uppercase tracking-[0.3em] mb-4">Location Map Scanner</span>
                <div className="bg-white p-6 rounded-[3rem] shadow-2xl border border-slate-100 group">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fwww.google.com%2Fmaps%2Fsearch%2F%3Fapi%3D1%26query%3DRX%2B8%2BGulmohar%2BColony%2BBajajnagar%2BWadgaon%2BKo%2BWaluj%2BMIDC%2B431136" 
                    alt="QR Code" 
                    className="w-48 h-48 group-hover:scale-105 transition duration-500 rounded-2xl"
                    onError={(e) => {
                      e.currentTarget.src = "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=https%3A%2F%2Fwww.google.com%2Fmaps%2Fsearch%2F%3Fapi%3D1%26query%3DRX%2B8%2BGulmohar%2BColony%2BBajajnagar%2BWadgaon%2BKo%2BWaluj%2BMIDC%2B431136";
                    }}
                  />
                </div>
                <div className="mt-4 flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Active Google Maps Link</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-500">
      <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
function GraduationCap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  )
}
