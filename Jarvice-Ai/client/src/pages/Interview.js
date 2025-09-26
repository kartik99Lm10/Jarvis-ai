import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  DocumentArrowUpIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  StarIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Interview = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Setup, 2: Interview, 3: Results
  const [formData, setFormData] = useState({
    resume: null,
    jd_text: '',
    focus_areas: [],
    difficulty: 'intermediate',
    role_type: ''
  });
  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Voice-related states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // Initialize voice recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        setCurrentAnswer(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };
    }

    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Speak text using speech synthesis
  const speakText = (text) => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Auto-start listening in voice mode after AI finishes speaking
        if (isVoiceMode) {
          setTimeout(() => {
            startListening();
          }, 500);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);
      
      synthesisRef.current.speak(utterance);
    }
  };

  // Start listening for user speech
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setVoiceTranscript('');
      setCurrentAnswer('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const focusAreaOptions = [
    'Technical Skills',
    'Problem Solving',
    'Communication',
    'Leadership',
    'Teamwork',
    'Project Management',
    'Analytical Thinking',
    'Creativity',
    'Time Management',
    'Adaptability'
  ];

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', description: 'Entry-level questions' },
    { value: 'intermediate', label: 'Intermediate', description: 'Mid-level questions' },
    { value: 'advanced', label: 'Advanced', description: 'Senior-level questions' }
  ];

  const onDrop = (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        toast.error('File is too large. Maximum size is 10MB.');
      } else if (error.code === 'file-invalid-type') {
        toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.');
      } else {
        toast.error('File upload failed. Please try again.');
      }
      return;
    }
    
    const file = acceptedFiles[0];
    if (file) {
      setFormData(prev => ({ ...prev, resume: file }));
      toast.success(`Resume uploaded: ${file.name}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: false, // Allow clicking to open file dialog
    noKeyboard: false // Allow keyboard navigation
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFocusAreaToggle = (area) => {
    setFormData(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area]
    }));
  };

  const startInterview = async () => {
    if (!formData.jd_text.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      if (formData.resume) {
        formDataToSend.append('resume', formData.resume);
      }
      formDataToSend.append('jd_text', formData.jd_text);
      formDataToSend.append('focus_areas', JSON.stringify(formData.focus_areas));
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('role_type', formData.role_type);

      const response = await axios.post('/api/interview/start', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setInterviewData(response.data);
      setStep(2);
      toast.success('Interview started successfully!');
      
      // If voice mode is enabled, speak the first question
      if (isVoiceMode && response.data.questions && response.data.questions.length > 0) {
        // Parse the questions from the response
        const questions = JSON.parse(response.data.questions.replace(/```json\n|\n```/g, ''));
        if (questions.length > 0) {
          setTimeout(() => {
            speakText(`Question 1: ${questions[0]}`);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/interview/answer', {
        session_id: interviewData.session_id,
        answer: currentAnswer,
        question_index: currentQuestion
      });

      const newAnswers = [...answers, currentAnswer];
      setAnswers(newAnswers);
      setCurrentAnswer('');
      setVoiceTranscript('');

      if (response.data.completed) {
        setInterviewData(prev => ({
          ...prev,
          feedback: response.data.feedback,
          score: response.data.score
        }));
        setStep(3);
        toast.success('Interview completed! Check your results.');
      } else {
        setCurrentQuestion(prev => prev + 1);
        toast.success('Answer submitted! Next question.');
        
        // If voice mode is enabled, speak the next question
        if (isVoiceMode && interviewData.questions) {
          const questions = JSON.parse(interviewData.questions.replace(/```json\n|\n```/g, ''));
          const nextQuestionIndex = currentQuestion + 1;
          if (questions[nextQuestionIndex]) {
            setTimeout(() => {
              speakText(`Question ${nextQuestionIndex + 1}: ${questions[nextQuestionIndex]}`);
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetInterview = () => {
    setStep(1);
    setFormData({
      resume: null,
      jd_text: '',
      focus_areas: [],
      difficulty: 'intermediate',
      role_type: ''
    });
    setInterviewData(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setCurrentAnswer('');
  };

  const renderSetupStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Mock Interview Setup</h1>
        <p className="text-gray-600">Upload your resume and provide job details to get personalized interview questions</p>
      </div>

      <div className="space-y-8">
        {/* Resume Upload */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Upload (Optional)</h2>
          
          {formData.resume ? (
            <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6 text-center">
              <DocumentArrowUpIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-2">{formData.resume.name}</p>
              <p className="text-xs text-gray-500 mb-4">
                {(formData.resume.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={() => setFormData(prev => ({ ...prev, resume: null }))}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <input {...getInputProps()} />
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">or</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-400 mt-2">PDF, DOC, DOCX, TXT (max 10MB)</p>
                </div>
              </div>
              
              {/* Hidden file input as backup */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Validate file size
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('File is too large. Maximum size is 10MB.');
                      return;
                    }
                    
                    // Validate file type
                    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
                    if (!allowedTypes.includes(file.type)) {
                      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.');
                      return;
                    }
                    
                    setFormData(prev => ({ ...prev, resume: file }));
                    toast.success(`Resume uploaded: ${file.name}`);
                  }
                }}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description *</h2>
          <textarea
            name="jd_text"
            value={formData.jd_text}
            onChange={handleInputChange}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Paste the job description here..."
            required
          />
        </div>

        {/* Role Type */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Type</h2>
          <input
            type="text"
            name="role_type"
            value={formData.role_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
          />
        </div>

        {/* Focus Areas */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Focus Areas</h2>
          <p className="text-gray-600 mb-4">Select areas you'd like to focus on during the interview</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {focusAreaOptions.map((area) => (
              <button
                key={area}
                onClick={() => handleFocusAreaToggle(area)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.focus_areas.includes(area)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Level */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Difficulty Level</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData(prev => ({ ...prev, difficulty: option.value }))}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  formData.difficulty === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900">{option.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Mode Toggle */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsVoiceMode(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !isVoiceMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Text Mode
            </button>
            <button
              onClick={() => setIsVoiceMode(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isVoiceMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MicrophoneIcon className="w-4 h-4 inline mr-1" />
              Voice Mode
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {isVoiceMode 
              ? 'AI will speak questions and listen to your voice answers' 
              : 'Traditional text-based interview format'
            }
          </p>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={startInterview}
            disabled={isLoading || !formData.jd_text.trim()}
            className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Starting Interview...
              </div>
            ) : (
              `Start ${isVoiceMode ? 'Voice' : 'Mock'} Interview`
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderInterviewStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Mock Interview</h1>
        <div className="flex items-center justify-center space-x-4 text-gray-600">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Question {currentQuestion + 1} of {interviewData.questions.length}
          </div>
          <div className="flex items-center">
            <BriefcaseIcon className="h-5 w-5 mr-2" />
            {interviewData.instructions.difficulty}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Question {currentQuestion + 1}</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {interviewData.questions[currentQuestion]}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Answer
          </label>
          
          {isVoiceMode ? (
            <div className="space-y-4">
              {/* Voice Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={startListening}
                  disabled={isListening || isSpeaking}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    isListening
                      ? 'bg-red-500 text-white'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <MicrophoneIcon className="w-5 h-5 mr-2" />
                  {isListening ? 'Listening...' : 'Start Speaking'}
                </button>
                
                {isListening && (
                  <button
                    onClick={stopListening}
                    className="flex items-center px-4 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600"
                  >
                    <StopIcon className="w-5 h-5 mr-2" />
                    Stop
                  </button>
                )}
                
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="flex items-center px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                  >
                    <StopIcon className="w-5 h-5 mr-2" />
                    Stop AI
                  </button>
                )}
              </div>
              
              {/* Voice Transcript Display */}
              <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                <p className="text-gray-700">
                  {voiceTranscript || currentAnswer || 'Your speech will appear here...'}
                </p>
                {isListening && (
                  <div className="flex items-center mt-2 text-primary-600">
                    <div className="animate-pulse w-2 h-2 bg-primary-600 rounded-full mr-2"></div>
                    <span className="text-sm">Listening...</span>
                  </div>
                )}
              </div>
              
              {/* Manual Text Input (fallback) */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Or type manually:
                </label>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="Type your answer here as backup..."
                />
              </div>
            </div>
          ) : (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Type your answer here..."
            />
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={resetInterview}
            className="btn-secondary"
          >
            Cancel Interview
          </button>
          <button
            onClick={submitAnswer}
            disabled={isSubmitting || !currentAnswer.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Submitting...
              </div>
            ) : currentQuestion === interviewData.questions.length - 1 ? (
              'Finish Interview'
            ) : (
              'Next Question'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Interview Results</h1>
        <p className="text-gray-600">Great job completing the interview! Here's your detailed feedback.</p>
      </div>

      <div className="space-y-6">
        {/* Score */}
        {interviewData.score && (
          <div className="card text-center">
            <div className="flex items-center justify-center mb-4">
              <StarIcon className="h-8 w-8 text-yellow-500 mr-2" />
              <span className="text-3xl font-bold text-gray-900">{interviewData.score}/100</span>
            </div>
            <p className="text-gray-600">Overall Performance Score</p>
          </div>
        )}

        {/* Feedback */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Feedback</h2>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {interviewData.feedback}
            </div>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Summary</h2>
          <div className="space-y-6">
            {interviewData.questions.map((question, index) => (
              <div key={index} className="border-l-4 border-primary-200 pl-4">
                <h3 className="font-medium text-gray-900 mb-2">Question {index + 1}</h3>
                <p className="text-gray-700 mb-3">{question}</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                  <p className="text-gray-700">{answers[index] || 'No answer provided'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={resetInterview}
            className="btn-primary"
          >
            Start New Interview
          </button>
          <button
            onClick={() => window.location.href = '/history'}
            className="btn-outline"
          >
            View All Interviews
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {step === 1 && renderSetupStep()}
      {step === 2 && renderInterviewStep()}
      {step === 3 && renderResultsStep()}
    </div>
  );
};

export default Interview;
