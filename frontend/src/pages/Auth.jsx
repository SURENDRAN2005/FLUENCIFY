import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`https://fluencify-api.onrender.com${endpoint}`, {
        username,
        password
      });

      const userId = response.data.id;
      // Save user ID to local storage
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', response.data.username);
      
      if (response.data.username === 'admin') {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.removeItem('isAdmin');
      }
      
      try {
        // Check profile
        await axios.get(`https://fluencify-api.onrender.com/profile/${userId}`);
        
        // Profile exists, check progress
        const prog = await axios.get(`https://fluencify-api.onrender.com/progress/${userId}`);
        if (prog.data.level === 0) {
          navigate('/assessment');
        } else {
          navigate('/dashboard');
        }
      } catch (profileErr) {
        // 404 means no profile
        navigate('/onboarding');
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-xl font-extrabold tracking-tight text-primary-700 mb-6">FLUENCIFY</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {isLogin ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        <p className="text-sm text-gray-500">
          {isLogin ? 'Log in to continue your journey' : 'Start your fluency journey today'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {isLogin ? 'Username / Email' : 'Username'}
              </label>
              <input
                type="text"
                required
                value={username}
                placeholder="you@example.com"
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-shadow"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                {isLogin && <a href="#" className="text-xs text-primary-600 font-medium">Forgot password?</a>}
              </div>
              <input
                type="password"
                required
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-shadow"
              />
            </div>

            {/* Checkboxes (Cosmetic) */}
            {isLogin ? (
              <div className="flex items-center">
                <input id="remember" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">Remember me</label>
              </div>
            ) : (
              <div className="flex items-center">
                <input id="terms" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label htmlFor="terms" className="ml-2 block text-xs text-gray-600">I agree to the Terms & Privacy Policy</label>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-md shadow-primary-500/20 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
              </button>
            </div>
            
            {/* Privacy & Medical Consent Flow (Hackathon Rubric Constraints) */}
            {!isLogin && (
              <div className="mt-4 p-3 bg-indigo-50 text-indigo-900 text-xs rounded-xl flex flex-col gap-2">
                <div className="flex gap-2">
                  <span className="text-xl">🛡️</span>
                  <p>
                    <strong>Privacy-First:</strong> Your voice stays on your device. We only store anonymized numbers and scores locally, not raw audio recordings.
                  </p>
                </div>
                <div className="flex gap-2 border-t border-indigo-200 pt-2 mt-1">
                  <span className="text-xl">⚕️</span>
                  <p>
                    <strong>Disclaimer:</strong> FLUENCIFY is a training aid, not a medical device or a replacement for an SLP.
                  </p>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
