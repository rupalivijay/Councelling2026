import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Users, BookOpen, MessageSquare, Video, ShieldCheck, X, Search, MapPin, Building, GraduationCap, ArrowRight, ExternalLink } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { College } from '../types';
import { cn } from '../lib/utils';

export default function Institute() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bookingStatus, setBookingStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [allColleges, setAllColleges] = React.useState<College[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('All');
  const [selectedOwnership, setSelectedOwnership] = React.useState<string>('All');
  const [selectedYear, setSelectedYear] = React.useState<string>('2026');
  const [isLoadingColleges, setIsLoadingColleges] = React.useState(true);

  React.useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/colleges');
        if (response.ok) {
          const data = await response.json();
          setAllColleges(data);
        }
      } catch (err) {
        console.error("Error fetching colleges:", err);
      } finally {
        setIsLoadingColleges(false);
      }
    };
    fetchColleges();
  }, []);

  const filteredColleges = React.useMemo(() => {
    let filtered = allColleges;

    // Type Filter
    if (selectedType !== 'All') {
      filtered = filtered.filter(c => c.type === selectedType);
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.city.toLowerCase().includes(query) ||
        c.state.toLowerCase().includes(query) ||
        (c.branch && c.branch.toLowerCase().includes(query))
      );
    }

    // Ownership Filter
    if (selectedOwnership !== 'All') {
      filtered = filtered.filter(c => c.ownership === selectedOwnership);
    }

    // Year Filter
    if (selectedYear !== '2026') {
      const yearInt = parseInt(selectedYear);
      filtered = filtered.filter(c => {
        if (!c.historicalTrends) return false;
        return Object.values(c.historicalTrends).some(trends => 
          trends && trends.some(t => t.year === yearInt)
        );
      });
    }

    return filtered; // Show all filtered matches
  }, [allColleges, searchQuery, selectedType, selectedOwnership, selectedYear]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Please login to book a session.");
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'appointments'), {
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        type: 'General Counseling',
        status: 'scheduled',
        timestamp: serverTimestamp(),
      });
      setBookingStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setBookingStatus('idle');
      }, 2000);
    } catch (err) {
      console.error(err);
      setBookingStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-5xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
             Experience World-Class <br />
            <span className="text-blue-600">Counseling Expertise</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            EduCounsel is a premier consultancy dedicated to helping students navigate the complex path to medical and engineering careers. We provide data-driven insights and strategic planning for NEET, JEE, and CET aspirants.
          </p>
          <div className="grid gap-6 mb-10">
            <ServiceHighlight 
              icon={Target}
              title="Strategic Choice Filling"
              desc="We help you arrange college preferences to maximize allotment chances based on category and rank."
            />
            <ServiceHighlight 
              icon={Users}
              title="1-on-1 Guidance"
              desc="Personalized sessions with industry veterans to resolve every query about the CAP rounds."
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition"
          >
            Book Professional Session
          </button>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-4 sm:pt-12">
            <StatsBox value="15k+" label="Students Assisted" color="bg-blue-600" />
            <StatsBox value="2,500+" label="Top Colleges" color="bg-indigo-600" />
          </div>
          <div className="space-y-4">
            <StatsBox value="98%" label="Success Rate" color="bg-emerald-600" />
            <StatsBox value="10+" label="Years Experience" color="bg-orange-600" />
          </div>
        </div>
      </div>

      <section className="bg-slate-900 rounded-[4rem] p-12 lg:p-20 text-white mb-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4 tracking-tight">Our Specialized Services</h2>
          <p className="text-slate-400">Comprehensive support for every stage of your admission journey.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <ConsultingStep icon={MessageSquare} title="Initial Counseling" />
          <ConsultingStep icon={Video} title="AIQ Strategy" />
          <ConsultingStep icon={BookOpen} title="State Round Prep" />
          <ConsultingStep icon={ShieldCheck} title="Admission Support" />
        </div>
      </section>

      {/* College Directory Section */}
      <section id="directory" className="mb-20">
        <div className="flex flex-col space-y-6 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Institute Directory</h2>
              <p className="text-slate-600 font-medium">Explore over 2,500+ premier medical and engineering colleges.</p>
            </div>
            
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text"
                placeholder="Search by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-900 shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center p-4 bg-slate-50 border border-slate-100 rounded-3xl">
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Category:</span>
              <div className="flex gap-2">
                {['All', 'Medical', 'Engineering', 'Pharmacy'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSelectedType(opt)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      selectedType === opt 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Ownership:</span>
              <div className="flex gap-2">
                {['All', 'Government', 'Private', 'Aided', 'Deemed'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSelectedOwnership(opt)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      selectedOwnership === opt 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 md:ml-auto">
              <Target className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition-all cursor-pointer"
              >
                {['2026', '2025', '2024', '2023'].map(year => (
                  <option key={year} value={year}>{year} Intake</option>
                ))}
              </select>
            </div>
            
            {(selectedType !== 'All' || selectedOwnership !== 'All' || selectedYear !== '2026' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setSelectedType('All');
                  setSelectedOwnership('All');
                  setSelectedYear('2026');
                  setSearchQuery('');
                }}
                className="ml-auto text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-2"
              >
                Reset All <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {isLoadingColleges ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-slate-100 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredColleges.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredColleges.map((college) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={college.id}
                  className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-600 transition-colors">
                        <Building className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        college.type === 'Medical' ? "bg-red-50 text-red-600" : 
                        college.type === 'Pharmacy' ? "bg-amber-50 text-amber-600" :
                        "bg-teal-50 text-teal-600"
                      )}>
                        {college.type}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight flex items-start gap-2">
                      {college.name}
                    </h3>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-slate-500 text-sm font-bold">
                        <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                        {college.city}, {college.state}
                      </div>
                      <div className="flex items-center text-slate-500 text-sm font-bold">
                        <GraduationCap className="h-4 w-4 mr-2 text-slate-400" />
                        {college.examType} {college.branch ? `• ${college.branch}` : ''}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-blue-600/60">
                        {college.ownership}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="text-xs font-bold text-slate-400">
                      Code: <span className="text-slate-900">{college.choiceCode}</span>
                    </div>
                    <a 
                      href={college.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-black text-xs uppercase tracking-widest flex items-center gap-1"
                    >
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[3rem] p-20 text-center">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No Institutes Found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your search query to find the college you're looking for.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-8 text-blue-600 font-black uppercase tracking-widest text-xs flex items-center gap-2 mx-auto"
            >
              Clear Search <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-10">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Book Your Session</h3>
              <p className="text-slate-500 mb-8">Schedule a 30-min discovery call with our top counselor.</p>
              
              {!currentUser ? (
                <div className="bg-slate-50 p-6 rounded-2xl text-center">
                  <p className="text-slate-600 mb-4 font-medium">You need to be logged in to book a session.</p>
                  <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Please use the login button in the header</p>
                </div>
              ) : (
                <form onSubmit={handleBook} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Student Name</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={currentUser.displayName || ''} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Email Address</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={currentUser.email || ''} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting || bookingStatus === 'success'}
                    className={cn(
                      "w-full py-4 rounded-xl font-black text-lg transition shadow-lg",
                      bookingStatus === 'success' ? "bg-emerald-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                    )}
                  >
                    {isSubmitting ? "Processing..." : bookingStatus === 'success' ? "Booked Successfully!" : "Confirm Appointment"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ServiceHighlight({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex space-x-4">
      <div className="bg-blue-50 p-3 rounded-2xl h-fit">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <div>
        <h4 className="text-xl font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StatsBox({ value, label, color }: { value: string, label: string, color: string }) {
  return (
    <div className={cn("p-8 rounded-[2.5rem] text-white flex flex-col justify-end h-64 shadow-xl", color)}>
      <span className="text-4xl font-black mb-2">{value}</span>
      <span className="text-white/80 font-bold uppercase tracking-widest text-xs">{label}</span>
    </div>
  );
}

function ConsultingStep({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center group hover:bg-white/10 transition">
      <Icon className="h-10 w-10 text-blue-400 mb-6 group-hover:scale-110 transition" />
      <h5 className="font-bold text-lg">{title}</h5>
    </div>
  );
}
