import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getExam, getUsers } from '../api/user.api';
import logo from "../assets/img/logo.png";
import { FiClock, FiList, FiAward, FiAlertCircle } from 'react-icons/fi';

interface Question {
  _id: string;
  question: string;
  options: string[];
  answer: number;
  topic: string;
  level: string[];
  subject: string;
}

interface Exam {
  _id: string;
  title: string;
  subject: string;
  level: string;
  questions: Question[];
  duration: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  level: string;
}

const ExamQuestions = () => {
  const { id } = useParams(); // Get user ID from URL
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [examEnded, setExamEnded] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [tempAnswers, setTempAnswers] = useState<{ [key: string]: number }>({});
  const navigate = useNavigate();

  // Fetch exam data
  const { data: exams = [], isLoading: isLoadingExam } = useQuery<Exam[]>({
    queryKey: ['exam'],
    queryFn: getExam,
  });

  // Fetch users data
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const exam = exams[0]; // Assuming we're using the first exam in the list
  const currentUser = users.find(user => user._id === id);

  // Check if user's level matches exam level
  useEffect(() => {
    if (!isLoadingExam && !isLoadingUsers && exam && currentUser) {
      if (exam.level.toLowerCase() !== currentUser.level.toLowerCase()) {
        // If levels don't match, redirect to login
        alert('You are not authorized to take this exam');
        navigate('/login');
      }
    }
  }, [exam, currentUser, navigate, isLoadingExam, isLoadingUsers]);

  // Load saved exam state from localStorage
  useEffect(() => {
    if (!exam) return; // Don't proceed if exam data isn't loaded yet

    const savedTime = localStorage.getItem('examEndTime');
    const savedAnswers = localStorage.getItem('examAnswers');
    const savedStarted = localStorage.getItem('examStarted');
    const savedStartTime = localStorage.getItem('examStartTime');
    const savedShowResults = localStorage.getItem('showResults');

    if (savedStarted === 'true' && savedTime && savedStartTime) {
      const endTime = parseInt(savedTime);
      const now = Math.floor(Date.now() / 1000);
      if (now < endTime) {
        setExamStarted(true);
        setTimeRemaining(endTime - now);
        if (savedAnswers) {
          setSelectedAnswers(JSON.parse(savedAnswers));
        }
        if (savedShowResults === 'true') {
          setShowResults(true);
        }
      } else {
        // Exam time has expired
        handleExamCompletion(true);
      }
    } else {
      // Initialize time remaining with exam duration if no saved state
      setTimeRemaining(exam.duration * 60); // Convert minutes to seconds
    }
  }, [exam]);

  // Timer effect - Modified to continue running even after submission
  useEffect(() => {
    if (!examStarted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExamCompletion(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted]);

  const startExam = () => {
    if (!exam) return;
    const startTime = Date.now();
    const endTime = Math.floor(startTime / 1000) + (exam.duration * 60);
    localStorage.setItem('examStartTime', startTime.toString());
    localStorage.setItem('examEndTime', endTime.toString());
    localStorage.setItem('examStarted', 'true');
    setExamStarted(true);
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (examEnded && !isReviewing) return;
    
    if (isReviewing) {
      // In review mode, save to temporary answers
      setTempAnswers(prev => ({
        ...prev,
        [questionId]: answerIndex
      }));
    } else {
      // In normal mode, save directly
      const newAnswers = { ...selectedAnswers, [questionId]: answerIndex };
      setSelectedAnswers(newAnswers);
      localStorage.setItem('examAnswers', JSON.stringify(newAnswers));
    }
  };

  const handleExamCompletion = (timeExpired: boolean = false) => {
    setExamEnded(true);
    if (timeExpired) {
      // Only submit and navigate to results when time has expired
      setShowResults(true);
      localStorage.setItem('showResults', 'true');
      navigate(`/results/${id}`);
    } else {
      // If manually "finished" before time is up, just show review mode
      setIsReviewing(true);
      setShowResults(false);
      localStorage.setItem('showResults', 'false');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleReview = () => {
    if (isReviewing) {
      // When exiting review mode, reset temp answers
      setTempAnswers({});
    } else {
      // When entering review mode, copy current answers to temp
      setTempAnswers({...selectedAnswers});
    }
    setIsReviewing(!isReviewing);
  };

  const handleUpdateAnswers = () => {
    // Update the actual answers with temporary answers
    setSelectedAnswers(tempAnswers);
    localStorage.setItem('examAnswers', JSON.stringify(tempAnswers));
    setTempAnswers({});
    setIsReviewing(false);
  };

  if (isLoadingExam || isLoadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-500">Loading exam...</h2>
        </div>
      </div>
    );
  }

  if (!exam || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">
            {!exam ? "No exam found" : "User not found"}
          </h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const progress = (Object.keys(selectedAnswers).length / exam.questions.length) * 100;

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="SSIC logo" className="w-48" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-500 mb-2">{exam.title}</h1>
            <p className="text-gray-600">Subject: {exam.subject}</p>
            <p className="text-gray-600">Level: {exam.level}</p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Duration Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiClock className="text-blue-500 text-xl" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-700 mb-1">Duration</h2>
                <p className="text-blue-500 font-bold text-lg mb-1">{exam.duration} Minutes</p>
                <p className="text-gray-500 text-sm">Take your time to answer carefully</p>
              </div>
            </div>

            {/* Questions Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiList className="text-blue-500 text-xl" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-700 mb-1">Questions</h2>
                <p className="text-blue-500 font-bold text-lg mb-1">{exam.questions.length} Questions</p>
                <p className="text-gray-500 text-sm">Multiple choice format</p>
              </div>
            </div>

            {/* Pass Mark Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiAward className="text-blue-500 text-xl" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-700 mb-1">Pass Mark</h2>
                <p className="text-blue-500 font-bold text-lg mb-1">70%</p>
                <p className="text-gray-500 text-sm">Aim for excellence</p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-500 text-white rounded-lg p-6 mb-8">
            <h3 className="font-bold mb-4 flex items-center">
              <FiAlertCircle className="mr-2" /> Important Notes:
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Ensure you have a stable internet connection</li>
              <li>• You cannot pause the exam once started</li>
              <li>• Answer all questions to complete the exam</li>
              <li>• Submit before the time runs out</li>
            </ul>
          </div>

          {/* Start Button */}
          <button
            onClick={startExam}
            className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            Start Exam <span className="ml-2">→</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative pb-20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FiClock className="text-blue-500" />
              <span className="text-lg font-semibold">{formatTime(timeRemaining)}</span>
            </div>
            <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
              {Object.keys(selectedAnswers).length} / {exam.questions.length} Questions
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pt-24">
        {examEnded && !showResults && !isReviewing ? (
          <div className="text-center bg-white p-8 rounded-lg shadow mt-8">
            <h3 className="text-2xl font-bold mb-4">Exam Submitted</h3>
            <p className="text-gray-600">Your answers have been submitted. You will be able to see your results when the time is up.</p>
            <p className="text-gray-600 mt-2">Time remaining: {formatTime(timeRemaining)}</p>
            <button
              onClick={toggleReview}
              className="mt-6 bg-blue-100 text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
            >
              Review My Answers
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {exam.questions.map((question, index) => (
              <div key={question._id} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="text-blue-500 font-medium">
                    {String.fromCharCode(9312 + index)}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium mb-4">{question.question}</p>
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={option}
                          className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            (isReviewing ? tempAnswers[question._id] : selectedAnswers[question._id]) === optionIndex
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-200'
                          } ${(examEnded && !isReviewing) ? 'cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name={`question-${question._id}`}
                              value={optionIndex}
                              checked={(isReviewing ? tempAnswers[question._id] : selectedAnswers[question._id]) === optionIndex}
                              onChange={() => handleAnswerSelect(question._id, optionIndex)}
                              className="hidden"
                              disabled={examEnded && !isReviewing}
                            />
                            <div className={`w-6 h-6 flex items-center justify-center border-2 rounded-full mr-3 ${
                              (isReviewing ? tempAnswers[question._id] : selectedAnswers[question._id]) === optionIndex
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-gray-300'
                            }`}>
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                            <span className="text-gray-700">{option}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 mt-3">
        <div className="max-w-4xl mx-auto">
          {isReviewing ? (
            <div className="flex space-x-4">
              <button
                onClick={toggleReview}
                className="flex-1 py-3 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Exit Review
              </button>
              <button
                onClick={handleUpdateAnswers}
                className="flex-1 py-3 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Update Answers
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleExamCompletion(false)}
              disabled={examEnded}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                examEnded
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {examEnded ? 'Please wait for time to expire' : 'Review Answers'}
            </button>
          )}
          {examEnded && !showResults && (
            <p className="text-center text-gray-600 mt-2">
              Time remaining until submission: {formatTime(timeRemaining)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamQuestions;
