import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, ChevronLeft, ChevronRight, Volume2, Award, Activity } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const passage = "Today I am going to talk about my daily routine. I usually wake up early in the morning and prepare myself for the day. I enjoy learning new things and spending time with my friends and family.";

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
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        const tracks = mediaRecorderRef.current.stream.getTracks();
        tracks.forEach(track => track.stop());

        if (recordingTime < 5) {
          alert("Recording is too short! Please read the entire passage.");
          setStep(1);
          setRecordingTime(0);
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setStep(2); // Analyzing state
        setAnalyzing(true);
        await submitAudio(audioBlob);
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "assessment.webm");
    
    try {
      const response = await axios.post('https://fluencify-api.onrender.com/analyze_audio', formData);
      const analysisData = response.data;
      
      // The passage is ~33 words. If the AI detects less than 10 words, 
      // it was likely just background noise or a false start.
      if (analysisData.total_words < 10) {
        setResult({ isSilent: true });
        setStep(3);
      } else {
        let finalScore = 65;
        let assignedLevel = 1;
        const userId = localStorage.getItem('userId');
        if (userId) {
          const assessRes = await axios.post('https://fluencify-api.onrender.com/assessment/submit', {
            user_id: userId,
            scores: analysisData
          });
          finalScore = assessRes.data.fluency_score;
          assignedLevel = assessRes.data.assigned_level;
        }
        
        setResult({ score: finalScore, metrics: analysisData, assignedLevel });
        setStep(3); // Result state
      }
    } catch (error) {
      console.error("Assessment failed:", error);
      alert("Analysis failed. Please try again.");
      setStep(1);
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
      
      {/* Dynamic Header */}
      <header className="flex items-center justify-between p-6 max-w-4xl mx-auto w-full">
        <button onClick={() => navigate('/onboarding')} className="text-gray-400 hover:text-gray-900 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="font-bold text-gray-900 text-lg">Initial Assessment</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Step {Math.min(2, step)} of 2</p>
        </div>
        <div className="w-6 h-6"></div> {/* Spacer */}
      </header>
      
      {/* Progress Bar */}
      <div className="max-w-xs mx-auto w-full mb-6">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: step === 1 ? '50%' : '100%' }}
          ></div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full px-4 md:px-6 z-10 pb-32">
        
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center">
            
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Read the passage naturally</h3>
              <Volume2 className="w-5 h-5 text-gray-400" />
            </div>

            {/* Passage — collapse when recording to save space */}
            {!isRecording && (
              <div className="bg-primary-50 text-primary-900 p-6 md:p-8 rounded-3xl border border-primary-100 text-lg md:text-xl font-medium leading-relaxed shadow-sm w-full mb-8 text-center">
                {passage}
              </div>
            )}

            {isRecording ? (
              /* --- RECORDING STATE: compact card + fixed stop button --- */
              <div className="w-full flex flex-col items-center">
                {/* Compact passage reminder */}
                <div className="bg-primary-50 text-primary-700 px-4 py-4 rounded-2xl border border-primary-100 text-sm md:text-base font-medium w-full mb-6 text-center leading-relaxed">
                  {passage}
                </div>

                {/* Timer + LIVE */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-black text-gray-900">{formatTime(recordingTime)}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="font-bold text-red-500 text-sm tracking-widest uppercase">LIVE</span>
                  </div>
                </div>

                {/* Waveform */}
                <div className="h-16 w-full max-w-xs flex items-center justify-center gap-1 mb-6 overflow-hidden">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div 
                      key={i}
                      className="w-1.5 bg-primary-400 rounded-full animate-pulse"
                      style={{ 
                        height: `${Math.max(10, Math.random() * 100)}%`,
                        animationDelay: `${(i * 0.05) % 0.5}s`
                      }}
                    />
                  ))}
                </div>

                {/* Stop button — fixed to bottom so always visible */}
                <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50">
                  <button 
                    onClick={stopRecording}
                    className="w-24 h-24 bg-duo-red hover:bg-duo-redHover rounded-full flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-95 text-white gap-1"
                  >
                    <Square className="w-8 h-8 fill-current" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Stop</span>
                  </button>
                </div>

                {/* Spacer so content isn't hidden behind fixed button */}
                <div className="h-32" />
              </div>
            ) : (
              /* --- IDLE STATE --- */
              <div className="flex flex-col items-center">
                <p className="text-gray-500 font-bold mb-8">Click the mic and start speaking</p>
                <button 
                  onClick={startRecording}
                  className="w-24 h-24 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center shadow-btn-primary transition-transform active:translate-y-1 active:shadow-none text-white"
                >
                  <Mic className="w-10 h-10" />
                </button>
              </div>
            )}

          </motion.div>
        )}

        {step === 2 && analyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-8 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Analyzing your speech...</h2>
            <p className="text-gray-500 font-medium">This will only take a moment.</p>
          </motion.div>
        )}

        {step === 3 && result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center">
            
            {result.isSilent ? (
              <>
                <h2 className="text-3xl font-black text-gray-900 mb-2 mt-10">No Speech Detected 🙊</h2>
                <p className="text-gray-500 font-medium mb-10 text-center max-w-md">
                  We didn't hear anything. Please try speaking closer to the microphone.
                </p>
                <button 
                  onClick={() => { setResult(null); setStep(1); }}
                  className="w-full max-w-sm bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-2xl font-black shadow-btn-primary transition-transform active:translate-y-1 active:shadow-none text-lg"
                >
                  Try Again
                </button>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Assessment Complete! 🎉</h2>
                <p className="text-gray-500 font-medium mb-10">Here's your initial result</p>
            
            {/* Score Ring */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
               <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                 <circle cx="96" cy="96" r="84" fill="none" stroke="#f3f4f6" strokeWidth="16" />
                 <circle cx="96" cy="96" r="84" fill="none" stroke="#ffc800" strokeWidth="16" strokeDasharray="527" strokeDashoffset={527 - (527 * result.score) / 100} strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-30">
                 {/* Decorative Confetti Background Dots */}
                 <div className="w-3 h-3 bg-red-400 rounded-full absolute top-4 left-10"></div>
                 <div className="w-4 h-4 bg-green-400 rounded-full absolute top-10 right-8"></div>
                 <div className="w-2 h-2 bg-blue-400 rounded-full absolute bottom-12 left-12"></div>
                 <div className="w-3 h-3 bg-purple-400 rounded-full absolute bottom-8 right-16"></div>
                 <div className="w-2 h-2 bg-yellow-400 rounded-full absolute top-20 -left-4"></div>
               </div>
               <span className="text-6xl font-black text-gray-900">{Math.round(result.score)}</span>
            </div>

            <div className="bg-primary-500 text-white font-bold px-6 py-2 rounded-full mb-10 shadow-md">
              {result.score >= 80 ? "Excellent Start! Keep it up!" : result.score >= 60 ? "Good Start! Keep it up!" : "Great effort! Let's improve together!"}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 w-full mb-10">
               <div className="bg-white p-4 rounded-2xl shadow-card border border-gray-100 flex flex-col items-center text-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Speech Rate</span>
                 <span className="text-xl font-black text-gray-900 mb-1">{Math.round(result.metrics?.speech_rate || 0)}</span>
                 <span className="text-[10px] font-bold text-gray-400">SPM</span>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-card border border-gray-100 flex flex-col items-center text-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Blocks</span>
                 <span className="text-xl font-black text-gray-900 mb-1">{result.metrics?.block_count || 0}</span>
                 <span className="text-[10px] font-bold text-gray-400">events</span>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-card border border-gray-100 flex flex-col items-center text-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Repetitions</span>
                 <span className="text-xl font-black text-gray-900 mb-1">{result.metrics?.repetition_count || 0}</span>
                 <span className="text-[10px] font-bold text-gray-400">events</span>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-card border border-gray-100 flex flex-col items-center text-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prolongations</span>
                 <span className="text-xl font-black text-gray-900 mb-1">{result.metrics?.prolongation_count || 0}</span>
                 <span className="text-[10px] font-bold text-gray-400">events</span>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-card border border-gray-100 flex flex-col items-center text-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Interjections</span>
                 <span className="text-xl font-black text-gray-900 mb-1">{result.metrics?.interjection_count || 0}</span>
                 <span className="text-[10px] font-bold text-gray-400">events</span>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-card border border-gray-100 flex flex-col items-center text-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pause Pattern</span>
                 <Activity className="w-8 h-8 text-duo-green mb-1" />
                 <span className="text-[10px] font-bold text-duo-green">Stable</span>
               </div>
            </div>

            {/* Starting Level Card */}
            <div className="w-full bg-white p-6 rounded-3xl shadow-card border border-gray-100 mb-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Your Starting Level</p>
                <h3 className="text-2xl font-black text-primary-600 uppercase mb-1">LEVEL {result.assignedLevel}</h3>
                <p className="text-gray-600 font-bold">
                  {['', 'Breath & Relax', 'Single Sounds', 'Syllable Chains', 'Words & Phrases', 'Paced Sentences', 'Shadow Speech', 'Spontaneous Conversation'][result.assignedLevel] || ''}
                </p>
                <p className="text-xs text-gray-400 mt-2">Best next step for your current pattern.</p>
              </div>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                <Award className="w-8 h-8" />
              </div>
            </div>

            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-2xl font-black shadow-btn-primary transition-transform active:translate-y-1 active:shadow-none text-lg"
            >
              Continue to Level {result.assignedLevel} →
            </button>
              </>
            )}
            
          </motion.div>
        )}

      </main>

      {/* Background Decor */}
      <div className="fixed bottom-0 w-full h-32 -z-10 pointer-events-none opacity-50">
        <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
          <path fill="#58cc02" fillOpacity="0.3" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill="#58cc02" fillOpacity="0.5" d="M0,96L60,117.3C120,139,240,181,360,192C480,203,600,181,720,165.3C840,149,960,139,1080,149.3C1200,160,1320,192,1380,208L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
}
