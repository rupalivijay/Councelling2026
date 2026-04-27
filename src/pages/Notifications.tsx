import React from 'react';
import { motion } from 'motion/react';
import { Bell, Mail, Calendar, Sparkles, Save, ShieldCheck } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { NotificationSettings as SettingsType } from '../types';
import { cn } from '../lib/utils';

export default function NotificationSettings() {
  const [settings, setSettings] = React.useState<SettingsType>({
    scheduleUpdates: true,
    meritListAlerts: true,
    choiceFillingReminders: true,
    emailNotifications: false,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists() && userDoc.data().notificationSettings) {
          setSettings(userDoc.data().notificationSettings);
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

  if (loading) return <div className="p-20 text-center">Loading preferences...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Notification Center</h1>
        <p className="text-slate-500">Manage how you want to receive updates about your counseling rounds.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
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
            <div className="flex items-center space-x-2 text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Privacy Guaranteed</span>
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
      </div>
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
