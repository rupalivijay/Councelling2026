import React from 'react';
import { motion } from 'motion/react';
import { Bell, Mail, Calendar, Sparkles, Save, ShieldCheck, MessageCircle, Settings as SettingsIcon, CreditCard, ChevronRight, Check } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { NotificationSettings as SettingsType } from '../types';
import { cn } from '../lib/utils';
import ChatWindow from '../components/ChatWindow';

export default function StudentDashboard() {
  const [settings, setSettings] = React.useState<SettingsType>({
    scheduleUpdates: true,
    meritListAlerts: true,
    choiceFillingReminders: true,
    emailNotifications: false,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<'messages' | 'settings' | 'account'>('messages');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile(data);
          if (data.notificationSettings) {
            setSettings(data.notificationSettings);
          }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleSetting = (key: keyof SettingsType) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationSettings: settings
      });
      alert("Settings updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-500">Loading your profile...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Student Dashboard</h1>
        <p className="text-slate-500 font-medium">Manage your settings and communicate with counselors.</p>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 w-fit">
        <button
          onClick={() => setActiveTab('messages')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition",
            activeTab === 'messages' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <MessageCircle className="h-4 w-4" />
          <span>Messages</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition",
            activeTab === 'settings' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <SettingsIcon className="h-4 w-4" />
          <span>Settings</span>
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition",
            activeTab === 'account' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <CreditCard className="h-4 w-4" />
          <span>Plan</span>
        </button>
      </div>

      {activeTab === 'account' ? (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
        >
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Membership</h3>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-slate-900">{profile?.isPaid ? (profile.planType || 'Predictor Pro') : 'Free Starter'}</h2>
                            {profile?.isPaid && (
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Active</span>
                            )}
                        </div>
                    </div>
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        profile?.isPaid ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-400"
                    )}>
                        <CreditCard className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 mb-8">
                    <p className="text-sm text-slate-600 font-medium mb-4">
                        {profile?.isPaid 
                            ? "You have full access to all premium features including the AI Predictor Engine and historical data."
                            : "Unlock the full potential of Laxmi Education by upgrading to a premium plan."
                        }
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-black">
                            {profile?.isPaid ? 'Next billing: Never (One-time)' : 'Predictor: Locked'}
                        </div>
                    </div>
                </div>

                {!profile?.isPaid ? (
                    <button 
                        onClick={() => window.location.href = '/pricing'}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-100 hover:bg-blue-700 transition"
                    >
                        <span>View Plans & Upgrade</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                ) : (
                    <div className="border-t border-slate-100 pt-8 mt-2">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Transaction History</h4>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <Check className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900">One-time Unlock</p>
                                    <p className="text-[10px] text-slate-500 font-bold">Successfully processed</p>
                                </div>
                            </div>
                            <span className="text-xs font-black text-slate-900">-₹499.00</span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
      ) : activeTab === 'settings' ? (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm max-w-2xl"
        >
            <div className="p-8 md:p-10 space-y-8">
            <SettingItem 
                icon={Calendar} 
                title="Schedule Updates" 
                description="Get notified when counseling dates change or new sessions are added."
                active={settings.scheduleUpdates}
                onToggle={() => toggleSetting('scheduleUpdates')}
            />
            <SettingItem 
                icon={Sparkles} 
                title="Merit List Alerts" 
                description="Instant notification when state or national merit lists are released."
                active={settings.meritListAlerts}
                onToggle={() => toggleSetting('meritListAlerts')}
            />
            <SettingItem 
                icon={Bell} 
                title="Choice Filling Reminders" 
                description="We'll remind you before the locking deadline for every CAP round."
                active={settings.choiceFillingReminders}
                onToggle={() => toggleSetting('choiceFillingReminders')}
            />
            
            <div className="pt-8 border-t border-slate-100">
                <SettingItem 
                icon={Mail} 
                title="Email Notifications" 
                description="Receive weekly summaries and important announcements via email."
                active={settings.emailNotifications}
                onToggle={() => toggleSetting('emailNotifications')}
                />
            </div>
            </div>

            <div className="bg-slate-50 px-8 py-6 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Privacy Guaranteed</span>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>
        </motion.div>
      ) : (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-100">
                        <h3 className="font-black text-xl mb-2">Expert Counseling</h3>
                        <p className="text-blue-100 text-sm leading-relaxed mb-6">Connect with our senior counselors for immediate guidance on your CAP rounds.</p>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Counselors Online</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h4 className="font-black text-slate-900 mb-4 uppercase tracking-[0.1em] text-xs">Instructions</h4>
                        <ul className="space-y-3">
                            {[
                                'Ask about cutoff trends',
                                'Clarify document needs',
                                'Support during choice filling',
                                'Response time: < 2 hours'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs font-bold text-slate-500">
                                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="md:col-span-2">
                    {user && (
                        <ChatWindow 
                            userId={user.uid} 
                            userName="Laxmi Education Support" 
                            role="student" 
                        />
                    )}
                </div>
            </div>
        </motion.div>
      )}
    </div>
  );
}

function SettingItem({ icon: Icon, title, description, active, onToggle }: { 
  icon: any, title: string, description: string, active: boolean, onToggle: () => void 
}) {
  return (
    <div className="flex items-start justify-between group">
      <div className="flex space-x-4">
        <div className={cn(
            "p-3 rounded-2xl transition",
            active ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="max-w-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
          active ? "bg-blue-600" : "bg-slate-200"
        )}
      >
        <span className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          active ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}
