import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { login, getUsers } from '../api/user.api';
import logo from "../assets/img/logo.png"
import background from "../assets/img/img-1.jpg"

// Mock data for classes - in a real app, this would come from an API
const classes = [
  { id: 1, name: 'Form One' },
  { id: 2, name: 'Form Two' },
  { id: 3, name: 'Form Three' },
  { id: 4, name: 'Form Four' },
  { id: 5, name: 'Form Five Science' },
  { id: 6, name: 'Form Five Arts' },
  { id: 7, name: 'Lower Sixth Science' },
  { id: 8, name: 'Lower Sixth Arts' },
  { id: 9, name: 'Upper Sixth Science' },
  { id: 10, name: 'Upper Sixth Arts' },
] as const;

interface User {
  _id: string;
  name: string;
  level: string;
  createdAt: string;
  score: number;
  v: number;
}

interface Student {
  id: string;
  name: string;
}

const Login = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const navigate = useNavigate();

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const loginMutation = useMutation({
    mutationFn: ({ name, level }: { name: string; level: string }) => login(name, level),
    onSuccess: (data) => {
      if (data && data._id) {
        navigate(`/${data._id}`);
      }
    },
  });

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
    setSelectedStudent(''); // Reset student selection when class changes
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudent) return;

    const selectedStudentData = availableStudents.find((s: Student) => s.id === selectedStudent);
    if (!selectedStudentData) return;

    loginMutation.mutate({
      name: selectedStudentData.name,
      level: `Form ${selectedClass}`
    });
  };

  // Get available students for the selected class from backend data
  const availableStudents: Student[] = selectedClass 
    ? users
        .filter((user: User) => user.level === `Form ${selectedClass}`)
        .map((user: User) => ({
          id: user._id,
          name: user.name
        }))
    : [];

  if (isLoadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${background})` }}>
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg bg-opacity-80">
          <div className="w-full flex justify-center">
            <img src={logo} alt="SSIC logo" className='w-48'/>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${background})` }}>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg bg-opacity-80">
        <div className="w-full flex justify-center">
          <img src={logo} alt="SSIC logo" className='w-48'/>
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Student Login
          </h2>
        </div>
        {loginMutation.isError && (
          <div className="text-red-500 text-center text-sm">
            An error occurred during login. Please try again.
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Class Selection */}
            <div>
              <label htmlFor="class-select" className="sr-only">
                Select Class
              </label>
              <select
                id="class-select"
                value={selectedClass}
                onChange={handleClassChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                required
              >
                <option value="">Select your class</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Selection */}
            <div>
              <label htmlFor="student-select" className="sr-only">
                Select Student
              </label>
              <select
                id="student-select"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                required
                disabled={!selectedClass}
              >
                <option value="">
                  {selectedClass ? 'Select your name' : 'Please select a class first'}
                </option>
                {availableStudents.map((student: Student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedClass || !selectedStudent || loginMutation.isPending}
            >
              {loginMutation.isPending 
                ? 'Logging in...'
                : !selectedClass 
                ? 'Select a class to continue'
                : !selectedStudent 
                ? 'Select your name to continue'
                : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
