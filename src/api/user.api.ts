import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.1.238:3030/api/v1', 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
});

// Fetch Users
export const getUsers = async () => {
    try {
        const response = await api.get('/users/all');
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Create User
export const createUser = async (name: string, level: string) => {
    try {
        const response = await api.post('/users/', { name, level });
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Login
export const login = async (name: string, level: string) => {
    try {
        const response = await api.post('/users/login', { name, level });
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

// Submit Score
export const submitScore = async (id: string, score: number) => {
    try {
        const response = await api.post(`/users/submitScore/${id}`, { score });
        return response.data;
    } catch (error) {
        console.error('Error submitting score:', error);
        throw error;
    }
};

// Questions Endpoint (already written, no errors found)
export const getQuestions = async () => {
    try {
        const response = await api.get('/questions/all');
        return response.data;
    } catch (error) {
        console.error('Error getting questions:', error);
        throw error;
    }
};

export const getExam = async () => {
    try {
        const response = await api.get('/exams/');
        return response.data;
    } catch (error) {
        console.error('Error getting exam:', error);
        throw error;
    }
}
