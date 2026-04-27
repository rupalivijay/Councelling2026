import React from 'react';
import { Send, Bot, User, Sparkles, X } from 'lucide-react';
import { askGemini } from '../services/geminiService';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function GeminiChat() {
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'model', text: 'Hi! I am your AI Counseling Assistant. How can I help you with your admission process today?' }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await askGemini(userMessage, history);
    setMessages(prev => [...prev, { role: 'model', text: response || "I'm sorry, I couldn't generate a response." }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex-1">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-white">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold leading-none">AI Assistant</h3>
            <span className="text-[10px] opacity-80 font-bold uppercase tracking-wider">Powered by Gemini</span>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-br-none" 
                : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="flex space-x-1">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full" 
              />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full" 
              />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full" 
              />
            </div>
            <span className="text-xs font-medium">Assistant is thinking...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center space-x-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask anything about counseling..."
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
