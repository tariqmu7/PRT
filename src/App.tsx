import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, FileText, Settings as SettingsIcon, LogOut, CheckCircle, Clock, ChevronLeft, ChevronRight, 
  RefreshCw, Download, 
  Server, Wifi, WifiOff
} from 'lucide-react';

// --- Types ---
type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex?: number;
};

type StudentField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'tel' | 'select';
  required: boolean;
  options?: string[];
};

type AppSettings = {
  timerMinutes: number;
  passScore: number;
  adminEmail: string;
  studentFields: StudentField[];
  backendUrl?: string; // e.g., https://your-project.vercel.app/api/handler
};

type StudentResult = {
  id: string;
  studentData: any;
  answers: Record<string, number>;
  score?: number;
  total?: number;
  passed?: boolean;
  timestamp: string;
};

// --- Fallback Data (Offline Mode) ---
const DEFAULT_QUESTIONS_DATA: Question[] = [
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
  ],
  backendUrl: ""
};

// --- Components ---

const HeaderLogo = () => (
  <div className="flex items-center gap-3">
    <img src="/logo.png" alt="EPROM" className="h-12 object-contain" onError={(e) => {
      e.currentTarget.style.display = 'none';
      const fallback = document.getElementById('text-logo-fallback');
      if (fallback) fallback.style.display = 'flex';
    }}/>
    <div id="text-logo-fallback" className="flex flex-col" style={{display: 'none'}}>
      <span className="text-xl font-black tracking-tight text-blue-900">EPROM</span>
      <span className="text-xs text-gray-500 uppercase tracking-widest">Operation & Maintenance</span>
    </div>
  </div>
);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-blue-500">
        <div className="flex justify-center mb-8">
           <Shield className="w-16 h-16 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Admin Portal</h2>
        <p className="text-center text-gray-500 mb-8">Restricted Access Only</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Access Key</label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter admin password"
            />
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center font-medium">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 transition transform hover:scale-[1.02] active:scale-95 shadow-lg">
            Login to Dashboard
          </button>
        </form>
        <button onClick={onResetRequest} className="mt-6 text-sm text-gray-500 hover:text-blue-600 w-full text-center underline decoration-dotted">
          Forgot Password?
        </button>
      </div>
    </div>
  );
};

