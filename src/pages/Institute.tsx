import React from 'react';
import { motion } from 'motion/react';
import { Target, Users, BookOpen, MessageSquare, Video, ShieldCheck, X } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Institute() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bookingStatus, setBookingStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Please login to book a session.");
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'appointments'), {
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        type: 'General Counseling',
        status: 'scheduled',
        timestamp: serverTimestamp(),
      });
      setBookingStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setBookingStatus('idle');
      }, 2000);
    } catch (err) {
      console.error(err);
      setBookingStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-5xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
             Experience World-Class <br />
            <span className="text-blue-600">Counseling Expertise</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            EduCounsel is a premier consultancy dedicated to helping students navigate the complex path to medical and engineering careers. We provide data-driven insights and strategic planning for NEET, JEE, and CET aspirants.
          </p>
          <div className="grid gap-6 mb-10">
            <ServiceHighlight 
              icon={Target}
              title="Strategic Choice Filling"
              desc="We help you arrange college preferences to maximize allotment chances based on category and rank."
            />
            <ServiceHighlight 
              icon={Users}
              title="1-on-1 Guidance"
              desc="Personalized sessions with industry veterans to resolve every query about the CAP rounds."
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition"
          >
            Book Professional Session
          </button>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-4 sm:pt-12">
            <StatsBox value="15k+" label="Students Assisted" color="bg-blue-600" />
            <StatsBox value="500+" label="Top Colleges" color="bg-indigo-600" />
          </div>
          <div className="space-y-4">
            <StatsBox value="98%" label="Success Rate" color="bg-emerald-600" />
            <StatsBox value="10+" label="Years Experience" color="bg-orange-600" />
          </div>
        </div>
      </div>

      <section className="bg-slate-900 rounded-[4rem] p-12 lg:p-20 text-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4 tracking-tight">Our Specialized Services</h2>
          <p className="text-slate-400">Comprehensive support for every stage of your admission journey.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <ConsultingStep icon={MessageSquare} title="Initial Counseling" />
          <ConsultingStep icon={Video} title="AIQ Strategy" />
          <ConsultingStep icon={BookOpen} title="State Round Prep" />
          <ConsultingStep icon={ShieldCheck} title="Admission Support" />
        </div>
      </section>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-10">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Book Your Session</h3>
              <p className="text-slate-500 mb-8">Schedule a 30-min discovery call with our top counselor.</p>
              
              {!currentUser ? (
                <div className="bg-slate-50 p-6 rounded-2xl text-center">
                  <p className="text-slate-600 mb-4 font-medium">You need to be logged in to book a session.</p>
                  <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Please use the login button in the header</p>
                </div>
              ) : (
                <form onSubmit={handleBook} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Student Name</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={currentUser.displayName || ''} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Email Address</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={currentUser.email || ''} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting || bookingStatus === 'success'}
                    className={cn(
                      "w-full py-4 rounded-xl font-black text-lg transition shadow-lg",
                      bookingStatus === 'success' ? "bg-emerald-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                    )}
                  >
                    {isSubmitting ? "Processing..." : bookingStatus === 'success' ? "Booked Successfully!" : "Confirm Appointment"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ServiceHighlight({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex space-x-4">
      <div className="bg-blue-50 p-3 rounded-2xl h-fit">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <div>
        <h4 className="text-xl font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StatsBox({ value, label, color }: { value: string, label: string, color: string }) {
  return (
    <div className={cn("p-8 rounded-[2.5rem] text-white flex flex-col justify-end h-64 shadow-xl", color)}>
      <span className="text-4xl font-black mb-2">{value}</span>
      <span className="text-white/80 font-bold uppercase tracking-widest text-xs">{label}</span>
    </div>
  );
}

function ConsultingStep({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center group hover:bg-white/10 transition">
      <Icon className="h-10 w-10 text-blue-400 mb-6 group-hover:scale-110 transition" />
      <h5 className="font-bold text-lg">{title}</h5>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
