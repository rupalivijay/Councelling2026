import React from 'react';
import { motion } from 'motion/react';
import { Video, Calendar, Clock, Send, CheckCircle2, MessageSquare, Phone, ExternalLink } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function OnlineGuidance() {
  const [formData, setFormData] = React.useState({
    subject: '',
    date: '',
    time: '',
    platform: 'Google Meet' as 'Google Meet' | 'WhatsApp' | 'Phone'
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [appointments, setAppointments] = React.useState<any[]>([]);

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
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'appointments'), {
        ...formData,
        studentId: auth.currentUser.uid,
        studentName: auth.currentUser.displayName,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
      setFormData({ subject: '', date: '', time: '', platform: 'Google Meet' });
    } catch (error) {
      console.error("Booking failed:", error);
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
          <span className="text-sm font-bold text-orange-700 uppercase tracking-wider">Book Your Session</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
          Online Guidance <span className="text-orange-600">at Your Convenience</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Need expert advice on college selection or document verification? Book a 1-on-1 online session with our counselors.
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
                <h3 className="font-black text-slate-900">Virtual Meetings</h3>
                <p className="text-slate-500 text-sm">Face-to-face guidance via Google Meet or WhatsApp.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Flexible Timing</h3>
                <p className="text-slate-500 text-sm">Pick a slot that works best for your schedule.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-purple-50 p-3 rounded-2xl">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Expert Support</h3>
                <p className="text-slate-500 text-sm">Direct access to our chief admission counselors.</p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
            <h4 className="text-xl font-black mb-4">How it works:</h4>
            <ul className="space-y-4">
              {[
                'Fill out the request form',
                'Counselor confirms your slot',
                'Receive meeting link via email/app',
                'Join the session at scheduled time'
              ].map((step, i) => (
                <li key={i} className="flex items-center space-x-3 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-orange-400">
                    {i + 1}
                  </div>
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
              <h3 className="text-2xl font-black text-slate-900 mb-2">Request Sent!</h3>
              <p className="text-slate-500 mb-8">Your meeting request has been submitted. We will confirm your slot shortly.</p>
              <button
                onClick={() => setIsSuccess(false)}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition"
              >
                Book Another
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., JEE Counseling Guidance"
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
                disabled={isSubmitting || !auth.currentUser}
                type="submit"
                className="w-full bg-orange-600 text-white rounded-2xl py-5 font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-700 transition shadow-2xl shadow-orange-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Book Session Now</span>
                    <Send className="h-5 w-5" />
                  </>
                )}
              </button>
              
              {!auth.currentUser && (
                <p className="text-center text-xs font-bold text-red-500">Please login to book a session</p>
              )}
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
