import React from 'react';
import { motion } from 'motion/react';
import { Video, Calendar, Clock, Send, CheckCircle2, MessageSquare, Phone, ExternalLink } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function OnlineGuidance() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    date: '',
    time: '',
    platform: 'Google Meet' as 'Google Meet' | 'WhatsApp' | 'Phone'
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [appointments, setAppointments] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (auth.currentUser) {
      setFormData(prev => ({
        ...prev,
        name: auth.currentUser?.displayName || '',
        email: auth.currentUser?.email || '',
      }));
    }
  }, [auth.currentUser]);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'appointments'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Appointments snapshot stream closed/error:", error.message);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      if (auth.currentUser) {
        // Authenticated users book an appointment
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'appointments'), {
          subject: formData.subject,
          date: formData.date,
          time: formData.time,
          platform: formData.platform,
          studentId: auth.currentUser.uid,
          studentName: formData.name || auth.currentUser.displayName,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      } else {
        // Guest users create a lead
        await addDoc(collection(db, 'leads'), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          preferredDate: formData.date,
          preferredTime: formData.time,
          platform: formData.platform,
          status: 'new',
          createdAt: serverTimestamp(),
        });
      }
      setIsSuccess(true);
      setFormData({ 
        name: auth.currentUser?.displayName || '', 
        email: auth.currentUser?.email || '', 
        phone: '', 
        subject: '', 
        date: '', 
        time: '', 
        platform: 'Google Meet' 
      });
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-full mb-6"
        >
          <Video className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-bold text-orange-700 uppercase tracking-wider">Book Demo Session</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
          Request a <span className="text-orange-600">Demo Session</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Experience our expert counseling first-hand. Book a demo session to see how we can help you secure your dream college.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 p-3 rounded-2xl">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Personalized Demo</h3>
                <p className="text-slate-500 text-sm">See how we analyze your rank for the best colleges.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">1-on-1 Interaction</h3>
                <p className="text-slate-500 text-sm">Directly speak with our chief admission strategist.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-purple-50 p-3 rounded-2xl">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Immediate Clarity</h3>
                <p className="text-slate-500 text-sm">Get answers to your specific counseling doubts.</p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
            <h4 className="text-xl font-black mb-4">What you'll get:</h4>
            <ul className="space-y-4">
              {[
                'Overview of counseling process',
                'Rank-to-College estimation',
                'Document checklist walkthrough',
                'Personalized counseling roadmap'
              ].map((step, i) => (
                <li key={i} className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Request Submitted!</h3>
              <p className="text-slate-500 mb-8">Our team will call you within 24 hours to confirm your demo slot.</p>
              <button
                onClick={() => setIsSuccess(false)}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition"
              >
                Back to Form
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email ID</label>
                    <input
                      required
                      type="email"
                      placeholder="email@example.com"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      required
                      type="tel"
                      placeholder="10-digit number"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Interested In</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., Medical Counseling 2026"
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        required
                        type="date"
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        required
                        type="time"
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition"
                        value={formData.time}
                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Platform</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'Google Meet', icon: Video },
                      { id: 'WhatsApp', icon: MessageSquare },
                      { id: 'Phone', icon: Phone }
                    ].map(platform => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, platform: platform.id as any })}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition gap-2",
                          formData.platform === platform.id 
                            ? "bg-orange-50 border-orange-600 text-orange-600" 
                            : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        <platform.icon className="h-6 w-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{platform.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-orange-600 text-white rounded-2xl py-5 font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-700 transition shadow-2xl shadow-orange-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Book Demo Session</span>
                      <Send className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {auth.currentUser && appointments.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Your Booked Sessions</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                    app.status === 'pending' ? "bg-orange-100 text-orange-600" :
                    app.status === 'scheduled' ? "bg-blue-100 text-blue-600" :
                    app.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                  )}>
                    {app.status}
                  </span>
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-400 group-hover:text-blue-600 transition">
                    <Video className="h-4 w-4" />
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 mb-4 line-clamp-1">{app.subject}</h4>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>{app.date}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{app.time}</span>
                  </div>
                </div>

                {app.status === 'scheduled' && app.meetingLink ? (
                  <a 
                    href={app.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                  >
                    <span>Join Meeting</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <div className="w-full bg-slate-50 text-slate-400 py-3 rounded-xl text-sm font-bold text-center">
                    {app.status === 'pending' ? 'Awaiting Confirmation' : app.status === 'completed' ? 'Session Completed' : 'Session Cancelled'}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
