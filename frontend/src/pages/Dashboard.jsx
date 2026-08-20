import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, TrendingUp, Mic, Award, Zap, Lock, CheckCircle, Home, LayoutDashboard, Settings, User, LogOut, ChevronRight, Gift, CircleDashed } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const LEVEL_INFO = {
  0: { name: "Not Assessed",            color: "text-gray-400" },
  1: { name: "Breath & Relax",          color: "text-duo-green" },
  2: { name: "Single Sounds",           color: "text-duo-green" },
  3: { name: "Syllable Chains",         color: "text-primary-500" },
  4: { name: "Words & Phrases",         color: "text-gray-400" },
  5: { name: "Paced Sentences",         color: "text-gray-400" },
  6: { name: "Shadow Speech",           color: "text-gray-400" },
  7: { name: "Spontaneous Conversation",color: "text-gray-400" },
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Home');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) { setLoading(false); return; }
      try {
        const res = await axios.get(`https://fluencify-api.onrender.com/progress/${userId}`);
        setData(res.data);
      } catch (e) {
        console.error("Progress fetch failed", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.level === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-card border border-gray-100 text-center max-w-xl">
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Ready to start?</h1>
          <p className="text-lg text-gray-600 mb-8 font-medium">
            Let's find your starting level with a quick assessment!
          </p>
          <Link
            to="/assessment"
            className="inline-block w-full bg-primary-500 hover:bg-primary-600 shadow-btn-primary text-white px-8 py-4 rounded-2xl font-black text-lg transition-all active:translate-y-1 active:shadow-none"
          >
            START ASSESSMENT
          </Link>
        </div>
      </div>
    );
  }

  const history     = data.history || [];
  const level       = data.level;
  const levelMeta   = LEVEL_INFO[level] || LEVEL_INFO[7];
  const latestScore = history.length > 0 ? history[history.length - 1].score : data.baseline_score || 0;
  const username    = localStorage.getItem('username') || 'Surendran';
  const improvement = history.length >= 2 ? Math.round(history[history.length - 1].score - history[0].score) : 0;
  const totalSessions = history.length;
  const xpPoints = totalSessions * 50;
  const fluCoins = totalSessions * 20;
  const streak = data.streak || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col z-10 h-screen sticky top-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
             <Mic className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-black text-primary-600 tracking-tight">FLUENCIFY</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2 font-bold text-gray-500">
          <button onClick={() => setActiveTab('Home')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'Home' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'}`}>
            <Home className="h-6 w-6" /> Home
          </button>
          <Link to="/practice" className="flex items-center gap-4 px-4 py-3 hover:bg-gray-100 rounded-2xl transition-colors">
            <Mic className="h-6 w-6" /> Practice
          </Link>
          <button onClick={() => setActiveTab('Progress')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'Progress' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'}`}>
            <TrendingUp className="h-6 w-6" /> Progress
          </button>
          <button onClick={() => setActiveTab('Levels')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'Levels' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'}`}>
            <Target className="h-6 w-6" /> Levels
          </button>
          <button onClick={() => setActiveTab('Rewards')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'Rewards' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'}`}>
            <Gift className="h-6 w-6" /> Rewards
          </button>
          <button onClick={() => setActiveTab('Profile')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'Profile' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'}`}>
            <User className="h-6 w-6" /> Profile
          </button>
          <button onClick={() => setActiveTab('Settings')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'Settings' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'}`}>
            <Settings className="h-6 w-6" /> Settings
          </button>
        </nav>
        

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 md:p-10 md:pb-10 overflow-y-auto max-w-6xl mx-auto w-full">
        
        {activeTab === 'Home' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight break-all">Hello, {username}!</h1>
                <p className="text-gray-500 font-medium mt-1">Ready to improve your fluency today?</p>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/practice" className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-2xl font-black shadow-btn-primary transition-all active:translate-y-1 active:shadow-none flex items-center gap-2">
                  <Mic className="w-5 h-5" /> Practice Now
                </Link>
                <div onClick={() => setActiveTab('Profile')} className="w-12 h-12 bg-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Surendran&mouth=smile&eyes=happy" alt="Avatar" />
                </div>
              </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-card border border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-2">Current Level</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xl font-black">Level {level}</p>
                    <p className="text-[10px] font-bold text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis w-24">{levelMeta.name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-card border border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-2">Practice Streak</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <p className="text-xl font-black">{streak}</p>
                    <p className="text-[10px] font-bold text-gray-500">days</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-card border border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-2">Total Sessions</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xl font-black">{totalSessions}</p>
                    <p className="text-[10px] font-bold text-gray-500">sessions</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-card border border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-2">XP Points</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-500 rounded-xl flex items-center justify-center">
                    <span className="font-black text-xl">★</span>
                  </div>
                  <div>
                    <p className="text-xl font-black">{xpPoints}</p>
                    <p className="text-[10px] font-bold text-gray-500">/1000 XP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Progress' && (
          <div className="space-y-8 animate-fade-in">
             <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Progress</h2>
             
             {/* Fluency Score Card */}
             <div className="bg-white rounded-[2rem] shadow-card border border-gray-100 p-8 relative flex flex-col md:flex-row gap-8 items-center overflow-visible">
               <div className="flex flex-col items-center">
                 <h3 className="font-bold text-gray-500 mb-4">Latest Fluency Score</h3>
                 <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#58cc02" strokeWidth="12" strokeDasharray="440" strokeDashoffset={440 - (440 * latestScore) / 100} strokeLinecap="round" />
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#ff4b4b" strokeWidth="12" strokeDasharray="440" strokeDashoffset={440 - (440 * (100 - latestScore)) / 100} strokeLinecap="round" style={{ transformOrigin: 'center', transform: `rotate(${(latestScore/100)*360}deg)` }}/>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-black text-gray-900">{Math.round(latestScore)}</span>
                      <span className="text-gray-400 font-bold text-sm">/100</span>
                    </div>
                 </div>
                 <p className="text-duo-green font-bold text-sm mt-4">+{improvement} from baseline</p>
               </div>

               <div className="flex-1 w-full h-full min-h-[150px] relative mt-4 md:mt-0">
                  {/* Real Line Chart from history */}
                  {history.length > 1 ? (() => {
                    const pts = history.slice(-8); // last 8 sessions
                    const minS = Math.min(...pts.map(p => p.score));
                    const maxS = Math.max(...pts.map(p => p.score));
                    const range = Math.max(maxS - minS, 10);
                    const toX = (i) => (i / (pts.length - 1)) * 100;
                    const toY = (s) => 90 - ((s - minS) / range) * 75;
                    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)},${toY(p.score)}`).join(' ');
                    return (
                      <svg className="w-full h-32" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d={d} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                        {pts.map((p, i) => (
                          <circle key={i} cx={toX(i)} cy={toY(p.score)} r={i === pts.length - 1 ? 4 : 3} fill="#7c3aed" />
                        ))}
                      </svg>
                    );
                  })() : (
                    <div className="w-full h-32 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl p-4 text-center">
                      <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm font-bold">Complete more sessions to see your trend</span>
                    </div>
                  )}
                  <div className="mt-4">
                    <h3 className={`font-black text-lg ${improvement >= 0 ? 'text-duo-green' : 'text-duo-red'}`}>
                      {improvement >= 0 ? '📈 Great Progress!' : '📉 Tougher session today'}
                    </h3>
                    <p className="text-gray-500 font-medium">Keep practicing to unlock new levels.</p>
                  </div>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'Levels' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Level Journey</h2>
            <div className="bg-white p-8 rounded-[2rem] shadow-card border border-gray-100 overflow-hidden">
              <h3 className="font-black text-xl text-gray-900 mb-8">Path to Spontaneous Conversation</h3>
              <div className="relative w-full overflow-x-auto pb-4">
                 <div className="min-w-[700px] flex justify-between items-start relative px-4 mt-8">
                    {/* Connecting Line */}
                    <div className="absolute top-6 left-10 right-10 h-1 bg-gray-200 -z-10"></div>
                    
                    {[1,2,3,4,5,6,7].map(l => {
                      const numLevel = Number(level);
                      const done = l < numLevel;
                      const current = l === numLevel;
                      const locked = l > numLevel;
                      
                      const content = (
                        <>
                          {current && (
                            <div className="absolute -top-8 text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-full whitespace-nowrap">
                              You are here
                            </div>
                          )}
                          
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg z-10 border-4 border-white transition-transform ${
                            done ? 'bg-[#58cc02] text-white shadow-md hover:scale-110' :
                            current ? 'bg-[#ffc800] text-white shadow-md scale-110' :
                            'bg-gray-200 text-gray-400'
                          }`}>
                            {done ? <CheckCircle className="w-6 h-6" /> : locked ? <Lock className="w-5 h-5" /> : l}
                          </div>
                          
                          <div className="text-center">
                            <p className={`text-xs font-bold leading-tight ${locked ? 'text-gray-400' : 'text-gray-900'}`}>
                              {LEVEL_INFO[l]?.name}
                            </p>
                          </div>
                        </>
                      );
                      
                      const wrapperClass = "flex flex-col items-center gap-3 relative w-24";
                      if (!locked) {
                        return (
                          <Link to="/practice" state={{ targetLevel: l }} key={l} className={`${wrapperClass} cursor-pointer`}>
                            {content}
                          </Link>
                        );
                      }
                      
                      return (
                        <div key={l} className={wrapperClass}>
                          {content}
                        </div>
                      );
                    })}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Rewards' && (
          <div className="space-y-8 animate-fade-in">
             <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Rewards</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2rem] p-8 text-white shadow-lg relative overflow-hidden">
                   <div className="relative z-10">
                     <p className="font-bold text-yellow-100 mb-2">Total FluCoins</p>
                     <h3 className="text-5xl font-black">{fluCoins}</h3>
                     <p className="mt-4 font-medium text-yellow-50 text-sm">Earned by completing practice sessions. Use these to unlock special features soon!</p>
                   </div>
                   <div className="absolute -right-4 -bottom-4 text-[120px] opacity-20 font-black leading-none">F</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-8 text-white shadow-lg relative overflow-hidden">
                   <div className="relative z-10">
                     <p className="font-bold text-indigo-100 mb-2">Total Experience</p>
                     <h3 className="text-5xl font-black">{xpPoints} <span className="text-2xl">XP</span></h3>
                     <p className="mt-4 font-medium text-indigo-50 text-sm">Level up your profile by practicing consistently.</p>
                   </div>
                   <Award className="absolute -right-4 -bottom-4 w-40 h-40 opacity-20" />
                </div>
             </div>
             
             <h3 className="font-black text-xl text-gray-900 mt-8 mb-6">Badges Earned</h3>
             <div className="flex gap-4 flex-wrap">
                <div className="w-28 h-28 bg-orange-50 border-2 border-orange-200 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                   <Zap className="w-10 h-10 text-orange-500 mb-2 fill-current" />
                   <span className="text-xs font-bold text-orange-700 text-center">Streak<br/>Starter</span>
                </div>
                {totalSessions > 0 && (
                  <div className="w-28 h-28 bg-primary-50 border-2 border-primary-200 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                     <Award className="w-10 h-10 text-primary-500 mb-2" />
                     <span className="text-xs font-bold text-primary-700 text-center">First<br/>Session</span>
                  </div>
                )}
                {totalSessions > 5 && (
                  <div className="w-28 h-28 bg-green-50 border-2 border-green-200 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                     <Target className="w-10 h-10 text-green-500 mb-2" />
                     <span className="text-xs font-bold text-green-700 text-center">Getting<br/>Serious</span>
                  </div>
                )}
                <div className="w-28 h-28 bg-gray-50 border-2 border-gray-200 border-dashed rounded-2xl flex flex-col items-center justify-center opacity-50">
                   <Lock className="w-8 h-8 text-gray-400 mb-2" />
                   <span className="text-[10px] font-bold text-gray-500 text-center uppercase">Locked</span>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'Profile' && (
          <div className="space-y-8 animate-fade-in max-w-xl mx-auto pt-8">
             <div className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-card flex flex-col items-center text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-400 to-purple-500"></div>
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Surendran&mouth=smile&eyes=happy" alt="Avatar" className="w-32 h-32 bg-gray-100 rounded-full mb-6 border-8 border-white shadow-lg relative z-10" />
               <h2 className="text-3xl font-black text-gray-900 tracking-tight break-all w-full px-4">{username}</h2>
               <p className="text-primary-600 font-bold mb-8">Level {level} • {levelMeta.name}</p>
               
               <div className="w-full grid grid-cols-2 gap-4 mb-8 text-left">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-1">Total Practice</p>
                    <p className="font-black text-gray-900 text-xl">{totalSessions} <span className="text-sm font-bold text-gray-500">sessions</span></p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-1">Joined</p>
                    <p className="font-black text-gray-900 text-xl">August 2026</p>
                  </div>
               </div>

               <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors shadow-sm">
                 <LogOut className="w-5 h-5" /> Sign Out
               </button>
             </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto pt-4">
             <h2 className="text-3xl font-black text-gray-900 tracking-tight">Settings</h2>
             
             <div className="bg-white rounded-[2rem] border border-gray-100 shadow-card overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                   <div>
                     <p className="font-bold text-gray-900 text-lg">Push Notifications</p>
                     <p className="text-sm font-medium text-gray-500 mt-1">Get daily practice reminders and updates.</p>
                   </div>
                   <div className="w-14 h-8 bg-primary-500 rounded-full relative cursor-pointer shadow-inner">
                     <div className="w-6 h-6 bg-white rounded-full absolute top-1 right-1 shadow-sm transition-transform"></div>
                   </div>
                </div>
                


                <div className="p-8 flex justify-between items-center bg-red-50/50">
                   <div>
                     <p className="font-bold text-red-600 text-lg">Delete Account</p>
                     <p className="text-sm font-medium text-red-400 mt-1">Permanently remove your data and progress.</p>
                   </div>
                   <button className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-black rounded-xl transition-colors shadow-sm">
                     Delete
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex lg:hidden justify-between items-center h-20 px-1 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('Home')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'Home' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => navigate('/practice')} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-gray-600">
          <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-bold">Practice</span>
        </button>
        <button onClick={() => setActiveTab('Progress')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'Progress' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-bold">Progress</span>
        </button>
        <button onClick={() => setActiveTab('Levels')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'Levels' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <Target className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-bold">Levels</span>
        </button>
        <button onClick={() => setActiveTab('Rewards')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'Rewards' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-bold">Rewards</span>
        </button>
        <button onClick={() => setActiveTab('Profile')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'Profile' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <User className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-bold">Profile</span>
        </button>
      </nav>
    </div>
  );
}
