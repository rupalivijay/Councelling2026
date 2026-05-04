import React from 'react';
import { motion } from 'motion/react';
import { Users, FileCheck, AlertCircle, CheckCircle, ExternalLink, ShieldAlert, X, Video, Calendar as CalendarIcon, Clock, Link as LinkIcon, MessageCircle, Phone, Mail } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collectionGroup, getDocs, doc, updateDoc, getDoc, serverTimestamp, query, orderBy, onSnapshot, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { UserDocument, DocumentStatus } from '../types';
import { cn } from '../lib/utils';
import ChatWindow from '../components/ChatWindow';

export default function CounselorDashboard() {
  const [students, setStudents] = React.useState<any[]>([]);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCounselor, setIsCounselor] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null);
  const [feedback, setFeedback] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<'docs' | 'chat' | 'appointments' | 'leads' | 'students'>('docs');
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [leads, setLeads] = React.useState<any[]>([]);
  const [chatUsers, setChatUsers] = React.useState<any[]>([]);

  React.useEffect(() => {
    let unsubChats: (() => void) | null = null;
    let unsubLeads: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const counselorDoc = await getDoc(doc(db, 'counselors', user.uid));
        if (counselorDoc.exists()) {
          setIsCounselor(true);
          fetchStudents();
          fetchAppointments();
          
          // Real-time leads
          const leadsQuery = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
          unsubLeads = onSnapshot(leadsQuery, (snapshot) => {
            setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });

          // Real-time all users
          const usersQuery = query(collection(db, 'users'));
          unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });
          
          // Real-time chat users list
          const q = query(collectionGroup(db, 'messages'), orderBy('timestamp', 'desc'));
          unsubChats = onSnapshot(q, (snapshot) => {
            const usersMap: Record<string, any> = {};
            snapshot.forEach((doc) => {
              const path = doc.ref.path.split('/');
              const studentId = path[1];
              const data = doc.data();
              if (!usersMap[studentId]) {
                usersMap[studentId] = {
                  id: studentId,
                  lastMessage: data.text,
                  lastTimestamp: data.timestamp,
                  studentName: data.senderId === studentId ? data.senderName : "Support Chat"
                };
              }
            });
            setChatUsers(Object.values(usersMap));
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, 'collectionGroup:messages');
          });
        } else {
            setLoading(false);
        }
      } else {
        setIsCounselor(false);
        setLoading(false);
        if (unsubChats) { unsubChats(); unsubChats = null; }
        if (unsubLeads) { unsubLeads(); unsubLeads = null; }
        if (unsubUsers) { unsubUsers(); unsubUsers = null; }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubChats) unsubChats();
      if (unsubLeads) unsubLeads();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      const querySnapshot = await getDocs(collectionGroup(db, 'appointments'));
      const apps: any[] = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ref: doc.ref, ...doc.data() });
      });
      setAppointments(apps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAppointment = async (app: any, status: string, link = "") => {
    try {
      await updateDoc(app.ref, { 
        status, 
        meetingLink: link || app.meetingLink || "" 
      });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLead = async (leadId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), { status });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePaid = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isPaid: !currentStatus
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Check permissions.");
    }
  };

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collectionGroup(db, 'documents'));
      const docsByStudent: Record<string, any> = {};
      
      querySnapshot.forEach((doc) => {
        const path = doc.ref.path.split('/');
        const studentId = path[1];
        if (!docsByStudent[studentId]) {
          docsByStudent[studentId] = { id: studentId, docs: [] };
        }
        docsByStudent[studentId].docs.push({ id: doc.id, ...doc.data() });
      });

      setStudents(Object.values(docsByStudent));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [processingDocId, setProcessingDocId] = React.useState<string | null>(null);

  const handleStatusUpdate = async (studentId: string, docId: string, status: DocumentStatus) => {
    try {
      setProcessingDocId(docId);
      await new Promise(resolve => setTimeout(resolve, 2000));

      await updateDoc(doc(db, 'users', studentId, 'documents', docId), {
        status,
        feedback: status === 'Needs Attention' ? feedback : "",
        updatedAt: serverTimestamp()
      });
      alert(`Document marked as ${status}`);
      setFeedback("");
      fetchStudents();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingDocId(null);
    }
  };

  if (loading) return <div className="p-20 text-center">Verifying Counselor access...</div>;
  if (!isCounselor) return (
    <div className="max-w-2xl mx-auto px-4 py-32 text-center">
      <ShieldAlert className="h-20 w-20 text-red-100 mx-auto mb-6" />
      <h1 className="text-3xl font-black text-slate-900 mb-4">Access Restricted</h1>
      <p className="text-slate-500 mb-8">This portal is only accessible to verified counselors. Please contact admin if you need access.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-wrap justify-between items-end mb-16 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Verification Portal</h1>
          <p className="text-slate-500">Review and verify student documents for CAP rounds.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100">
            <Users className="h-4 w-4" />
            <span className="text-sm font-bold">{students.length} Students</span>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-bold">{chatUsers.length} Chats</span>
          </div>
          <div className="flex items-center space-x-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full border border-orange-100">
            <Video className="h-4 w-4" />
            <span className="text-sm font-bold">{appointments.length} Sessions</span>
          </div>
          <div className="flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full border border-purple-100">
            <Users className="h-4 w-4" />
            <span className="text-sm font-bold">{leads.length} Leads</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 mb-8 flex space-x-2 overflow-x-auto">
        {[
          { id: 'docs', label: 'Check Documents' },
          { id: 'students', label: 'Manage Access' },
          { id: 'appointments', label: 'Manage Meetings' },
          { id: 'leads', label: 'Demo Requests' },
          { id: 'chat', label: 'Student Chats' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "whitespace-nowrap py-2 px-4 rounded-xl text-sm font-bold transition",
              activeTab === tab.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'docs' ? (
          students.map((student) => (
            <motion.div 
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Student ID</span>
                  <h3 className="font-bold text-slate-900">{student.id}</h3>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex -space-x-2">
                    {student.docs.map((d: any) => (
                      <div 
                          key={d.id} 
                          className={cn(
                              "w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black uppercase text-white shadow-sm",
                              d.status === 'Verified' ? "bg-emerald-500" : d.status === 'Needs Attention' ? "bg-red-500" : "bg-blue-500"
                          )}
                          title={d.name}
                      >
                          {d.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(student)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition"
                  >
                    Review Documents
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : activeTab === 'appointments' ? (
          <div className="grid gap-6">
            {appointments.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <Video className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">No meeting requests yet.</p>
              </div>
            ) : (
              appointments.map((app) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                        app.status === 'pending' ? "bg-orange-100 text-orange-600" :
                        app.status === 'scheduled' ? "bg-blue-100 text-blue-600" :
                        app.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {app.status}
                      </span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Meeting ID: {app.id.slice(-6)}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{app.subject || 'Guidance Session'}</h3>
                    <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Users className="h-4 w-4" />
                        <span>{app.studentName || app.studentId}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{app.date}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{app.time}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-blue-600">
                        <Video className="h-4 w-4" />
                        <span>{app.platform}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {app.status === 'pending' && (
                      <button 
                        onClick={() => {
                          const link = prompt("Enter Meeting Link (e.g. Google Meet URL):");
                          if (link) handleUpdateAppointment(app, 'scheduled', link);
                        }}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                      >
                        Confirm Slot
                      </button>
                    )}
                    {app.status === 'scheduled' && (
                      <>
                        <button 
                          onClick={() => handleUpdateAppointment(app, 'completed')}
                          className="bg-emerald-50 text-emerald-600 px-6 py-2.5 rounded-xl text-sm font-black hover:bg-emerald-100 transition"
                        >
                          Mark Done
                        </button>
                        {app.meetingLink && (
                          <a 
                            href={app.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition"
                            title="Join Meeting"
                          >
                            <LinkIcon className="h-5 w-5" />
                          </a>
                        )}
                      </>
                    )}
                    <button 
                      onClick={() => handleUpdateAppointment(app, 'cancelled')}
                      className="text-slate-400 hover:text-red-600 transition p-2"
                      title="Cancel"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : activeTab === 'leads' ? (
          <div className="grid gap-6">
            {leads.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">No demo requests yet.</p>
              </div>
            ) : (
              leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-8"
                >
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        lead.status === 'new' ? "bg-purple-100 text-purple-600" :
                        lead.status === 'contacted' ? "bg-blue-100 text-blue-600" :
                        lead.status === 'converted' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {lead.status}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{lead.createdAt?.toDate().toLocaleDateString()}</span>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-1">{lead.name}</h3>
                      <p className="text-slate-500 font-bold">{lead.subject}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <a href={`tel:${lead.phone}`} className="flex items-center space-x-3 text-slate-600 hover:text-blue-600 transition">
                        <div className="p-2 bg-slate-50 rounded-xl"><Phone className="h-4 w-4" /></div>
                        <span className="font-bold">{lead.phone}</span>
                      </a>
                      <a href={`mailto:${lead.email}`} className="flex items-center space-x-3 text-slate-600 hover:text-blue-600 transition">
                        <div className="p-2 bg-slate-50 rounded-xl"><Mail className="h-4 w-4" /></div>
                        <span className="font-bold">{lead.email}</span>
                      </a>
                    </div>

                    <div className="flex items-center space-x-6 text-sm font-bold text-slate-400">
                      <div className="flex items-center space-x-1.5"><CalendarIcon className="h-4 w-4" /><span>{lead.preferredDate}</span></div>
                      <div className="flex items-center space-x-1.5"><Clock className="h-4 w-4" /><span>{lead.preferredTime}</span></div>
                      <div className="flex items-center space-x-1.5 text-orange-600"><Video className="h-4 w-4" /><span>{lead.platform}</span></div>
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end gap-3">
                    <button 
                      onClick={() => handleUpdateLead(lead.id, 'contacted')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                    >
                      Mark Contacted
                    </button>
                    <button 
                      onClick={() => handleUpdateLead(lead.id, 'converted')}
                      className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-100 transition"
                    >
                      Converted
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : activeTab === 'students' ? (
          <div className="grid gap-6">
            {allUsers.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">No students registered yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Info</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-blue-600 text-xl">
                                                {user.displayName?.charAt(0) || user.email?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-slate-900">{user.displayName || "Incomplete Profile"}</h4>
                                                <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center space-x-2">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full",
                                                user.isPaid ? "bg-emerald-500" : "bg-slate-300"
                                            )} />
                                            <span className={cn(
                                                "text-xs font-black uppercase tracking-tighter",
                                                user.isPaid ? "text-emerald-600" : "text-slate-400"
                                            )}>
                                                {user.isPaid ? "Paid Access" : "Free Access"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {user.role !== 'counselor' ? (
                                            <button 
                                                onClick={() => handleTogglePaid(user.id, !!user.isPaid)}
                                                className={cn(
                                                    "px-6 py-2.5 rounded-xl font-black text-xs transition shadow-lg",
                                                    user.isPaid 
                                                        ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 shadow-none" 
                                                        : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"
                                                )}
                                            >
                                                {user.isPaid ? "Revoke Permission" : "Enable Permission"}
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Counselor</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        ) : activeTab === 'chat' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chatUsers.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">No active chats found.</p>
                    </div>
                ) : (
                    chatUsers.map((user) => (
                        <motion.div
                            key={user.id}
                            whileHover={{ y: -4 }}
                            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                            onClick={() => setSelectedStudent({ id: user.id, docs: [] })}
                        >
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <MessageCircle className="h-6 w-6" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-black text-slate-900 truncate">Student: {user.id.slice(-8)}</h3>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest truncate">{user.studentName}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-xs text-slate-600 line-clamp-2 italic mb-2">"{user.lastMessage}"</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {user.lastTimestamp?.toDate ? user.lastTimestamp.toDate().toLocaleString() : 'Recent'}
                                    </span>
                                    <span className="text-xs font-black text-blue-600 group-hover:underline">Open Chat →</span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        ) : null}
      </div>

      {/* Review Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Student Submission: {selectedStudent.id}</h2>
                <p className="text-sm text-slate-500">Reviewing {selectedStudent.docs.length} documents</p>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="flex bg-slate-50 border-b border-slate-100 p-2 space-x-2">
                <button 
                    onClick={() => setActiveTab('docs')}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition",
                        activeTab === 'docs' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-100"
                    )}
                >
                    Documents
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition",
                        activeTab === 'chat' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-100"
                    )}
                >
                    Chat with Student
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'docs' ? (
                  <div className="space-y-6">
                    {selectedStudent.docs.map((doc: any) => (
                        <div key={doc.id} className="p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <FileCheck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{doc.name}</h4>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded",
                                    doc.status === 'Verified' ? "bg-emerald-100 text-emerald-600" : 
                                    doc.status === 'Needs Attention' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {doc.status}
                                </span>
                            </div>
                            </div>
                            {doc.url && (
                                <a 
                                    href={doc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-2 text-sm font-bold text-blue-600 hover:underline"
                                >
                                    <span>View Document</span>
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </div>

                        <div className="md:w-72 space-y-3">
                            <button 
                            onClick={() => handleStatusUpdate(selectedStudent.id, doc.id, 'Verified')}
                            disabled={!!processingDocId}
                            className={cn(
                                "w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition",
                                processingDocId === doc.id ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            )}
                            >
                            {processingDocId === doc.id ? (
                                <div className="flex items-center space-x-2">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full"
                                    />
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Approve</span>
                                </>
                            )}
                            </button>
                            <div className="space-y-2">
                                <textarea 
                                    placeholder="Rejection reason..." 
                                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    disabled={!!processingDocId}
                                />
                                <button 
                                    onClick={() => handleStatusUpdate(selectedStudent.id, doc.id, 'Needs Attention')}
                                    disabled={!!processingDocId}
                                    className={cn(
                                        "w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition",
                                        processingDocId === doc.id ? "bg-slate-100 text-slate-400" : "bg-red-50 text-red-600 hover:bg-red-100"
                                    )}
                                >
                                    {processingDocId === doc.id ? (
                                        <span>Please wait...</span>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-4 w-4" />
                                            <span>Reject</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        </div>
                    ))}
                  </div>
              ) : (
                  <div className="h-full">
                      <ChatWindow userId={selectedStudent.id} userName={`Chat with ${selectedStudent.id}`} role="counselor" />
                  </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
