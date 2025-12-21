import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, 
  updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  Shield, Users, FileText, Settings as SettingsIcon, LogOut, Plus, Trash2, 
  Save, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, 
  AlertTriangle, Upload, Download, Eye, RefreshCw
} from 'lucide-react';

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyDAU3qUSdj97I08ga6byIoFQb_pf0b3EeI",
  authDomain: "e-i-b-e-p-r-o-mideabank-muwplu.firebaseapp.com",
  projectId: "e-i-b-e-p-r-o-mideabank-muwplu",
  storageBucket: "e-i-b-e-p-r-o-mideabank-muwplu.firebasestorage.app",
  messagingSenderId: "567962116529",
  appId: "1:567962116529:web:e70eb712555bc6c9175d90"
};
// --- Types ---
type Question = {
  id: string;
  text: string;
  options: string[];
};

type AnswerKey = {
  id: string;
  correctIndex: number;
};

type StudentField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'tel' | 'select';
  required: boolean;
  options?: string[]; // Comma separated for editing, array for usage
};

type AppSettings = {
  timerMinutes: number;
  passScore: number;
  adminEmail: string;
  studentFields: StudentField[];
};

type StudentResult = {
  id: string;
  studentData: any;
  answers: Record<string, number>;
  score?: number; // Calculated on client for display
  total?: number;
  passed?: boolean;
  timestamp: any;
};

