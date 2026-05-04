import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Github, Chrome, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Auth() {
  const [isLogin, setIsLogin] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        navigate(from, { replace: true });
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Update profile
        await updateProfile(result.user, {
          displayName: formData.name
        });

        // Create user record in Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: formData.name,
          role: 'student',
          isPaid: false,
          createdAt: serverTimestamp(),
          savedColleges: [],
          notificationSettings: {
            scheduleUpdates: true,
            meritListAlerts: true,
            choiceFillingReminders: true,
            emailNotifications: true
          }
        });

        setSuccess(true);
        setTimeout(() => navigate(from, { replace: true }), 1500);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Sign-in method is disabled. Please enable it in the Firebase Console.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Email already registered. Try logging in.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password.");
      } else if (err.code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      
      const userRef = doc(db, 'users', u.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || 'User',
          role: 'student',
          isPaid: false,
          createdAt: serverTimestamp(),
          savedColleges: [],
          notificationSettings: {
            scheduleUpdates: true,
            meritListAlerts: true,
            choiceFillingReminders: true,
            emailNotifications: true
          }
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Google sign-in is disabled. Please enable it in the Firebase Console.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup blocked. Please allow popups for this site.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Login cancelled.");
      } else {
        setError(err.message || "Google login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-[1.5rem] mb-4 shadow-xl shadow-blue-200">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isLogin ? "Welcome Back" : "Join Laxmi Education"}
          </h1>
          <p className="text-slate-500 font-bold mt-2">
            {isLogin 
              ? "Access your personalized counseling dashboard" 
              : "Register to get started with your college journey"}
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex p-2 bg-slate-50">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={cn(
                "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                isLogin ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={cn(
                "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                !isLogin ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Register
            </button>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Account Created!</h3>
                  <p className="text-slate-500 font-bold">Redirecting you to dashboard...</p>
                </motion.div>
              ) : (
                <motion.form 
                  key={isLogin ? 'login' : 'register'}
                  initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  onSubmit={handleAuth}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          required
                          type="text"
                          placeholder="John Doe"
                          className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        required
                        type="email"
                        placeholder="email@example.com"
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        required
                        type="password"
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          required
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition"
                          value={formData.confirmPassword}
                          onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-xs font-bold"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-base flex items-center justify-center space-x-3 hover:bg-slate-800 transition shadow-xl shadow-slate-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isLogin ? "Sign In" : "Create Account"}</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                      <span className="bg-white px-4 text-slate-400">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="flex items-center justify-center gap-3 w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 font-bold text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Chrome className="h-5 w-5" />
                      <span>Google Account</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-400 text-xs font-bold">
          By continuing, you agree to Laxmi Education's <br />
          <span className="text-slate-900 underline">Terms of Service</span> and <span className="text-slate-900 underline">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}
