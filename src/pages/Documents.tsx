import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Search, HelpCircle, AlertCircle, Clock, FilePlus } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { UserDocument, DocumentStatus } from '../types';
import { cn } from '../lib/utils';

const initialDocs = [
  { name: "NEET/JEE Admit Card", required: true },
  { name: "Score Card / Rank Letter", required: true },
  { name: "Class 10th Certificate (DOB Probe)", required: true },
  { name: "Class 12th Marksheet", required: true },
  { name: "Category Certificate (SC/ST/OBC/EWS)", required: false },
  { name: "Domicile Certificate", required: true },
  { name: "Medical Fitness Certificate", required: true },
  { name: "Transfer Certificate / LC", required: true },
];

export default function Documents() {
  const [userDocs, setUserDocs] = React.useState<UserDocument[]>([]);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const q = query(collection(db, 'users', user.uid, 'documents'));
        const unsubDocs = onSnapshot(q, (snapshot) => {
          const docsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as UserDocument[];
          setUserDocs(docsData);
          setLoading(false);
        }, (err) => {
            console.warn("Document snapshot stream closed (often due to idle timeout):", err.message);
            setLoading(false);
        });
        return () => unsubDocs();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const [uploading, setUploading] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});

  const handleUpload = async (docName: string) => {
    if (!currentUser) return alert("Please login first.");
    
    setUploading(docName);
    setUploadProgress(prev => ({ ...prev, [docName]: 0 }));

    // Simulate progress increments
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(prev => ({ ...prev, [docName]: i }));
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    const docId = docName.replace(/[\s/]+/g, '_').toLowerCase();
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'documents', docId), {
        name: docName,
        status: 'Uploaded',
        updatedAt: serverTimestamp(),
        url: 'https://example.com/mock-doc.pdf' // Mock URL
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  const getDocStatus = (docName: string) => {
    return userDocs.find(d => d.name === docName);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Document Vault</h1>
        <p className="text-slate-500">Securely manage and track your document verification status.</p>
      </div>

      {!currentUser && (
          <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem] text-center mb-12">
            <h3 className="text-xl font-bold text-blue-900 mb-2">Login to track status</h3>
            <p className="text-blue-600 mb-4">Your document status will be visible here once you log in.</p>
          </div>
      )}

      <div className="grid gap-4">
        {initialDocs.map((docItem, idx) => {
          const status = getDocStatus(docItem.name);
          return (
            <motion.div
              key={docItem.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-slate-200 rounded-[2rem] group shadow-sm hover:shadow-md transition gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className={cn(
                    "p-2 rounded-full transition bg-slate-50",
                    status?.status === 'Verified' ? "bg-emerald-50" : status?.status === 'Needs Attention' ? "bg-red-50" : ""
                )}>
                  {status?.status === 'Verified' ? (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                  ) : status?.status === 'Needs Attention' ? (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                  ) : status?.status === 'Uploaded' ? (
                      <Clock className="h-6 w-6 text-blue-500 animate-pulse" />
                  ) : (
                      <FilePlus className="h-6 w-6 text-slate-300 group-hover:text-blue-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-800">{docItem.name}</span>
                    {docItem.required && !status && (
                      <span className="text-[10px] font-black uppercase tracking-tighter bg-red-100 text-red-600 px-2 py-0.5 rounded">Mandatory</span>
                    )}
                  </div>
                  {status && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                            status.status === 'Verified' ? "bg-emerald-100 text-emerald-600" :
                            status.status === 'Needs Attention' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        )}>
                            {status.status}
                        </span>
                        {status.feedback && (
                            <span className="text-xs text-red-500 font-bold italic">"{status.feedback}"</span>
                        )}
                      </div>
                  )}
                  {uploading === docItem.name && (
                    <div className="mt-3 w-full md:w-64">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-blue-600 uppercase">Uploading...</span>
                        <span className="text-[10px] font-black text-blue-600">{uploadProgress[docItem.name]}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-blue-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress[docItem.name]}%` }}
                          className="h-full bg-blue-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <input 
                type="file"
                id={`file-${idx}`}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleUpload(docItem.name);
                  }
                }}
              />
              <button 
                onClick={() => document.getElementById(`file-${idx}`)?.click()}
                disabled={status?.status === 'Verified' || status?.status === 'Uploaded'}
                className={cn(
                    "md:w-32 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition border-2",
                    status?.status === 'Verified' ? "border-emerald-100 text-emerald-300 cursor-not-allowed" :
                    status?.status === 'Uploaded' ? "border-blue-100 text-blue-300 cursor-not-allowed" : "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                )}
              >
                {uploading === docItem.name ? 'Uploading...' : status?.status === 'Needs Attention' ? 'Re-upload' : status?.status === 'Uploaded' ? 'Awaiting' : status?.status === 'Verified' ? 'Success' : 'Upload'}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-16 bg-blue-600 rounded-[3rem] p-12 text-white relative overflow-hidden">
        <HelpCircle className="absolute -bottom-10 -right-10 h-64 w-64 text-white/10" />
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-black mb-4">Verification Issues?</h2>
          <p className="text-blue-100 mb-8 leading-relaxed">If any of your documents are marked 'Needs Attention', review the feedback and re-upload the correct format immediately.</p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold shadow-xl">Contact Support</button>
        </div>
      </div>
    </div>
  );
}