// --- Default Data (From User's Word Doc) ---
const DEFAULT_QUESTIONS_DATA = [
  { id: '1', text: "“Health” in occupational health refers mainly to:", options: ["Preventing physical injuries only", "Avoiding all exposure to chemicals at work", "Promoting complete physical, mental, and social well-being", "Ensuring workers are medically fit for employment"], correctIndex: 2 },
  { id: '2', text: "Which example best represents a psychosocial hazard?", options: ["Excessive heat exposure inside a unit", "High noise levels near compressors", "Harassment, overwhelming workload, or job insecurity", "Use of defective lifting equipment"], correctIndex: 2 },
  { id: '3', text: "A strong safety culture in a refinery is built primarily on:", options: ["Strict punishment for every mistake", "Encouraging reporting, learning, and proactive prevention", "Minimizing communication to avoid confusion", "Relying completely on experienced staff"], correctIndex: 1 },
  { id: '4', text: "The main purpose of the Permit to Work (PTW) system is to:", options: ["Restrict routine work", "Control non-routine and hazardous work activities", "Approve overtime requests", "Identify skilled workers only"], correctIndex: 1 },
  { id: '5', text: "Which situation requires a Hot Work Permit?", options: ["Opening a drain valve", "Performing welding inside a tank", "Checking insulation", "Taking a water sample"], correctIndex: 1 },
  { id: '6', text: "A Lockout/Tagout (LOTO) procedure primarily ensures:", options: ["All tools are clean before use", "Energy sources are isolated and cannot be re-energized", "Workers work faster during shutdown", "Only electrical hazards are controlled"], correctIndex: 1 },
  { id: '7', text: "During LOTO, which of the following is MOST critical?", options: ["Using new padlocks", "Verifying zero energy after isolation", "Tag color", "Number of workers involved"], correctIndex: 1 },
  { id: '8', text: "H₂S poses the highest danger because:", options: ["It is non-toxic but flammable", "It causes olfactory fatigue, making smell unreliable", "It is flammable but non-toxic", "It is only found in pipelines"], correctIndex: 1 },
  { id: '9', text: "A worker suddenly collapses in an area known for H₂S. What is the FIRST action?", options: ["Run in and drag the worker out", "Hold your breath and assist", "Call for help, don SCBA, and only then perform rescue", "Wait until someone else arrives"], correctIndex: 2 },
  { id: '10', text: "Carbon monoxide (CO) is dangerous mainly because it:", options: ["Has a strong irritating odor", "Displaces oxygen by binding to hemoglobin", "Is usually visible as white gas", "Only occurs in confined spaces"], correctIndex: 1 },
  { id: '11', text: "SO₂ exposure is best described as:", options: ["A simple asphyxiant non-toxic", "A gas causing respiratory irritation and corrosive effects", "An anesthetic gas", "Physically harmless in small doses"], correctIndex: 1 },
  { id: '12', text: "In hazardous area classification, the primary purpose is to:", options: ["Calculate explosion overpressure", "Assign appropriate electrical equipment for the gas risk", "Determine PPE rotation", "Identify the best evacuation route"], correctIndex: 1 },
  { id: '13', text: "A refinery unit with continuous presence of flammable vapor under normal operation is typically classified as:", options: ["Zone 0", "Zone 1", "Zone 2", "Non-classified area"], correctIndex: 0 },
  { id: '14', text: "A difference between Zone 1 and Zone 2 is:", options: ["Zone 1 is safer than Zone 2", "Zone 2 means flammable gas is not expected during normal operation", "Zone 2 requires ATEX Group IIC always", "Zone 1 does not require explosion-proof equipment"], correctIndex: 1 },
  { id: '15', text: "Which of the following is a chemical hazard?", options: ["Unprotected machine gears", "Benzene vapors in a pump house", "Working at height", "High-voltage panels"], correctIndex: 1 },
  { id: '16', text: "Which of the following best fits a process safety hazard?", options: ["A worker slipping on a wet floor", "Failure of a high-pressure reactor leading to major release", "A worker lifting incorrectly", "Sun exposure"], correctIndex: 1 },
  { id: '17', text: "Physical hazard examples include:", options: ["Flammable gases", "Heat, noise, vibration, and radiation", "Ergonomic strain", "Workload pressure"], correctIndex: 1 },
  { id: '18', text: "LOPA (Layer of Protection Analysis) is used to:", options: ["Replace detailed risk assessments", "Evaluate the adequacy of independent protection layers", "Approve design drawings", "Eliminate all process risks"], correctIndex: 1 },
  { id: '19', text: "Which of the following is considered an Independent Protection Layer (IPL) in LOPA?", options: ["Operator experience", "A relief valve with proper design and maintenance", "A checklist", "A warning sign"], correctIndex: 1 },
  { id: '20', text: "A scenario involves a high-pressure vessel that could overpressure. Which combination is MOST consistent with LOPA?", options: ["“We rely on operator skill only.”", "“We have alarms, interlocks, and a PSV.”", "“We hope it doesn’t happen.”", "“We ignore rare events.”"], correctIndex: 1 },
  { id: '21', text: "A key lesson from the Piper Alpha disaster is:", options: ["Offshore platforms must be made of concrete", "Poor permit-to-work coordination can escalate catastrophic events", "Gas fires can be extinguished easily", "Evacuation is always safe regardless of fire spread"], correctIndex: 1 },
  { id: '22', text: "Piper Alpha demonstrated the importance of:", options: ["Perfectly predicting all failures", "Tight control of simultaneous operations and maintenance activities", "Allowing hot work at any time", "Removing all safety valves"], correctIndex: 1 },
  { id: '23', text: "Which failure contributed most to the escalation during Piper Alpha?", options: ["Strong communication between shifts", "Incomplete isolation and missing blinds during maintenance", "Excessive attention to alarms", "Proper gas detection"], correctIndex: 1 },
  { id: '24', text: "You arrive at a job site with strong solvent odor. Workers say “We think it’s safe.” Your FIRST action is:", options: ["Proceed with the job", "Continue if you don’t smell anything", "Stop work, assess, and verify atmosphere with proper gas detection", "Open nearby valves to ventilate"], correctIndex: 2 },
  { id: '25', text: "During routine inspection, you see an electrician using a non-Ex rated drill in a Zone 1 area. You should:", options: ["Ignore it because it’s only temporary", "Allow it if the job is urgent", "Stop the job and explain the hazard before restarting safely", "Ask him to hurry and finish quickly"], correctIndex: 2 },
  { id: '26', text: "You observe two technicians entering a confined space without gas testing. The correct response is:", options: ["Wait for them to start before stopping them", "Stop them immediately and enforce confined space procedures", "Allow entry if ventilation is running", "Let them enter if the job is simple"], correctIndex: 1 },
  { id: '27', text: "A worker complains of dizziness and headache while working near process burners. Which gas exposure is MOST likely?", options: ["Oxygen", "Carbon monoxide", "H₂S at 700 ppm concentration", "Argon"], correctIndex: 1 },
  { id: '28', text: "You find a pump with repeated seal leaks. What is the safest action?", options: ["Increase production to compensate", "Ignore as long as no alarms occur", "Report for maintenance and evaluate for process safety implications", "Place a cloth to absorb leakage"], correctIndex: 2 },
  { id: '29', text: "Oxidative stress in occupational exposure is best described as:", options: ["A process where antioxidants increase uncontrolled", "Imbalance between oxidants and antioxidants causing DNA damage", "A mechanical failure in body systems", "A short-term irritation only"], correctIndex: 1 },
  { id: '30', text: "Which lifestyle factor can worsen oxidative stress and occupational exposure effects?", options: ["Balanced diet rich in fruits", "Adequate sleep", "Chronic smoking and poor diet", "Regular physical activity"], correctIndex: 2 }
];

