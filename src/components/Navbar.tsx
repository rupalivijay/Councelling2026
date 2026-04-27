import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, FileText, Building2, Calendar, Menu, X, LogIn, LogOut, User, Settings, ShieldCheck, UserCheck, Library, Video } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const navItems = [
  { name: 'Predictor', path: '/predictor', icon: GraduationCap },
  { name: 'Online Guidance', path: '/online-guidance', icon: Video },
  { name: 'Document Vault', path: '/documents', icon: FileText },
  { name: 'Institute', path: '/institute', icon: Building2 },
  { name: 'Schedule', path: '/schedule', icon: Calendar },
  { name: 'About Counselor', path: '/about', icon: UserCheck },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [isCounselor, setIsCounselor] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const counselorDoc = await getDoc(doc(db, 'counselors', u.uid));
        setIsCounselor(counselorDoc.exists());
      } else {
        setIsCounselor(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0399691610.firebasestorage.app/o/logo.png?alt=media" 
                alt="Laxmi Educational Logo" 
                className="h-10 w-auto"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails to load from storage
                  e.currentTarget.src = "https://placehold.co/100x100/f97316/ffffff?text=LE";
                }}
              />
              <span className="text-xl font-bold text-slate-900 tracking-tight">Laxmi Educational</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center space-x-1.5 text-sm font-medium transition-colors hover:text-blue-600",
                  location.pathname === item.path ? "text-blue-600" : "text-slate-600"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="h-6 w-px bg-slate-200 mx-2" />

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/settings" className="p-2 text-slate-400 hover:text-blue-600 transition" title="Notification Settings">
                    <Settings className="h-5 w-5" />
                </Link>
                {isCounselor && (
                    <Link to="/counselor" className="p-2 text-slate-400 hover:text-emerald-600 transition" title="Counselor Dashboard">
                        <ShieldCheck className="h-5 w-5" />
                    </Link>
                )}
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate">{user.displayName}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-600 transition p-1"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-blue-600 transition"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu content */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 py-4 px-4 space-y-2">
          {user && (
             <div className="flex items-center space-x-3 px-3 py-4 border-b border-slate-50 mb-2">
                <img src={user.photoURL || ''} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
                <div>
                  <div className="font-bold text-slate-900">{user.displayName}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
             </div>
          )}
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors",
                location.pathname === item.path ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
          <div className="pt-4 space-y-2">
            {!user ? (
               <button 
                onClick={() => { handleLogin(); setIsOpen(false); }}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md"
               >
                 <LogIn className="h-5 w-5" />
                 <span>Login with Google</span>
               </button>
            ) : (
                <button 
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
