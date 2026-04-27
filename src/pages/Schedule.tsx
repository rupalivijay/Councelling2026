import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Bell } from 'lucide-react';

const events = [
  { date: 'May 05, 2026', title: 'NEET 2026 Exam Date', tag: 'Exam' },
  { date: 'June 10, 2026', title: 'Result Declaration', tag: 'Result' },
  { date: 'June 25, 2026', title: 'AIQ Round 1 Registration Starts', tag: 'Counseling' },
  { date: 'July 05, 2026', title: 'State Quota Choice Filling Begins', tag: 'Action' },
  { date: 'July 15, 2026', title: 'Round 1 Seat Allotment', tag: 'Result' },
];

export default function Schedule() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Timeline</h1>
          <p className="text-slate-500">Stay updated with the official counseling calendar.</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
          <Bell className="h-4 w-4" />
          <span>Notify Me</span>
        </button>
      </div>

      <div className="relative border-l-4 border-blue-50 ml-4 space-y-12 pb-8">
        {events.map((event, idx) => (
          <motion.div
            key={event.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative pl-10"
          >
            <div className="absolute left-0 -translate-x-[calc(50%+2px)] top-0 bg-white border-4 border-blue-600 w-6 h-6 rounded-full shadow-md z-10" />
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{event.title}</h3>
                </div>
                <div className="bg-slate-100 text-slate-600 px-4 py-1 rounded-full text-xs font-bold w-fit">
                  {event.tag}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