const DEFAULT_SETTINGS: AppSettings = {
  timerMinutes: 45,
  passScore: 60,
  adminEmail: "testENG@eprom.com",
  studentFields: [
    { id: 'f1', label: 'Full Name', type: 'text', required: true },
    { id: 'f2', label: 'Phone Number', type: 'tel', required: true },
    { id: 'f3', label: 'ID', type: 'text', required: true },
    { id: 'f4', label: 'Department', type: 'select', required: true, options: ['Mechanical', 'Electrical', 'Process', 'Civil', 'HSE', 'IT'] },
    { id: 'f5', label: 'Group', type: 'select', required: true, options: ['A', 'B', 'C', 'D'] },
  ]
};

// --- Components ---

const AdminLogin = ({ onLogin, onResetRequest }: { onLogin: () => void, onResetRequest: () => void }) => {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === "admin123") {
      onLogin();
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Access</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
            Login
          </button>
        </form>
        <button onClick={onResetRequest} className="mt-4 text-sm text-blue-600 hover:text-blue-800 w-full text-center">
          Forgot Password?
        </button>
      </div>
    </div>
  );
};

const StudentRegistration = ({ 
  fields, 
  onStart 
}: { 
  fields: StudentField[], 
  onStart: (data: any) => void 
}) => {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(formData);
  };

  const handleChange = (id: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-900">Competence Exam</h1>
          <p className="text-gray-500 mt-2">Please complete your registration</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select 
                  required={field.required}
                  className="w-full border rounded p-2 bg-white"
                  onChange={(e) => handleChange(field.label, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type={field.type}
                  required={field.required}
                  className="w-full border rounded p-2"
                  onChange={(e) => handleChange(field.label, e.target.value)}
                />
              )}
            </div>
          ))}
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition mt-6">
            Start Exam
          </button>
        </form>
      </div>
    </div>
  );
};

