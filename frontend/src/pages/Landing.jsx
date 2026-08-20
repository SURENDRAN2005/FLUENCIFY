import { Link } from 'react-router-dom';
import { Mic, ArrowRight, Activity, Calendar, Shield, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-primary-100">
      
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div className="font-extrabold tracking-tight text-primary-700 text-xl">
            FLUENCIFY
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/auth" className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">Log In</Link>
          <Link to="/auth" className="bg-primary-600 text-white px-6 py-2.5 rounded-full hover:bg-primary-700 transition-colors shadow-sm">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center relative">
        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900 mb-6"
          >
            Speak with <br/> Confidence. <br/> Grow Every Day.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-gray-500 max-w-md mb-8 leading-relaxed"
          >
            Personalized feedback helps you improve fluency, reduce disfluencies, and express yourself better.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/auth" className="inline-flex justify-center items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-full font-semibold text-base transition-all hover:bg-primary-700 shadow-lg shadow-primary-500/30">
              Start Your Assessment
            </Link>
            <Link to="/auth" className="inline-flex justify-center items-center gap-2 bg-white text-gray-600 border border-gray-200 px-8 py-4 rounded-full font-semibold text-base transition-all hover:bg-gray-50 hover:text-gray-900">
              I Already Have an Account
            </Link>
          </motion.div>
        </div>

        {/* Hero Graphic - Abstract Soundwave */}
        <div className="relative h-96 lg:h-full w-full flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-gradient-to-r from-primary-100/50 to-primary-50/50 rounded-full blur-3xl opacity-50" 
          />
          <div className="relative z-10 flex items-center justify-center gap-2">
            {[30, 60, 40, 80, 100, 70, 50, 90, 40, 60].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: [h, h * 1.5, h] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                className="w-4 bg-primary-200 rounded-full opacity-60"
                style={{ minHeight: `${h}px` }}
              />
            ))}
            {/* Center Mic icon in the wave */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center border-4 border-primary-50">
              <div className="bg-primary-600 w-12 h-12 rounded-full flex items-center justify-center">
                <Mic className="text-white h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How Fluencify Works</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">A seamless 4-step process designed to build lasting confidence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-12 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gray-100 z-0"></div>
          
          {[
            { icon: Mic, title: "1. Speak", desc: "Speak naturally in short exercises." },
            { icon: Activity, title: "2. Analyze", desc: "Our system analyzes your speech patterns." },
            { icon: Calendar, title: "3. Practice", desc: "Get personalized exercises and tips." },
            { icon: Shield, title: "4. Improve", desc: "Track progress and become confident." },
          ].map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-primary-500/10 border border-gray-50 mb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
                  <step.icon className="h-7 w-7 text-primary-600" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
      

    </div>
  );
}
