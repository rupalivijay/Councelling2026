import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { MessageCircle, X, Sparkles, User } from 'lucide-react';
import ChatWindow from './ChatWindow';
import GeminiChat from './GeminiChat';
import { cn } from '../lib/utils';

export default function Layout() {
  const [user, setUser] = React.useState<any>(null);
  const [isCounselor, setIsCounselor] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);
  const [chatType, setChatType] = React.useState<'ai' | 'human'>('ai');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const counselorDoc = await getDoc(doc(db, 'counselors', u.uid));
          setIsCounselor(counselorDoc.exists());
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `counselors/${u.uid}`);
        }
      } else {
        setIsCounselor(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />

      {/* Floating Student Chat Widget */}
      {user && !isCounselor && (
        <div className="fixed bottom-6 right-6 z-50">
          {showChat ? (
            <div className="w-80 md:w-[400px] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-slate-100 shadow-sm ml-auto mr-2">
                  <button 
                    onClick={() => setChatType('ai')}
                    className={cn(
                      "flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition",
                      chatType === 'ai' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>AI Assistant</span>
                  </button>
                  <button 
                    onClick={() => setChatType('human')}
                    className={cn(
                      "flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition",
                      chatType === 'human' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <User className="h-3 w-3" />
                    <span>Counselor</span>
                  </button>
                </div>
                <button 
                  onClick={() => setShowChat(false)}
                  className="bg-white p-2.5 rounded-full shadow-lg border border-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {chatType === 'ai' ? (
                <GeminiChat />
              ) : (
                <ChatWindow userId={user.uid} userName="Help Desk Support" role="student" />
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowChat(true)}
              className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition transform hover:scale-110 active:scale-95 flex items-center space-x-2 group"
            >
              <div className="relative">
                <MessageCircle className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-blue-600 rounded-full animate-pulse" />
              </div>
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-sm whitespace-nowrap">
                Counselor & AI Support
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