const ExamInterface = ({ 
  questions, 
  durationMins, 
  studentName, 
  onSubmit 
}: { 
  questions: Question[], 
  durationMins: number, 
  studentName: string, 
  onSubmit: (answers: Record<string, number>) => void 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(durationMins * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const handleSelect = (idx: number) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: idx }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (questions.length === 0) return <div className="p-10 text-center">Loading Exam...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-gray-800">{studentName}</h2>
          <span className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</span>
        </div>
        <div className={`text-xl font-mono font-bold flex items-center gap-2 ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-6 min-h-[400px]">
          <h3 className="text-xl font-medium mb-6 text-gray-800 leading-relaxed">
            {currentQ.text}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = answers[currentQ.id] === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`p-4 border rounded-lg cursor-pointer transition flex items-center gap-3
                    ${isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-gray-200'}
                  `}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                    ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}
                  `}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="text-gray-700">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t p-4">
        <div className="container mx-auto max-w-3xl flex justify-between">
          <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft size={20} /> Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-bold"
            >
              Submit Exam <CheckCircle size={20} />
            </button>
          ) : (
            <button 
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center gap-2 px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Next <ChevronRight size={20} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'student-login' | 'student-exam' | 'student-done' | 'admin-login' | 'admin-dash'>('student-login');
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [studentData, setStudentData] = useState<any>(null);
  
  // Admin State
  const [activeTab, setActiveTab] = useState<'results' | 'questions' | 'settings'>('results');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [secureKeys, setSecureKeys] = useState<Record<string, number>>({});

  // Auth Init
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Fetch Settings & Questions (Public)
  useEffect(() => {
    if (!user) return;
    
    // Fetch Settings - UPDATED PATH: config/settings (even number of segments)
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
    }, (err) => console.log("Settings fetch err", err));

    // Fetch Public Questions (No Answers)
    const qQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'questions'));
    const unsubQs = onSnapshot(qQuery, (snap) => {
      const qs: Question[] = [];
      snap.forEach(d => qs.push(d.data() as Question));
      // Sort by ID to keep order
      qs.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setQuestions(qs);
    }, (err) => console.log("Q fetch err", err));

    return () => { unsubSettings(); unsubQs(); };
  }, [user]);

  // Admin: Fetch Results & Secure Keys
  useEffect(() => {
    if (view === 'admin-dash' && user) {
      // Fetch Keys
      const kQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'secure_keys'));
      const unsubKeys = onSnapshot(kQuery, (snap) => {
        const keys: Record<string, number> = {};
        snap.forEach(d => {
          const data = d.data() as AnswerKey;
          keys[data.id] = data.correctIndex;
        });
        setSecureKeys(keys);
      }, (err) => console.log("Key fetch err", err));

      // Fetch Submissions
      const sQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'));
      const unsubSubs = onSnapshot(sQuery, (snap) => {
        const res: StudentResult[] = [];
        snap.forEach(d => res.push({ id: d.id, ...d.data() } as StudentResult));
        setResults(res);
      }, (err) => console.log("Sub fetch err", err));

      return () => { unsubKeys(); unsubSubs(); };
    }
  }, [view, user]);

  const handleStudentStart = (data: any) => {
    setStudentData(data);
    setView('student-exam');
  };

  const handleStudentSubmit = async (answers: Record<string, number>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        studentData,
        answers,
        timestamp: serverTimestamp()
      });
      setView('student-done');
    } catch (err) {
      alert("Error submitting. Please try again.");
    }
  };

  const handleResetRequest = () => {
    const email = prompt("Enter Recovery Email:");
    if (email === settings.adminEmail) {
      alert("Instructions sent to email (simulated). Default is admin123");
    } else {
      alert("Email not recognized.");
    }
  };

  // --- Admin Actions ---

  const initDatabase = async () => {
    if (!confirm("This will overwrite existing questions. Continue?")) return;
    
    for (const q of DEFAULT_QUESTIONS_DATA) {
      const { correctIndex, ...publicQ } = q;
      
      // Save Public Question
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'questions', q.id), publicQ);
      
      // Save Secure Key
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'secure_keys', q.id), {
        id: q.id,
        correctIndex: correctIndex
      });
    }
    
    // Save Default Settings - UPDATED PATH
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings'), DEFAULT_SETTINGS);
    
    alert("Database Initialized Successfully!");
  };

  const calculateScore = (result: StudentResult) => {
    if (Object.keys(secureKeys).length === 0) return { score: 0, total: 0, percent: 0, pass: false };
    
    let score = 0;
    let total = 0;
    
    Object.keys(secureKeys).forEach(qId => {
      total++;
      if (result.answers[qId] === secureKeys[qId]) {
        score++;
      }
    });
    
    const percent = Math.round((score / total) * 100);
    return { score, total, percent, pass: percent >= settings.passScore };
  };

  // --- Render ---

  if (view === 'student-login') {
    return (
      <>
        <div className="absolute top-4 right-4">
          <button onClick={() => setView('admin-login')} className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <Shield size={16} /> Admin
          </button>
        </div>
        <StudentRegistration fields={settings.studentFields} onStart={handleStudentStart} />
      </>
    );
  }

  if (view === 'student-exam') {
    return (
      <ExamInterface 
        questions={questions} 
        durationMins={settings.timerMinutes} 
        studentName={studentData?.['Full Name'] || "Student"}
        onSubmit={handleStudentSubmit} 
      />
    );
  }

  if (view === 'student-done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-6">
        <div className="bg-white p-10 rounded-lg shadow-xl max-w-md">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Exam Submitted</h2>
          <p className="text-gray-600 mb-6">Your answers have been securely recorded. You may close this window.</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (view === 'admin-login') {
    return <AdminLogin onLogin={() => setView('admin-dash')} onResetRequest={handleResetRequest} />;
  }

  if (view === 'admin-dash') {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="p-6 font-bold text-xl tracking-wider border-b border-gray-800">ADMIN PANEL</div>
          <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => setActiveTab('results')} className={`w-full flex items-center gap-3 p-3 rounded transition ${activeTab === 'results' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
              <Users size={20} /> Results
            </button>
            <button onClick={() => setActiveTab('questions')} className={`w-full flex items-center gap-3 p-3 rounded transition ${activeTab === 'questions' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
              <FileText size={20} /> Questions
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 p-3 rounded transition ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
              <SettingsIcon size={20} /> Settings
            </button>
          </nav>
          <button onClick={() => setView('student-login')} className="p-4 flex items-center gap-3 hover:bg-red-900 transition text-red-300">
            <LogOut size={20} /> Logout
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'results' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Student Results</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-sm">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map(r => {
                      const stats = calculateScore(r);
                      // Handle potential null timestamp during local latency compensation
                      const dateStr = r.timestamp ? r.timestamp.toDate().toLocaleString() : 'Syncing...';
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium">{r.studentData['Full Name'] || 'N/A'}</td>
                          <td className="p-4 text-gray-500">{r.studentData['ID'] || 'N/A'}</td>
                          <td className="p-4 text-sm text-gray-500">{dateStr}</td>
                          <td className="p-4 font-mono">{stats.score}/{stats.total} ({stats.percent}%)</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${stats.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {stats.pass ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {results.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-500">No submissions yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Question Bank</h2>
                <div className="space-x-2">
                   <button onClick={initDatabase} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm">
                    <RefreshCw size={16} /> Load Default Exam
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
                    <Plus size={16} /> Add Question
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-lg">Q{q.id}: {q.text}</h4>
                      <div className="flex gap-2">
                         <button className="p-1 text-gray-400 hover:text-blue-600"><SettingsIcon size={16} /></button>
                         <button className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <ul className="mt-2 text-sm text-gray-600 ml-4 list-disc">
                      {q.options.map((opt, i) => (
                        <li key={i} className={i === secureKeys[q.id] ? "text-green-600 font-bold" : ""}>
                          {opt} {i === secureKeys[q.id] && "(Correct)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-2xl">
               <h2 className="text-2xl font-bold mb-6 text-gray-800">Exam Configuration</h2>
               
               {/* General Settings */}
               <div className="bg-white p-6 rounded shadow mb-6">
                 <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Parameters</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium">Timer (Minutes)</label>
                     <input 
                        type="number" 
                        value={settings.timerMinutes} 
                        onChange={(e) => setSettings({...settings, timerMinutes: parseInt(e.target.value)})}
                        className="w-full border p-2 rounded mt-1" 
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium">Passing Score (%)</label>
                     <input 
                        type="number" 
                        value={settings.passScore}
                        onChange={(e) => setSettings({...settings, passScore: parseInt(e.target.value)})}
                        className="w-full border p-2 rounded mt-1" 
                     />
                   </div>
                 </div>
                 <button 
                    onClick={() => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings'), settings)}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                 >
                   <Save size={16} /> Save Changes
                 </button>
               </div>

               {/* Field Editor */}
               <div className="bg-white p-6 rounded shadow">
                 <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Student Registration Fields</h3>
                 <div className="space-y-3 mb-4">
                   {settings.studentFields.map((field, idx) => (
                     <div key={field.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                       <span className="font-mono text-xs text-gray-400 w-6">{idx+1}</span>
                       <input 
                          value={field.label} 
                          onChange={(e) => {
                            const newFields = [...settings.studentFields];
                            newFields[idx].label = e.target.value;
                            setSettings({...settings, studentFields: newFields});
                          }}
                          className="border p-1 rounded flex-1 text-sm" 
                       />
                       <select 
                          value={field.type}
                          onChange={(e) => {
                            const newFields = [...settings.studentFields];
                            newFields[idx].type = e.target.value as any;
                            setSettings({...settings, studentFields: newFields});
                          }}
                          className="border p-1 rounded text-sm"
                       >
                         <option value="text">Text</option>
                         <option value="number">Number</option>
                         <option value="select">Dropdown</option>
                       </select>
                       <button 
                          onClick={() => {
                             const newFields = settings.studentFields.filter((_, i) => i !== idx);
                             setSettings({...settings, studentFields: newFields});
                          }}
                          className="text-red-500 hover:text-red-700"
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>
                   ))}
                 </div>
                 <button 
                    onClick={() => setSettings({
                      ...settings, 
                      studentFields: [...settings.studentFields, { id: Date.now().toString(), label: 'New Field', type: 'text', required: true }]
                    })}
                    className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                 >
                   <Plus size={14} /> Add Field
                 </button>
               </div>
             </div>
          )}
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
}