const StudentRegistration = ({ fields, onStart }: { fields: StudentField[], onStart: (data: any) => void }) => {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(formData);
  };

  const handleChange = (id: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] bg-cover opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10">
          <HeaderLogo />
          <div className="mt-20">
            <h1 className="text-5xl font-bold leading-tight mb-6">Competence Assessment Center</h1>
            <p className="text-xl text-blue-200 max-w-md">Welcome to the official technical competence evaluation portal.</p>
          </div>
        </div>
        <div className="relative z-10 text-sm text-blue-300">© {new Date().getFullYear()} EPROM. All Rights Reserved.</div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-8 flex justify-center"><HeaderLogo /></div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Candidate Registration</h2>
            <p className="text-gray-500 mt-2">Enter your credentials to access the exam.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map(field => (
              <div key={field.id} className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <div className="relative">
                    <select 
                      required={field.required}
                      className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 pr-8"
                      onChange={(e) => handleChange(field.label, e.target.value)}
                    >
                      <option value="">Select an option...</option>
                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><ChevronRight className="rotate-90 w-4 h-4" /></div>
                  </div>
                ) : (
                  <input 
                    type={field.type}
                    required={field.required}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 transition-shadow"
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                    onChange={(e) => handleChange(field.label, e.target.value)}
                  />
                )}
              </div>
            ))}
            <div className="pt-4">
              <button type="submit" className="w-full text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 font-bold rounded-lg text-lg px-5 py-4 text-center shadow-lg transform transition hover:-translate-y-1">
                Begin Assessment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ExamInterface = ({ questions, durationMins, studentName, onSubmit }: { questions: Question[], durationMins: number, studentName: string, onSubmit: (answers: Record<string, number>) => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(durationMins * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = () => onSubmit(answers);
  const handleSelect = (idx: number) => setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: idx }));
  const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60 < 10 ? '0' : '')}${secs % 60}`;
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  if (questions.length === 0) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold text-xl animate-pulse">Loading Assessment Data...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white shadow-md z-20 sticky top-0 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <HeaderLogo />
            <div className="hidden md:block h-8 w-px bg-gray-300 mx-2"></div>
            <div className="hidden md:flex flex-col"><span className="font-semibold text-gray-800 text-sm">Candidate</span><span className="text-blue-600 font-bold">{studentName}</span></div>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
              <Clock size={20} className="stroke-2" />
              <span className="text-xl font-mono font-bold tracking-widest">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 h-1.5"><div className="bg-blue-600 h-1.5 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
          <div className="bg-gray-50 border-b border-gray-100 p-8 flex justify-between items-start">
             <div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold tracking-wide mb-3">QUESTION {currentIndex + 1} OF {questions.length}</span>
                <h3 className="text-2xl font-bold text-gray-800 leading-snug">{currentQ.text}</h3>
             </div>
          </div>
          <div className="p-8 flex-1">
            <div className="grid grid-cols-1 gap-4">
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === idx;
                return (
                  <div key={idx} onClick={() => handleSelect(idx)} className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 group ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md transform scale-[1.01]' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-400 group-hover:border-blue-400'}`}>
                      {isSelected ? <CheckCircle size={16} /> : <span className="text-sm font-bold">{String.fromCharCode(65 + idx)}</span>}
                    </div>
                    <span className={`text-lg ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center">
            <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="flex items-center gap-2 px-6 py-3 rounded-lg text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all font-medium"><ChevronLeft size={20} /> Back</button>
            {currentIndex === questions.length - 1 ? (
              <button onClick={handleSubmit} className="flex items-center gap-3 px-8 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5">Submit Exam <Shield size={20} /></button>
            ) : (
              <button onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} className="flex items-center gap-3 px-8 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Next Question <ChevronRight size={20} /></button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'student-login' | 'student-exam' | 'student-done' | 'admin-login' | 'admin-dash'>('student-login');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [studentData, setStudentData] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'results' | 'questions' | 'settings'>('results');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [secureKeys, setSecureKeys] = useState<Record<string, number>>({});

  // 1. Initial Data Loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSettings = localStorage.getItem('exam_settings');
        if (savedSettings) setSettings(JSON.parse(savedSettings));

        const savedResults = localStorage.getItem('exam_results');
        if (savedResults) setResults(JSON.parse(savedResults));

        let data: any[] = [];
        try {
          const response = await fetch('exam_data.json'); 
          if (!response.ok) throw new Error("Fetch failed");
          data = await response.json();
        } catch (fetchError) {
          console.warn("Using fallback default data.");
          data = DEFAULT_QUESTIONS_DATA;
        }
        
        const keys: Record<string, number> = {};
        const sanitizedQs = data.map((q: any) => {
          keys[q.id] = q.correctIndex;
          return q;
        });
        
        setSecureKeys(keys);
        setQuestions(sanitizedQs);
      } catch (err) {
        console.error("Error loading exam data:", err);
      }
    };
    loadData();
  }, []);

  // 2. Fetch Backend Results
  useEffect(() => {
    if (view === 'admin-dash' && activeTab === 'results' && settings.backendUrl) {
      const fetchResults = async () => {
        try {
          const res = await fetch(settings.backendUrl!);
          if (!res.ok) throw new Error("Failed to fetch results");
          const data = await res.json();
          setResults(data);
        } catch (e) {
          console.error("Backend fetch error", e);
          alert("Could not fetch results from backend. Check URL in settings.");
        }
      };
      fetchResults();
    }
  }, [view, activeTab, settings.backendUrl]);

  const handleStudentStart = (data: any) => {
    setStudentData(data);
    setView('student-exam');
  };

  const handleStudentSubmit = async (answers: Record<string, number>) => {
    const newResult: StudentResult = {
      id: crypto.randomUUID(),
      studentData,
      answers,
      timestamp: new Date().toISOString()
    };

    if (settings.backendUrl) {
      try {
        const res = await fetch(settings.backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newResult)
        });
        if (!res.ok) throw new Error("Submission Failed");
      } catch (e) {
        alert("Error sending to server. Saving locally.");
        const local = JSON.parse(localStorage.getItem('exam_results') || '[]');
        localStorage.setItem('exam_results', JSON.stringify([...local, newResult]));
      }
    } else {
      const local = JSON.parse(localStorage.getItem('exam_results') || '[]');
      localStorage.setItem('exam_results', JSON.stringify([...local, newResult]));
      setResults([...local, newResult]);
    }
    setView('student-done');
  };

  const calculateScore = (result: StudentResult) => {
    if (Object.keys(secureKeys).length === 0) return { score: 0, total: 0, percent: 0, pass: false };
    let score = 0, total = 0;
    Object.keys(secureKeys).forEach(qId => {
      total++;
      if (result.answers[qId] === secureKeys[qId]) score++;
    });
    const percent = Math.round((score / total) * 100);
    return { score, total, percent, pass: percent >= settings.passScore };
  };

  const downloadLocalJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `exam_results_${new Date().toISOString()}.json`;
    a.click();
  };

  // --- Render ---
  if (view === 'student-login') {
    return (
      <>
        <div className="absolute top-4 right-4 z-50">
          <button onClick={() => setView('admin-login')} className="text-gray-400 hover:text-white lg:hover:text-blue-200 flex items-center gap-1 transition-colors"><Shield size={16} /> <span className="text-xs">Staff Login</span></button>
        </div>
        <StudentRegistration fields={settings.studentFields} onStart={handleStudentStart} />
      </>
    );
  }
  if (view === 'student-exam') return <ExamInterface questions={questions} durationMins={settings.timerMinutes} studentName={studentData?.['Full Name'] || "Student"} onSubmit={handleStudentSubmit} />;
  
  if (view === 'student-done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-6">
        <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-lg border-t-8 border-green-500 animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-12 h-12 text-green-600" /></div>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4">Assessment Submitted</h2>
          <p className="text-gray-600 mb-8 text-lg">Thank you. Your responses have been recorded.</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 font-bold hover:text-blue-800 flex items-center justify-center gap-2 mx-auto"><RefreshCw size={16} /> Return to Registration</button>
        </div>
      </div>
    );
  }

  if (view === 'admin-login') return <AdminLogin onLogin={() => setView('admin-dash')} onResetRequest={() => {}} />;

  if (view === 'admin-dash') {
    return (
      <div className="min-h-screen bg-gray-100 flex font-sans">
        <div className="w-72 bg-gray-900 text-white flex flex-col shadow-2xl">
          <div className="p-8 border-b border-gray-800">
             <div className="flex items-center gap-2 mb-2"><Shield className="text-blue-500" /><span className="font-bold text-xl tracking-wider">ADMIN</span></div>
             <div className="text-xs text-gray-500 uppercase tracking-widest">{settings.backendUrl ? <span className="text-green-400 flex items-center gap-1"><Wifi size={10}/> Online (GitHub)</span> : <span className="text-yellow-500 flex items-center gap-1"><WifiOff size={10}/> Offline (Local)</span>}</div>
          </div>
          <nav className="flex-1 p-4 space-y-2 mt-4">
            <button onClick={() => setActiveTab('results')} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'results' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Users size={20} /> Results</button>
            <button onClick={() => setActiveTab('questions')} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'questions' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><FileText size={20} /> Questions</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><SettingsIcon size={20} /> Settings</button>
          </nav>
          <div className="p-4 border-t border-gray-800"><button onClick={() => setView('student-login')} className="w-full p-4 flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-600 rounded-lg transition-colors"><LogOut size={18} /> Logout</button></div>
        </div>
        <div className="flex-1 p-10 overflow-y-auto">
          {activeTab === 'results' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-end mb-8">
                <div><h2 className="text-3xl font-bold text-gray-800">Results</h2><p className="text-gray-500 mt-1">{settings.backendUrl ? "Syncing with GitHub Backend" : "Stored locally"}</p></div>
                <div className="flex gap-3"><button onClick={downloadLocalJSON} className="bg-gray-200 px-4 py-2 rounded-lg font-bold flex gap-2"><Download size={16} /> Export JSON</button></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase"><tr><th className="p-5">Candidate</th><th className="p-5">Score</th><th className="p-5 text-center">Status</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((r, i) => {
                      const stats = calculateScore(r);
                      return <tr key={i} className="hover:bg-blue-50"><td className="p-5 font-bold">{r.studentData['Full Name']}</td><td className="p-5">{stats.percent}%</td><td className="p-5 text-center">{stats.pass ? 'PASS' : 'FAIL'}</td></tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
             <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
               <h2 className="text-3xl font-bold mb-8 text-gray-800">Configuration</h2>
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                 <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Server size={24} /></div><h3 className="font-bold text-xl text-gray-800">Backend Connection</h3></div>
                 <div className="space-y-4">
                   <p className="text-sm text-gray-500">Connect to your serverless function (Vercel/Netlify) to save results to GitHub.</p>
                   <div><label className="block text-sm font-semibold text-gray-700 mb-2">Backend Function URL</label><input type="text" value={settings.backendUrl || ''} onChange={(e) => setSettings({...settings, backendUrl: e.target.value})} className="w-full border p-3 rounded-lg" placeholder="https://your-app.vercel.app/api/handler" /></div>
                   <div className="flex justify-end"><button onClick={() => {localStorage.setItem('exam_settings', JSON.stringify(settings)); alert("Saved!");}} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Save Settings</button></div>
                 </div>
               </div>
             </div>
          )}
        </div>
      </div>
    );
  }
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
}