import { motion } from 'motion/react';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
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
