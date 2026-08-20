import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    primary_reason: '',
    comfort_level: '',
    speaking_frequency: '',
    speaking_type: ''
  });

  const handleSelect = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit(profile);
    }
  };

  const handleSubmit = async (finalProfile) => {
    setLoading(true);
    const userId = localStorage.getItem('userId');
    try {
      await axios.post(`https://fluencify-api.onrender.com/profile/${userId}`, finalProfile);
      navigate('/assessment');
    } catch (error) {
      console.error("Failed to save profile:", error);
      setLoading(false);
    }
  };

  const renderOptions = (field, options) => (
    <div className="space-y-4 mt-8">
      {options.map((opt) => {
        const isSelected = profile[field] === opt;
        return (
          <button
            key={opt}
            onClick={() => handleSelect(field, opt)}
            className={`w-full text-left px-6 py-5 rounded-2xl border flex items-center gap-4 transition-all ${
              isSelected
                ? 'border-primary-500 bg-white shadow-[0_4px_20px_rgba(79,70,229,0.1)]'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
              isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
            }`}>
              {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
            </div>
            <span className={`text-sm font-medium ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white px-6 py-8 sm:px-12 sm:py-12 shadow-sm sm:rounded-3xl border border-gray-100 relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/auth')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-gray-500">Step {step} of 4</span>
            <div className="w-5"></div> {/* Spacer for centering */}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100 w-full rounded-full mb-10 overflow-hidden">
            <div 
              className="h-full bg-primary-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Personalizing your experience...</p>
            </div>
          ) : (
            <div className="min-h-[400px] flex flex-col">
              <div className="flex-1">
                {step === 1 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">What is your main goal?</h3>
                    <p className="text-sm text-gray-500">This helps us personalize your training.</p>
                    {renderOptions('primary_reason', [
                      'Speak more comfortably',
                      'Improve speaking confidence',
                      'Practice regularly',
                      'Improve speech control'
                    ])}
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">How comfortable are you speaking?</h3>
                    <p className="text-sm text-gray-500">Be honest, this is a safe space.</p>
                    {renderOptions('comfort_level', [
                      'Very comfortable',
                      'Comfortable',
                      'Sometimes uncomfortable',
                      'Not very comfortable'
                    ])}
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">How often do you speak in front of others?</h3>
                    <p className="text-sm text-gray-500">Select the frequency that best matches your routine.</p>
                    {renderOptions('speaking_frequency', [
                      'Daily',
                      'Sometimes',
                      'Rarely'
                    ])}
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">What type of speaking?</h3>
                    <p className="text-sm text-gray-500">Choose the scenarios you encounter most often.</p>
                    {renderOptions('speaking_type', [
                      'Casual conversation',
                      'Academic speaking',
                      'Interviews & Presentations',
                      'General communication'
                    ])}
                  </div>
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100">
                <button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !profile.primary_reason) ||
                    (step === 2 && !profile.comfort_level) ||
                    (step === 3 && !profile.speaking_frequency) ||
                    (step === 4 && !profile.speaking_type)
                  }
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-md shadow-primary-500/20 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  {step === 4 ? 'Complete Profile' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
