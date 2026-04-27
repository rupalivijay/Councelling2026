import React from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Message } from '../types';
import { Send, User as UserIcon, Bot } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatWindowProps {
  userId: string;
  userName?: string;
  role: 'student' | 'counselor';
}

export default function ChatWindow({ userId, userName, role }: ChatWindowProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const q = query(
      collection(db, 'users', userId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[]);
    }, (error) => {
      console.warn("Chat snapshot stream closed/error (standard idle timeout often causes this):", error.message);
    });

    return () => unsubscribe();
  }, [userId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'users', userId, 'messages'), {
        text: newMessage,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || role,
        timestamp: serverTimestamp(),
        role: role
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-xl">
          <UserIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 leading-none">{userName || "Chat Support"}</h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Round</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30"
      >
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Bot className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-sm text-slate-400 font-medium">No messages yet. Send a message to start communicating.</p>
            </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          return (
            <div 
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%]",
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-4 py-2 rounded-2xl text-sm shadow-sm",
                isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
              )}>
                {msg.text}
              </div>
              <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                {msg.role === 'counselor' ? 'Counselor' : 'Student'} • {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center space-x-2">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition"
          />
          <button 
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
