import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Square, X, ChevronLeft, Pause, Lightbulb } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [level, setLevel] = useState(1);
  const [exercise, setExercise] = useState({ exercise_text: "Loading...", focus_areas: [], instructions: "" });
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  
  // Timer and metrics
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const init = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) { navigate('/'); return; }
      
      try {
        const pRes = await axios.get(`https://fluencify-api.onrender.com/progress/${userId}`);
        const userMaxLevel = pRes.data.level || 1;
        
        // Use targetLevel from navigation state if it exists and is <= userMaxLevel
        const targetLevel = location.state?.targetLevel;
        const activeLevel = (targetLevel && targetLevel <= userMaxLevel) ? targetLevel : userMaxLevel;
        
        setLevel(activeLevel);
        const eRes = await axios.post(`https://fluencify-api.onrender.com/exercise/generate`, {
          user_id: userId, level: activeLevel, weak_phonemes: [], speech_metrics: {}
        });
        setExercise(eRes.data);
      } catch (err) {
        console.error("Failed to init practice", err);
        setExercise({ exercise_text: "Breathe in... Breathe out.", focus_areas: ["breath"], instructions: "" });
      }
    };
    init();
  }, [navigate, location.state]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setResult(null);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required to practice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const tracks = mediaRecorderRef.current.stream.getTracks();
        tracks.forEach(track => track.stop());
        
        await analyzeAudio(audioBlob);
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAnalyzing(true);
    }
  };

  const analyzeAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "practice.webm");
    
    try {
      const response = await axios.post('https://fluencify-api.onrender.com/analyze_audio', formData);
      const analysisData = response.data;
      
      if (analysisData.total_words === 0) {
        setResult({ isSilent: true });
      } else {
        const userId = localStorage.getItem('userId');
        const sessionRes = await axios.post('https://fluencify-api.onrender.com/session', {
          user_id: userId,
          level: level,
          transcript: exercise.exercise_text || '',
          scores: analysisData
        });
        
        setResult({ score: sessionRes.data.fluency_score, metrics: analysisData });
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setResult({ score: 65, message: "Analysis failed, try again." });
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 relative overflow-hidden">
      {/* Top Header */}
      <header className="flex justify-between items-center p-6 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-6 h-6" />
          <span className="hidden sm:inline">Level {level} - Exercise 1 of 5</span>
        </button>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 font-bold">
          <div className="w-5 h-5 bg-duo-gold rounded-full flex items-center justify-center text-white text-xs font-black">F</div>
          <span>120</span>
        </div>
      </header>

      {/* Main Practice Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 md:p-6 max-w-4xl mx-auto w-full">
        
        {/* Exercise Prompt */}
        <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-6 md:p-10 text-center w-full max-w-2xl relative mb-12">
          <p className="text-gray-500 font-bold mb-4 uppercase tracking-widest text-sm">
            {level === 1 ? "Breathe and relax" : "Repeat the phrase"}
          </p>
          <h2 className="text-2xl md:text-5xl font-black text-primary-600 leading-tight tracking-tight mb-4 break-words">
            {exercise.exercise_text}
          </h2>
          <p className="text-gray-400 font-medium text-sm">
            {exercise.instructions || 'Speak clearly and take small pauses.'}
          </p>
        </div>

        {/* Recording Interface */}
        <div className="w-full max-w-2xl bg-white p-6 rounded-3xl shadow-card border border-gray-100 mb-4 flex flex-col items-center">
          
          <div className="flex justify-between w-full items-center mb-4 px-4">
            <div className="flex items-center gap-2 w-24">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="font-bold text-gray-500 tracking-widest text-sm">LIVE</span>
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight flex-1 text-center">
              {formatTime(recordingTime)}
            </div>
            <div className="w-24"></div>
          </div>

          {/* Waveform */}
          <div className="h-20 w-full flex items-center justify-center gap-1 mb-4 overflow-hidden px-4">
            {Array.from({ length: 40 }).map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 rounded-full ${isRecording ? 'bg-primary-500' : 'bg-gray-200'} transition-all duration-75`}
                style={{ 
                  height: isRecording ? `${Math.max(10, Math.random() * 100)}%` : '10%',
                  opacity: isRecording ? 1 : 0.5
                }}
              />
            ))}
          </div>

          {/* Metrics Row */}
          <div className="flex justify-between w-full border-t border-gray-100 pt-4 mb-4 px-4 sm:px-12">
             <div className="flex flex-col items-center">
               <span className="text-xs font-bold text-gray-400 mb-1 text-center">Speech Rate</span>
               <span className="text-xl font-black text-gray-900">{isRecording ? "126" : "--"} <span className="text-sm font-bold text-gray-400">SPM</span></span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-xs font-bold text-gray-400 mb-1 text-center">Pause</span>
               <span className="text-xl font-black text-gray-900">{isRecording ? "2" : "--"} <span className="text-sm font-bold text-gray-400">pauses</span></span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-xs font-bold text-gray-400 mb-1 text-center">Volume</span>
               <div className="flex items-end gap-1 h-6">
                 <div className={`w-1.5 rounded-sm ${isRecording ? 'bg-duo-green h-2' : 'bg-gray-200 h-2'}`}></div>
                 <div className={`w-1.5 rounded-sm ${isRecording ? 'bg-duo-green h-4' : 'bg-gray-200 h-4'}`}></div>
                 <div className={`w-1.5 rounded-sm ${isRecording ? 'bg-duo-green h-6' : 'bg-gray-200 h-6'}`}></div>
               </div>
               <span className="text-sm font-bold text-duo-green mt-1">{isRecording ? "Good" : "--"}</span>
             </div>
          </div>

          <div className="flex items-center justify-center gap-8 md:gap-16 pb-2">
             {/* Main Recording Button */}
             <div className="relative">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-24 h-24 bg-primary-500 hover:bg-primary-600 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-95 text-white gap-1 z-10 relative"
                  >
                    <Mic className="w-10 h-10" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Start</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-24 h-24 bg-duo-red hover:bg-duo-redHover rounded-[2rem] flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-95 text-white gap-1 ring-4 ring-red-300 animate-pulse-slow z-10 relative"
                  >
                    <Square className="w-10 h-10 fill-current" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Stop</span>
                  </button>
                )}
             </div>
          </div>
        </div>

      </main>

      {/* Analyzing Overlay */}
      {analyzing && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-8 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Analyzing Speech...</h2>
          <p className="text-gray-500 font-medium mt-2">Checking pauses and rhythm</p>
        </div>
      )}

      {/* Result Modal */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
              {result.isSilent ? (
                <>
                  <h2 className="text-2xl font-black text-gray-900 mb-2 mt-4">
                    No Speech Detected 🙊
                  </h2>
                  <p className="text-gray-500 font-medium mb-8">
                    We didn't hear anything. Please try speaking closer to the microphone.
                  </p>
                  <button 
                    onClick={() => { setResult(null); }}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-2xl font-black shadow-btn-primary transition-transform active:translate-y-1 active:shadow-none"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => { setResult(null); navigate('/dashboard'); }}
                    className="w-full text-gray-500 hover:text-gray-900 py-4 font-bold mt-2"
                  >
                    Return to Dashboard
                  </button>
                </>
              ) : (
                <>
                  {/* Confetti decoration */}
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-duo-green/20 to-transparent -z-10"></div>
                  
                  <h2 className="text-2xl font-black text-gray-900 mb-2 mt-4">
                    {result.score >= 80 ? `Level ${level} Mastered! 🏆` : "Keep Practicing! 💪"}
                  </h2>
                  <p className="text-gray-500 font-medium mb-8">
                    {result.score >= 80 ? "Outstanding fluency achieved." : "You're getting there. Let's try again."}
                  </p>

              <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  <circle cx="64" cy="64" r="56" fill="none" stroke={result.score >= 80 ? "#58cc02" : "#ff4b4b"} strokeWidth="12" strokeDasharray="352" strokeDashoffset={352 - (352 * result.score) / 100} strokeLinecap="round" />
                </svg>
                <span className="absolute text-4xl font-black text-gray-900">{Math.round(result.score)}<span className="text-xl">%</span></span>
              </div>

              {result.score >= 80 ? (
                <div className="bg-green-50 text-duo-green p-4 rounded-2xl font-bold w-full mb-6 text-center border border-green-100">
                  ✨ Next Level Ready! <br/>
                  <span className="font-medium text-sm text-green-700">You're ready to proceed to Level {Math.min(7, level + 1)}.</span>
                </div>
              ) : (
                <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl font-bold w-full mb-6 text-center border border-orange-100">
                  🎯 Focus on pausing <br/>
                  <span className="font-medium text-sm text-orange-700">Take a deep breath and try slowing down slightly.</span>
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                {result.score >= 80 && (
                  <button 
                    onClick={() => { setResult(null); navigate('/dashboard'); }}
                    className="w-full bg-duo-green hover:bg-duo-greenHover text-white py-4 rounded-2xl font-black shadow-btn-green transition-transform active:translate-y-1 active:shadow-none"
                  >
                    Move to Level {Math.min(7, level + 1)} →
                  </button>
                )}
                
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => { setResult(null); navigate('/dashboard'); }}
                    className="w-1/2 py-4 rounded-2xl font-bold text-gray-500 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => setResult(null)}
                    className={`w-1/2 py-4 rounded-2xl font-black shadow-btn transition-transform active:translate-y-1 active:shadow-none ${
                      result.score < 80 
                        ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-btn-primary' 
                        : 'bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {result.score >= 80 ? "Stay on L" + level : "Try Again"}
                  </button>
                </div>
              </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
