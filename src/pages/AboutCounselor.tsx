import React from 'react';
import { motion } from 'motion/react';
import { Award, BookOpen, CheckCircle, GraduationCap, Star, Target, Users } from 'lucide-react';
import { cn } from '../lib/utils';

const stats = [
  { label: 'Years Experience', value: '10+', icon: CalendarDays },
  { label: 'Student Admissions', value: '5000+', icon: Users },
  { label: 'Success Rate', value: '100%', icon: Target },
  { label: 'Expert Support', value: '24/7', icon: Star },
];

import { CalendarDays } from 'lucide-react';

export default function AboutCounselor() {
  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Bio & Profile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute -inset-4 bg-orange-100 rounded-[2.5rem] -rotate-3" />
                  <img
                    src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0399691610.firebasestorage.app/o/counselor.png?alt=media"
                    alt="Mr. Vijay Bhosale"
                    className="relative z-10 w-48 h-64 object-cover rounded-[2rem] shadow-xl border-4 border-white"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <span className="text-orange-600 font-black uppercase tracking-[0.2em] text-xs">Chief Admissions Counselor</span>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 mt-2 leading-tight">
                  Mr. Vijay <span className="text-orange-600">Bhosale</span>
                </h1>
              </div>
            </div>

            <p className="text-xl text-slate-600 leading-relaxed font-medium">
              With over a decade of dedicated expertise in Indian medical and engineering admissions, 
              Mr. Vijay Bhosale has become a beacon of guidance for thousands of aspiring students. 
              His deep understanding of the complex counseling landscape ensures every student finds 
              their path to the right institution.
            </p>

            <div className="space-y-4">
              {[
                "MBBS & Engineering Counseling Specialist (JoSAA/MCC/State)",
                "Expert in Category-based Seat Reservation & Optimization",
                "Proven Track Record with 100% Admission Accuracy",
                "Personalized Mentorship for Top Tier Institutions"
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="p-1 bg-emerald-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-700 font-bold">{item}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pb-8">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="p-3 bg-orange-50 rounded-2xl mb-3">
                    <stat.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual/Extra Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="relative z-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Counseling Philosophy</h3>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 mb-1">Empowerment</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Beyond just seat allotment, we focus on empowering students with data-driven decision-making tools.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 mb-1">Strategic Planning</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Every choice filling is a strategic move. We analyze year-over-year trends to find the best possible match for your rank.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 mb-1">Integrity</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Transparency in the counseling process is our core. We ensure 100% ethical guidance without hidden agendas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-slate-900 rounded-[2rem] text-white">
                <p className="text-sm italic font-medium opacity-80 leading-relaxed">
                  "Education is the most powerful weapon which you can use to change the world. My mission is to ensure that no deserving student is left behind due to complex procedures."
                </p>
                <div className="mt-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-xs text-white">VB</div>
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-300">— Mr. Vijay Bhosale</span>
                </div>
              </div>
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
