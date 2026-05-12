import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Award, CheckCircle2, FileDown, Filter, GitCompare, X, Eye, TrendingUp, Zap, Sparkles, Share2, Lock, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { categories, exams, states, quotas, exportToExcel } from '../constants';
import { College, ExamType, Category, QuotaType, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { getAIInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export default function Predictor() {
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [formData, setFormData] = React.useState({
    rank: '',
    category: Category.GENERAL,
    domicile: 'Maharashtra',
    examType: ExamType.NEET,
    quota: QuotaType.AIQ
  });
  const [results, setResults] = React.useState<College[]>([]);
  const [allColleges, setAllColleges] = React.useState<College[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [filterType, setFilterType] = React.useState<'All' | 'Medical' | 'Engineering' | 'Pharmacy'>('All');
  const [filterState, setFilterState] = React.useState<string>('All');
  const [filterYear, setFilterYear] = React.useState<number>(2026);
  const [filterQuota, setFilterQuota] = React.useState<'All' | QuotaType>('All');
  const [filterOwnership, setFilterOwnership] = React.useState<'All' | 'Government' | 'Private' | 'Aided' | 'Deemed'>('All');
  const [selectedForCompare, setSelectedForCompare] = React.useState<College[]>([]);
  const [showComparison, setShowComparison] = React.useState(false);
  const [expandedTrends, setExpandedTrends] = React.useState<string | null>(null);
  const [quickMatchData, setQuickMatchData] = React.useState({
    rank: '',
    category: Category.GENERAL,
    examType: ExamType.NEET
  });
  const [quickMatchResult, setQuickMatchResult] = React.useState<string | null>(null);
  const [rankError, setRankError] = React.useState<string | null>(null);
  const [quickMatchError, setQuickMatchError] = React.useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = React.useState(false);
  const [adminTab, setAdminTab] = React.useState<'colleges' | 'testimonials'>('colleges');
  const [adminFormData, setAdminFormData] = React.useState({
// ... (college state)
    id: '',
    name: '',
    state: 'Maharashtra',
    city: '',
    examType: ExamType.NEET,
    type: 'Medical' as 'Medical' | 'Engineering',
    quota: QuotaType.AIQ,
    ownership: 'Government' as 'Government' | 'Private' | 'Aided' | 'Deemed',
    cutoffRank: {
      [Category.GENERAL]: 0,
      [Category.OBC]: 0,
      [Category.SC]: 0,
      [Category.ST]: 0,
      [Category.EWS]: 0
    },
    choiceCode: '',
    link: '',
    fees: { tuition: 0, hostel: 0 },
    description: ''
  });

  const [testimonialFormData, setTestimonialFormData] = React.useState({
    studentName: '',
    college: '',
    year: '2024',
    content: '',
    avatarUrl: '',
    rank: ''
  });

  const [aiInsights, setAiInsights] = React.useState<string | null>(null);
  const [loadingAI, setLoadingAI] = React.useState(false);

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testimonialFormData, id: Date.now().toString() })
      });
      if (response.ok) {
        alert("Testimonial added successfully!");
        setTestimonialFormData({ studentName: '', college: '', year: '2024', content: '', avatarUrl: '', rank: '' });
        setShowAdminModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.name || !adminFormData.id) {
      alert("Please fill name and ID");
      return;
    }
    
    try {
      const response = await fetch('/api/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminFormData)
      });
      if (response.ok) {
        alert("College added successfully!");
        setShowAdminModal(false);
        // Reset form
        setAdminFormData({
           id: '', name: '', state: 'Maharashtra', city: '', examType: ExamType.NEET, type: 'Medical', quota: QuotaType.AIQ,
           ownership: 'Government',
           cutoffRank: { [Category.GENERAL]: 0, [Category.OBC]: 0, [Category.SC]: 0, [Category.ST]: 0, [Category.EWS]: 0 },
           choiceCode: '', link: '', fees: { tuition: 0, hostel: 0 }, description: ''
        });
      } else {
        alert("Failed to add college.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  };

  const calculateQuickMatch = (rank: string, category: string, exam: string) => {
    if (!rank) {
      setQuickMatchResult(null);
      setQuickMatchError(null);
      return;
    }
    const r = parseFloat(rank);
    if (isNaN(r) || r <= 0) {
      setQuickMatchError("Invalid rank");
      setQuickMatchResult(null);
      return;
    }

    setQuickMatchError(null);
    let result = "";

    const isCET = exam === ExamType.CET_PCM || exam === ExamType.CET_PCB;

    if (isCET) {
      // Percentile logic
      if (r >= 99.5) result = "Elite (Tier 1)";
      else if (r >= 98) result = "Premier (Tier 2)";
      else if (r >= 95) result = "Solid (Tier 3)";
      else result = "Average (Tier 4)";
    } else {
      // Rank logic (lower is better)
      let adjustedRank = r;
      // Simple adjustment for categories
      if (category === Category.OBC) adjustedRank *= 0.8;
      if (category === Category.SC) adjustedRank *= 0.5;
      if (category === Category.ST) adjustedRank *= 0.3;

      if (adjustedRank < 1000) result = "Elite (Top IITs / AIIMS)";
      else if (adjustedRank < 5000) result = "Premier (Top NITs / State Gov)";
      else if (adjustedRank < 20000) result = "Solid (Good NIRF Govt Colleges)";
      else result = "Average (Semi-Gov / Private)";
    }
    setQuickMatchResult(result);
  };

  const toggleTrends = (id: string) => {
    setExpandedTrends(expandedTrends === id ? null : id);
  };

  const toggleCompare = (college: College) => {
    setSelectedForCompare(prev => {
      const isSelected = prev.find(c => c.id === college.id);
      if (isSelected) {
        return prev.filter(c => c.id !== college.id);
      }
      if (prev.length >= 3) return prev; // Limit to 3
      return [...prev, college];
    });
  };

  const resultsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchInitialData = async () => {
      setFetchError(null);
      try {
        const response = await fetch('/api/colleges');
        if (response.ok) {
          const data = await response.json();
          setAllColleges(data);
        } else {
          setFetchError(`Server returned ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Error fetching initial college data:", err);
        setFetchError(err instanceof Error ? err.message : "Failed to connect to server");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  React.useEffect(() => {
    let unsubUser: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubUser = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile({ uid: user.uid, ...snapshot.data() } as UserProfile);
          } else {
            // Also check for counselor role which might be in counselors collection if needed
            // but for simplicity we assume student profiles are in 'users'
            setUserProfile(null);
          }
        });
      } else {
        setUserProfile(null);
        if (unsubUser) { unsubUser(); unsubUser = null; }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      alert("Please sign in to use the predictor engine.");
      return;
    }
    
    const rankVal = parseFloat(formData.rank);
    if (isNaN(rankVal) || rankVal <= 0) {
      setRankError("Please enter a valid positive rank/percentile");
      return;
    }
    setRankError(null);

    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rank: parseFloat(formData.rank)
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setResults(data);
      setHasSearched(true);
      setFilterYear(2026);

      // Generate AI Insights
      setLoadingAI(true);
      try {
        const insights = await getAIInsights(
          parseFloat(formData.rank),
          formData.category,
          formData.examType,
          data
        );
        setAiInsights(insights);
      } catch (err) {
        console.error("AI Insight Error:", err);
      } finally {
        setLoadingAI(false);
      }

      // Scroll to results after a brief delay for state update
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error(err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch prediction results");
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = React.useMemo(() => {
    return results.filter(c => {
      const typeMatch = filterType === 'All' || c.type === filterType;
      const quotaMatch = filterQuota === 'All' || c.quota === filterQuota;
      const stateMatch = filterState === 'All' || c.state === filterState;
      const ownershipMatch = filterOwnership === 'All' || c.ownership === filterOwnership;
      return typeMatch && quotaMatch && ownershipMatch && stateMatch;
    });
  }, [results, filterType, filterQuota, filterOwnership, filterState]);

  const availableStates = React.useMemo(() => {
    const statesSet = new Set(results.map(c => c.state));
    return ['All', ...Array.from(statesSet).sort()];
  }, [results]);

  const handleShare = (college: College) => {
    const text = `Check out ${college.name} in ${college.city}, ${college.state}. Predicted for my rank by Laxmi Educational Predictor!`;
    const url = window.location.origin;
    
    if (navigator.share) {
      navigator.share({
        title: college.name,
        text: text,
        url: url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleDownload = async () => {
    let dataToExport = filteredResults;
    
    if (dataToExport.length === 0) {
      const confirmFull = window.confirm("No predicted colleges found for your rank. Would you like to download the full list of all available colleges instead?");
      if (confirmFull) {
        if (allColleges.length > 0) {
          dataToExport = allColleges;
        } else {
          try {
            const response = await fetch('/api/colleges');
            dataToExport = await response.json();
            setAllColleges(dataToExport);
          } catch (err) {
            console.error("Failed to fetch all colleges:", err);
            alert("Could not fetch college data.");
            return;
          }
        }
      } else {
        return;
      }
    }

    const exportData = dataToExport.map(c => ({
      'College Name': c.name,
      'City': c.city,
      'State': c.state,
      'Type': c.type,
      'Exam': c.examType,
      'Quota': c.quota,
      'Ownership': c.ownership || 'N/A',
      'General Cutoff': c.cutoffRank?.[Category.GENERAL] || 'N/A',
      'OBC Cutoff': c.cutoffRank?.[Category.OBC] || 'N/A',
      'SC Cutoff': c.cutoffRank?.[Category.SC] || 'N/A',
      'ST Cutoff': c.cutoffRank?.[Category.ST] || 'N/A',
      'EWS Cutoff': c.cutoffRank?.[Category.EWS] || 'N/A',
      'Tuition Fee': c.fees?.tuition || 0,
      'Hostel Fee': c.fees?.hostel || 0,
      'Website Link': c.link
    }));

    if (exportData.length === 0) {
      alert("No data available to download.");
      return;
    }

    exportToExcel(exportData, `Colleges_List_${new Date().toLocaleDateString()}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">College Predictor 2026</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Get precise recommendations based on historical cutoff data for NEET, JEE, and CET. Our smart engine analyzes AIQ and State quota rankings.
        </p>

        {!auth.currentUser && (
          <motion.div 
            id="login-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 flex flex-col items-center gap-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 scale-150">
              <Lock className="h-32 w-32" />
            </div>
            
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Lock className="h-10 w-10 text-white" />
            </div>
            
            <div className="text-center space-y-4 max-w-lg z-10">
              <h2 className="text-3xl font-black italic">Sign In Required</h2>
              <p className="text-blue-100 font-medium">
                Please sign in to access the predictor engine and get personalized recommendations based on your rank.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 z-10">
              <Link 
                to="/auth"
                className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-50 transition"
              >
                Sign In Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {fetchError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-2xl text-sm font-bold flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              <span>{fetchError}</span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="text-[10px] uppercase tracking-widest bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {!initialLoading && allColleges.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 inline-flex items-center space-x-2 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100"
          >
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              Scanning {allColleges.length} Institutions
            </span>
          </motion.div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Entrance Exam</label>
              <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-100 p-1 rounded-xl gap-1">
                {exams.map((exam) => (
                  <button
                    key={exam}
                    type="button"
                    onClick={() => {
                      const newQuota = (exam === ExamType.CET_PCM || exam === ExamType.CET_PCB) 
                        ? QuotaType.STATE 
                        : formData.quota;
                      setFormData({ ...formData, examType: exam, quota: newQuota });
                    }}
                    className={cn(
                      "py-3 px-4 rounded-lg text-sm font-bold transition-all",
                      formData.examType === exam ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {exam}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Quota Type</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {quotas.map((quota) => (
                  <button
                    key={quota}
                    type="button"
                    disabled={(formData.examType === ExamType.CET_PCM || formData.examType === ExamType.CET_PCB) && quota === QuotaType.AIQ}
                    onClick={() => setFormData({ ...formData, quota: quota })}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all",
                      formData.quota === quota ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700",
                      (formData.examType === ExamType.CET_PCM || formData.examType === ExamType.CET_PCB) && quota === QuotaType.AIQ && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {quota}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 ml-1 italic mt-1">
                Tip: 'State Quota' search also includes all eligible 'All India Quota' institutions.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                {(formData.examType === ExamType.CET_PCM || formData.examType === ExamType.CET_PCB) ? "CET Percentile / Score (%)" : "All India Rank (AIR)"}
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  step="any"
                  placeholder={(formData.examType === ExamType.CET_PCM || formData.examType === ExamType.CET_PCB) ? "e.g., 98.5" : "e.g., 12500"}
                  value={formData.rank}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, rank: val });
                    if (val && parseFloat(val) > 0) setRankError(null);
                  }}
                  className={cn(
                    "w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition",
                    rankError && "border-red-500 focus:ring-red-500"
                  )}
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1 italic">
                {(formData.examType === ExamType.CET_PCM || formData.examType === ExamType.CET_PCB) 
                  ? "Note: For CET, enter your Percentile (e.g., 89.5). Higher is better." 
                  : "Note: For NEET/JEE, enter your All India Rank (AIR). Lower is better."}
              </p>
              {rankError && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{rankError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Domicile State</label>
              <select
                value={formData.domicile}
                onChange={(e) => setFormData({ ...formData, domicile: e.target.value })}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none cursor-pointer"
              >
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg transition shadow-lg shadow-blue-200 flex items-center justify-center space-x-3",
                  loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 active:scale-[0.98]"
                )}
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Find Eligible Colleges</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Range Predictor */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap className="h-32 w-32" />
        </div>
        
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Instant Estimate</span>
            </div>
            <h2 className="text-2xl font-black mb-2">Quick Prediction Engine</h2>
            <p className="text-slate-400 text-sm">Get an instant overview of your potential tier before diving into detail analytics.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Exam Type</label>
              <select 
                value={quickMatchData.examType}
                onChange={(e) => {
                  const newExam = e.target.value as ExamType;
                  setQuickMatchData(prev => ({ ...prev, examType: newExam }));
                  calculateQuickMatch(quickMatchData.rank, quickMatchData.category, newExam);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer"
              >
                {exams.map(e => <option key={e} value={e} className="bg-slate-900">{e}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
              <select 
                value={quickMatchData.category}
                onChange={(e) => {
                  const newCat = e.target.value as Category;
                  setQuickMatchData(prev => ({ ...prev, category: newCat }));
                  calculateQuickMatch(quickMatchData.rank, newCat, quickMatchData.examType);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rank / Percentile</label>
              <input 
                type="number"
                placeholder="Enter score..."
                value={quickMatchData.rank}
                className={cn(
                  "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 transition",
                  quickMatchError && "border-red-500 focus:ring-red-500"
                )}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuickMatchData(prev => ({ ...prev, rank: val }));
                  calculateQuickMatch(val, quickMatchData.category, quickMatchData.examType);
                }}
              />
              {quickMatchError && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{quickMatchError}</p>}
            </div>
            
            <div className="flex flex-col justify-end">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 h-full flex flex-col justify-center min-h-[64px]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Likely Institution Tier</p>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    quickMatchResult ? "bg-emerald-500 animate-pulse" : "bg-slate-700"
                  )} />
                  <span className={cn(
                    "font-black transition-all",
                    quickMatchResult ? "text-emerald-400 text-lg" : "text-slate-600 text-sm italic"
                  )}>
                    {quickMatchResult || "Enter data..."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {hasSearched && (
        <motion.div
          ref={resultsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 space-y-12 scroll-mt-24"
        >
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 pb-8">
            <div className="flex flex-col space-y-4 flex-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Predicted Institutions</h2>
              <p className="text-slate-500 font-medium text-sm">Based on your rank and selected preferences</p>
            </div>
            
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition shadow-xl shadow-emerald-200"
            >
              <FileDown className="h-5 w-5" />
              <span>Export results</span>
            </button>
          </div>

          {/* AI Guidance Section */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative bg-white rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-50/50 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">AI Counselor Insights</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Personalized for Your Profile</p>
                </div>
                {loadingAI && (
                  <div className="ml-auto flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyzing...</span>
                  </div>
                )}
              </div>

              {aiInsights ? (
                  <div className="prose prose-slate prose-sm max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-900 markdown-body">
                    <ReactMarkdown>{aiInsights}</ReactMarkdown>
                  </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-4 bg-slate-50 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-slate-50 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-slate-50 rounded-full w-5/6 animate-pulse" />
                </div>
              )}
              
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400 font-medium">This analysis is AI-generated based on current trends. For absolute certainty, consult our human experts.</p>
                <Link 
                  to="/online-guidance"
                  className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition"
                >
                  Expert Counseling
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Filter className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">Active Result Filters</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredResults.length} Matching Predictors</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setFilterType('All');
                    setFilterState('All');
                    setFilterQuota('All');
                    setFilterOwnership('All');
                    setFilterYear(2026);
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition active:scale-95"
                >
                  <X className="h-3 w-3" />
                  Clear All Filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Institution Type</label>
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {(['All', 'Medical', 'Engineering', 'Pharmacy'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={cn(
                          "flex-1 px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition",
                          filterType === type ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {type === 'Engineering' ? 'Eng.' : type === 'Pharmacy' ? 'Phar.' : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* State Filter */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Location / State</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                    <select
                      value={filterState}
                      onChange={(e) => setFilterState(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm cursor-pointer"
                    >
                      {availableStates.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ) )}
                    </select>
                  </div>
                </div>

                {/* Quota Filter */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Admission Quota</label>
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {(['All', QuotaType.AIQ, QuotaType.STATE] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setFilterQuota(q)}
                        className={cn(
                          "flex-1 px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition",
                          filterQuota === q ? "bg-orange-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ownership Filter */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ownership Model</label>
                  <select
                    value={filterOwnership}
                    onChange={(e) => setFilterOwnership(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm cursor-pointer"
                  >
                    {['All', 'Government', 'Private', 'Aided', 'Deemed'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 pt-6 border-t border-slate-200/60">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Year:</span>
                  <div className="flex items-center space-x-1.5">
                    {[2026, 2025, 2024, 2023].map((y) => (
                      <button
                        key={y}
                        onClick={() => setFilterYear(y)}
                        className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-black transition-all",
                          filterYear === y 
                            ? "bg-slate-900 text-white shadow-lg" 
                            : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1" />

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                  <Sparkles className="h-3 w-3 text-blue-600" />
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Historical Data Sync Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredResults.map((college, idx) => (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-blue-300 transition group relative overflow-hidden flex flex-col shadow-sm"
              >
                  <div className="absolute top-0 right-0 p-6 flex flex-col items-end space-y-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-1",
                      college.type === 'Medical' ? "bg-red-50 text-red-600" : "bg-cyan-50 text-cyan-600"
                    )}>
                      {college.type}
                    </span>
                    {college.ownership && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        {college.ownership}
                      </span>
                    )}
                    <button
                      onClick={() => handleShare(college)}
                      className="flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                      title="Share College"
                    >
                      <Share2 className="h-3 w-3" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => toggleCompare(college)}
                    className={cn(
                        "flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition",
                        selectedForCompare.find(c => c.id === college.id)
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    <GitCompare className="h-3 w-3" />
                    <span>{selectedForCompare.find(c => c.id === college.id) ? 'Selected' : 'Compare'}</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-100 transition">
                      <Award className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1 pr-12">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{college.name}</h3>
                        {college.choiceCode && (
                          <div className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
                            <Zap className="h-3 w-3" />
                            <span>Choice Code: {college.choiceCode}</span>
                          </div>
                        )}
                        {college.nirfRanking && (
                          <span className="inline-flex items-center bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-orange-100">
                            NIRF #{college.nirfRanking}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-700 font-bold flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                          {college.city}, {college.state}
                        </p>
                        {college.description && (
                          <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-2">
                            {college.description}
                          </p>
                        )}
                        {college.link && (
                          <a 
                            href={college.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition flex items-center w-fit gap-1"
                          >
                            <span>Visit Official Website</span>
                            <Eye className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 bg-slate-50/50 -mx-8 px-8 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {(college.examType === ExamType.CET_PCM || college.examType === ExamType.CET_PCB) ? "Cutoff Percentile" : "Cutoff Ranks"}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">
                          Year {filterYear}
                        </span>
                        <div className="h-px w-8 bg-slate-100" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-4 gap-x-2">
                      {Object.values(Category).map((cat) => {
                        const getTrendRank = () => {
                          if (filterYear === 2026) return college.cutoffRank[cat];
                          const trend = college.historicalTrends?.[cat as Category]?.find(t => t.year === filterYear);
                          return trend ? trend.rank : null;
                        };
                        const displayRank = getTrendRank();

                        return (
                          <div key={cat} className="flex flex-col p-2 rounded-xl bg-white border border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{cat}</span>
                            <span className={cn(
                              "text-xs font-black",
                              formData.category === cat ? "text-blue-600" : "text-slate-900"
                            )}>
                              {displayRank ? (
                                <>
                                  {displayRank.toLocaleString()}
                                  {(college.examType === ExamType.CET_PCM || college.examType === ExamType.CET_PCB) && "%"}
                                </>
                              ) : "N/A"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Estimated Annual Fees</h4>
                      <div className="flex items-center space-x-1 bg-amber-50 px-2 py-0.5 rounded text-[9px] font-bold text-amber-700 border border-amber-100">
                        <Sparkles className="h-2 w-2" />
                        <span>APPROXIMATE</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tuition Fees</p>
                        <p className="text-lg font-black text-slate-900">₹{college.fees?.tuition.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Hostel Fees</p>
                        <p className="text-lg font-black text-slate-900">₹{college.fees?.hostel.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-[10px] text-slate-400 italic">
                      Disclaimer: Fees mentioned above are indicative based on previous academic sessions. Actual fees may vary.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-bold text-slate-700">Possible</span>
                      </div>
                      {college.historicalTrends?.[formData.category as Category] && (
                        <button
                          onClick={() => toggleTrends(college.id)}
                          className={cn(
                            "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition",
                            expandedTrends === college.id ? "bg-slate-900 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          )}
                        >
                          <TrendingUp className="h-3 w-3" />
                          <span>{expandedTrends === college.id ? 'Hide Trends' : 'View Trends'}</span>
                        </button>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs px-3 py-1 rounded-lg font-black uppercase tracking-widest",
                      college.quota === QuotaType.AIQ ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {college.quota}
                    </span>
                  </div>

                  <AnimatePresence>
                    {expandedTrends === college.id && college.historicalTrends?.[formData.category as Category] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-2" />
                            {formData.category} Cutoff Trend (5 Years)
                          </h4>
                          <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={college.historicalTrends?.[formData.category as Category]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="year" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                  dy={10}
                                />
                                <YAxis 
                                  hide 
                                  domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const isCET = college.examType === ExamType.CET_PCM || college.examType === ExamType.CET_PCB;
                                      return (
                                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/10">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Year {payload[0].payload.year}</p>
                                          <p className="text-sm font-black">{isCET ? 'Percentile' : 'Rank'}: {payload[0].value?.toLocaleString()}{isCET && '%'}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                {filterYear !== 2026 && (
                                  <ReferenceLine x={filterYear} stroke="#2563eb" strokeDasharray="3 3" />
                                )}
                                <Line 
                                  type="monotone" 
                                  dataKey="rank" 
                                  stroke="#2563eb" 
                                  strokeWidth={3} 
                                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-4 italic">
                            {(college.examType === ExamType.CET_PCM || college.examType === ExamType.CET_PCB) 
                              ? "* Note: Higher percentile indicates higher competitiveness. Data based on merit lists."
                              : "* Note: Lower rank indicates higher competitiveness. Data based on round-1 results."}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredResults.length === 0 && (
            <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="bg-white h-24 w-24 rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-8 text-slate-300">
                <Filter className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">
                {results.length > 0 ? "No colleges match your filter" : "No matching colleges found"}
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                {results.length > 0 
                  ? "We found eligible colleges for your rank, but they were filtered out by your current view settings (Type, Quota, or Ownership)."
                  : `We couldn't find any institutions matching your core criteria (${formData.examType}, ${formData.category}, rank ${formData.rank}). Try broadening your search.`
                }
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => {
                    if (results.length > 0) {
                      setFilterType('All');
                      setFilterQuota('All');
                      setFilterOwnership('All');
                      setFilterState('All');
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition shadow-xl shadow-blue-100 uppercase tracking-widest text-xs min-w-[200px]"
                >
                  {results.length > 0 ? "Clear Filters" : "Modify Search"}
                </button>
                <button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await fetch('/api/colleges');
                      const all = await response.json();
                      setResults(all);
                      setFilterType('All');
                      setFilterQuota('All');
                      setFilterOwnership('All');
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition shadow-sm uppercase tracking-widest text-xs min-w-[200px]"
                >
                  View All Institutions
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Admin Action Button */}
      <div className="mt-12 flex justify-center">
        <button 
          onClick={() => setShowAdminModal(true)}
          className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-2"
        >
          <Filter className="h-3 w-3" />
          <span>Admin: Manage Database</span>
        </button>
      </div>

      {/* Admin Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900">Admin Console</h2>
                <button onClick={() => setShowAdminModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                <button 
                  onClick={() => setAdminTab('colleges')}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition",
                    adminTab === 'colleges' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Colleges
                </button>
                <button 
                  onClick={() => setAdminTab('testimonials')}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition",
                    adminTab === 'testimonials' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Testimonials
                </button>
              </div>

              {adminTab === 'colleges' ? (
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Unique ID (e.g., aiims-delhi)</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={adminFormData.id} onChange={e => setAdminFormData({...adminFormData, id: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">College Name</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={adminFormData.name} onChange={e => setAdminFormData({...adminFormData, name: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">City</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={adminFormData.city} onChange={e => setAdminFormData({...adminFormData, city: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Exam Type</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={adminFormData.examType} onChange={e => setAdminFormData({...adminFormData, examType: e.target.value as ExamType})}>
                        {exams.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Quota</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={adminFormData.quota} onChange={e => setAdminFormData({...adminFormData, quota: e.target.value as QuotaType})}>
                        {quotas.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Ownership</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={adminFormData.ownership} onChange={e => setAdminFormData({...adminFormData, ownership: e.target.value as any})}>
                        {['Government', 'Private', 'Aided', 'Deemed'].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                     <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Cutoff Ranks / Percentiles</p>
                     <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                       {categories.map(cat => (
                         <div key={cat} className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-400">{cat}</label>
                           <input 
                             type="number" 
                             step="any"
                             className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" 
                             value={adminFormData.cutoffRank[cat]} 
                             onChange={e => setAdminFormData({
                               ...adminFormData, 
                               cutoffRank: { ...adminFormData.cutoffRank, [cat]: parseFloat(e.target.value) }
                             })} 
                           />
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Tuition Fee</label>
                        <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={adminFormData.fees.tuition} onChange={e => setAdminFormData({...adminFormData, fees: {...adminFormData.fees, tuition: parseInt(e.target.value)}})} />
                     </div>
                     <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Hostel Fee</label>
                        <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={adminFormData.fees.hostel} onChange={e => setAdminFormData({...adminFormData, fees: {...adminFormData.fees, hostel: parseInt(e.target.value)}})} />
                     </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Website Link</label>
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={adminFormData.link} onChange={e => setAdminFormData({...adminFormData, link: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition">
                    Save College
                  </button>
                </form>
              ) : (
                <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Student Name</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={testimonialFormData.studentName} onChange={e => setTestimonialFormData({...testimonialFormData, studentName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">College Name</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={testimonialFormData.college} onChange={e => setTestimonialFormData({...testimonialFormData, college: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Score / Rank</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="e.g. AIR 45" value={testimonialFormData.rank} onChange={e => setTestimonialFormData({...testimonialFormData, rank: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Year</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={testimonialFormData.year} onChange={e => setTestimonialFormData({...testimonialFormData, year: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Student Photo URL</label>
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="https://..." value={testimonialFormData.avatarUrl} onChange={e => setTestimonialFormData({...testimonialFormData, avatarUrl: e.target.value})} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Testimonial Content</label>
                    <textarea rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={testimonialFormData.content} onChange={e => setTestimonialFormData({...testimonialFormData, content: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition">
                    Save Testimonial
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Compare Bar */}
      <AnimatePresence>
        {selectedForCompare.length > 0 && (
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
            >
                <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-xl">
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-500 p-2 rounded-xl">
                            <GitCompare className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">{selectedForCompare.length} Colleges selected</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Limit 3 colleges</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setSelectedForCompare([])}
                            className="text-xs font-bold text-slate-400 hover:text-white transition"
                        >
                            Clear
                        </button>
                        <button 
                            onClick={() => setShowComparison(true)}
                            className="bg-white text-slate-900 px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition"
                        >
                            Compare Now
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowComparison(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900">College Comparison</h2>
                            <p className="text-sm text-slate-500">Comparing {selectedForCompare.length} selected institutions</p>
                        </div>
                        <button 
                            onClick={() => setShowComparison(false)}
                            className="p-3 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-auto p-8">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-6 text-left bg-slate-50 rounded-tl-3xl border-b border-slate-100 w-48">Criteria</th>
                                    {selectedForCompare.map(college => (
                                        <th key={college.id} className="p-6 text-left border-b border-slate-100 min-w-[250px]">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="bg-blue-50 p-2 rounded-lg">
                                                    <Award className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                                    college.type === 'Medical' ? "bg-red-50 text-red-600" : "bg-cyan-50 text-cyan-600"
                                                )}>
                                                    {college.type}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900 leading-tight">{college.name}</h4>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Location</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            <div className="flex items-center text-slate-700 font-bold">
                                                <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                                                {college.city}, {college.state}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Quota</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            <span className={cn(
                                                "px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest",
                                                college.quota === QuotaType.AIQ ? "bg-orange-100 text-orange-600" : "bg-purple-100 text-purple-600"
                                            )}>
                                                {college.quota}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Ownership</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-emerald-100 text-emerald-600">
                                                {college.ownership || 'N/A'}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                {Object.values(Category).map(cat => (
                                    <tr key={cat}>
                                        <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">{cat} Cutoff</td>
                                        {selectedForCompare.map(college => (
                                            <td key={college.id} className="p-6 border-b border-slate-50 font-black text-slate-900 text-base">
                                                {college.cutoffRank[cat].toLocaleString()}
                                                {(college.examType === ExamType.CET_PCM || college.examType === ExamType.CET_PCB) && "%"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">NIRF Ranking</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            {college.nirfRanking ? (
                                                <div className="flex items-center space-x-2">
                                                    <Award className="h-5 w-5 text-orange-500" />
                                                    <span className="text-lg font-black text-slate-900">#{college.nirfRanking}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-bold italic">N/A</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Tuition Fee</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            <div className="text-lg font-black text-slate-900">₹{college.fees?.tuition.toLocaleString()}</div>
                                            <p className="text-[10px] text-slate-400 italic">Per annum</p>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Hostel Fee</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6 border-b border-slate-50">
                                            <div className="text-lg font-black text-slate-900">₹{college.fees?.hostel.toLocaleString()}</div>
                                            <p className="text-[10px] text-slate-400 italic">Approximate</p>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-bl-3xl">Action</td>
                                    {selectedForCompare.map(college => (
                                        <td key={college.id} className="p-6">
                                            <button 
                                                onClick={() => toggleCompare(college)}
                                                className="text-red-500 font-bold hover:underline"
                                            >
                                                Remove from comparison
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
