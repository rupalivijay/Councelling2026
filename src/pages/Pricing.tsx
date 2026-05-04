import React from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Star, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Pricing() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-16">
        <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Offline Enrollment Process</h2>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Visit Us to Unlock Pro Features</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          To ensure the best guidance and secure enrollment, all premium plans are processed in-person at our center.
        </p>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl p-10 md:p-16 mb-20">
        <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1">
                <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-8">
                    <Shield className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4">How it Works</h2>
                <div className="space-y-6">
                    <Step number="1" title="Visit Our Center" description="Come to Laxmi Education center with your documents." />
                    <Step number="2" title="Payment at Counter" description="Complete your payment via Cash, UPI, or Card." />
                    <Step number="3" title="Instant Activation" description="Our counselor will click 'Enable Permission' to unlock your dashboard instantly." />
                </div>
            </div>
            <div className="md:w-72 flex flex-col justify-center">
                <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl text-center">
                    <h3 className="text-xl font-black mb-4">Predictor Pro</h3>
                    <div className="text-4xl font-black mb-2">₹499</div>
                    <p className="text-xs text-slate-400 font-bold mb-6">ONE-TIME FEE</p>
                    <Link 
                        to="/" 
                        className="block w-full bg-blue-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                        Contact Us
                    </Link>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <PricingCard 
          title="Starter"
          price="Free"
          description="Basic tools to get you started on your journey."
          features={[
            'Admission Schedule Access',
            'Institute Information',
            'Generic Cutoff Lookup',
            'Basic Support'
          ]}
          cta="Current Plan"
          disabled
        />

        {/* Pro Plan */}
        <PricingCard 
          title="Predictor Pro"
          price="₹499"
          highlight
          description="Everything you need to predict your college precisely."
          features={[
            'Full Predictor Engine Access',
            'AI Personalized Insights',
            'Historical Trend Analysis',
            'Export Results to PDF/Excel',
            'Choice Filling Reminders'
          ]}
          cta="Visit Counter to Pay"
          highlighted
        />

        {/* Premium Plan */}
        <PricingCard 
          title="Complete Guidance"
          price="₹2,499"
          description="Full hands-on support from our expert counselors."
          features={[
            'Everything in Predictor Pro',
            '3 Private Consultations',
            'Personalized Choice List',
            'Document Verification Assistance',
            'Dedicated Support Group'
          ]}
          cta="Visit Center"
        />
      </div>

      <div className="mt-20 bg-slate-50 rounded-[3rem] p-12 text-center border border-slate-100">
        <div className="flex justify-center mb-6">
            <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/150?u=${i+10}`} className="w-12 h-12 rounded-full border-4 border-white shadow-sm" alt="User" />
                ))}
            </div>
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Trusted by 10,000+ Students</h3>
        <p className="text-slate-500 mb-8 font-medium">Join thousands of students who have secured their dream colleges with Laxmi Education.</p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <Feature icon={Zap} text="Instant Activation" />
            <Feature icon={Shield} text="Secure Payment" />
            <Feature icon={Star} text="Expert Verified" />
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, description }: any) {
    return (
        <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-sm">{number}</div>
            <div>
                <h4 className="font-black text-slate-900 text-sm leading-none mb-1">{title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function PricingCard({ title, price, description, features, cta, highlight, disabled, onClick }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "relative p-8 rounded-[2.5rem] border flex flex-col h-full transition-all",
        highlight 
          ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-blue-200" 
          : "bg-white border-slate-100 text-slate-900 shadow-xl shadow-slate-100"
      )}
    >
      {highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-400">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-black mb-2">{title}</h3>
        <div className="flex items-baseline gap-1 mb-4">
            <span className="text-5xl font-black tracking-tight">{price}</span>
            {price !== 'Free' && <span className={cn("text-sm font-bold", highlight ? "text-slate-400" : "text-slate-500")}>/one-time</span>}
        </div>
        <p className={cn("text-sm font-medium", highlight ? "text-slate-400" : "text-slate-500")}>
          {description}
        </p>
      </div>

      <div className="space-y-4 mb-10 flex-grow">
        {features.map((feature: string, i: number) => (
          <div key={i} className="flex items-start gap-3">
            <div className={cn(
                "mt-0.5 p-1 rounded-full shrink-0",
                highlight ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-600"
              )}>
              <Check className="h-3 w-3" />
            </div>
            <span className="text-sm font-bold opacity-90">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition flex items-center justify-center gap-2",
          highlight 
            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900" 
            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span>{cta}</span>
        {!disabled && <ArrowRight className="h-4 w-4" />}
      </button>
    </motion.div>
  );
}

function Feature({ icon: Icon, text }: any) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-600" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">{text}</span>
        </div>
    );
}
