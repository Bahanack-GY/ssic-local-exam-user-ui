import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUsers, getExam, submitScore } from '../api/user.api';
import { FiCheck, FiHome } from 'react-icons/fi';

interface User {
  _id: string;
  name: string;
  level: string;
  score: number;
}

interface Question {
  _id: string;
  question: string;
  options: string[];
  answer: number;
}

interface Exam {
  _id: string;
  questions: Question[];
}

interface ExamResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: string;
  answers: { [key: string]: number };
}

interface SubmitScoreResponse {
  _id: string;
  name: string;
  level: string;
  score: number;
}

const Results = () => {
  const { id } = useParams();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const navigate = useNavigate();

  // Fetch user data
  const { data: users = [], isLoading: isLoadingUser } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  // Fetch exam data
  const { data: exams = [], isLoading: isLoadingExam } = useQuery<Exam[]>({
    queryKey: ['exam'],
    queryFn: getExam,
  });

  // Submit score mutation
  const { mutate: submitUserScore, isPending: isSubmittingScore } = useMutation<
    SubmitScoreResponse,
    Error,
    { userId: string; score: number }
  >({
    mutationFn: ({ userId, score }) => submitScore(userId, score),
    onSuccess: (data) => {
      console.log('Score submitted successfully');
      setSubmittedScore(data.score);
      // Clear exam data from localStorage after successful submission
      localStorage.removeItem('examAnswers');
      localStorage.removeItem('examStartTime');
      localStorage.removeItem('examEndTime');
      localStorage.removeItem('examStarted');
      localStorage.removeItem('showResults');
    },
    onError: (error) => {
      console.error('Error submitting score:', error);
    }
  });

  const currentUser = users.find(user => user._id === id);
  const exam = exams[0]; // Assuming we're using the first exam

  useEffect(() => {
    const savedAnswers = localStorage.getItem('examAnswers');
    const examStartTime = localStorage.getItem('examStartTime');
    const examEndTime = localStorage.getItem('examEndTime');
    
    if (!savedAnswers || !examStartTime || !examEndTime || !currentUser || !exam) {
      console.log("Missing required data");
      navigate('/');
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const endTime = parseInt(examEndTime);

    // If time hasn't expired yet, redirect back
    if (now < endTime) {
      navigate(`/exam/${id}`);
      return;
    }

    // Calculate score using the actual exam questions and answers
    const userAnswers = JSON.parse(savedAnswers);
    let correctAnswers = 0;

    exam.questions.forEach(question => {
      if (userAnswers[question._id] === question.answer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / exam.questions.length) * 100;
    const timeTaken = Math.floor((endTime - parseInt(examStartTime)) / 1000);
    const hours = Math.floor(timeTaken / 3600);
    const minutes = Math.floor((timeTaken % 3600) / 60);
    const seconds = timeTaken % 60;

    setResult({
      score,
      totalQuestions: exam.questions.length,
      correctAnswers,
      timeTaken: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      answers: userAnswers
    });

    // Submit score to backend
    if (currentUser._id) {
      submitUserScore({ userId: currentUser._id, score });
    }
  }, [navigate, currentUser, exam, id, submitUserScore]);

  // Update loading condition to only check necessary states
  if (isLoadingUser || isLoadingExam || (!result && !submittedScore)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Show loading state only while submitting score
  if (isSubmittingScore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Submitting your score...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">
            {!currentUser ? "User not found" : "Exam not found"}
          </h2>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Ensure we have either result or submittedScore before rendering
  if (!result && submittedScore === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Get the final score and stats
  const finalScore = submittedScore ?? result?.score ?? 0;
  const totalQuestions = result?.totalQuestions ?? exam.questions.length;
  const correctAnswers = result?.correctAnswers ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Checkmark Circle */}
        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-6">
          <FiCheck className="text-white text-4xl" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Congratulations!
        </h1>
        <p className="text-gray-600 mb-2">
          You have completed your exam
        </p>
        <p className="text-gray-500 text-sm mb-8">
          {currentUser.name} - {currentUser.level}
        </p>

        {/* Score Trophy */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="text-gray-400">🏆</div>
          <div className="text-4xl font-bold text-blue-500">
            {Math.round(finalScore)}%
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-600 mb-1">Correct Answers</p>
            <p className="text-3xl font-bold text-blue-500">{correctAnswers}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-600 mb-1">Total Questions</p>
            <p className="text-3xl font-bold text-blue-500">{totalQuestions}</p>
          </div>
        </div>

        {/* Feedback Message */}
        <p className="text-gray-600 mb-8">
          {finalScore >= 70 
            ? "Great job! You've passed the exam!" 
            : "Keep practicing! You can do better next time."}
        </p>

        {/* Return Home Button */}
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 text-white px-8 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors w-full"
        >
          <FiHome className="text-xl" />
          Return Home
        </button>
      </div>
    </div>
  );
};

export default Results; 