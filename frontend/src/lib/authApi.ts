import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PARTICIPANT';
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/register', { email, password, name });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/login', { email, password });
    return data;
  },

  verify: async (): Promise<{ valid: boolean; user: User }> => {
    const { data } = await api.get('/api/auth/verify');
    return data;
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  },

  setAuth: (user: User, token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  },

  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  },
};

// Admin API
export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  languageId: string;
  starterCode?: string;
  timeLimit: number;
  memoryLimit: number;
  testCases?: TestCase[];
  createdAt: string;
}

export interface TestCase {
  id: string;
  input: string;
  output: string;
  isHidden: boolean;
  points: number;
}

export interface Session {
  id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  accessCode: string;
  isActive: boolean;
  questionIds: string[];
  questions?: Question[];
  createdAt: string;
}

export const adminApi = {
  // Questions
  createQuestion: async (question: Partial<Question>): Promise<Question> => {
    const { data } = await api.post('/api/admin/questions', question);
    return data;
  },

  getQuestions: async (): Promise<Question[]> => {
    const { data } = await api.get('/api/admin/questions');
    return data;
  },

  getQuestion: async (id: string): Promise<Question> => {
    const { data } = await api.get(`/api/admin/questions/${id}`);
    return data;
  },

  updateQuestion: async (id: string, question: Partial<Question>): Promise<Question> => {
    const { data } = await api.put(`/api/admin/questions/${id}`, question);
    return data;
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/questions/${id}`);
  },

  // Test Cases
  addTestCase: async (questionId: string, testCase: Partial<TestCase>): Promise<TestCase> => {
    const { data } = await api.post(`/api/admin/questions/${questionId}/testcases`, testCase);
    return data;
  },

  updateTestCase: async (testCaseId: string, testCase: Partial<TestCase>): Promise<TestCase> => {
    const { data } = await api.put(`/api/admin/testcases/${testCaseId}`, testCase);
    return data;
  },

  deleteTestCase: async (testCaseId: string): Promise<void> => {
    await api.delete(`/api/admin/testcases/${testCaseId}`);
  },

  // Sessions
  createSession: async (session: Partial<Session>): Promise<Session> => {
    const { data } = await api.post('/api/admin/sessions', session);
    return data;
  },

  getSessions: async (): Promise<Session[]> => {
    const { data } = await api.get('/api/admin/sessions');
    return data;
  },

  getSession: async (id: string): Promise<Session> => {
    const { data } = await api.get(`/api/admin/sessions/${id}`);
    return data;
  },

  updateSession: async (id: string, session: Partial<Session>): Promise<Session> => {
    const { data } = await api.put(`/api/admin/sessions/${id}`, session);
    return data;
  },

  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/sessions/${id}`);
  },
};

// Participant API
export interface Submission {
  id: string;
  code: string;
  language: string;
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'ERROR';
  executionTime?: number;
  memoryUsage?: number;
  score: number;
  totalScore: number;
  testsPassed: number;
  testsTotal: number;
  output?: string;
  error?: string;
  submittedAt: string;
}

export const participantApi = {
  joinSession: async (accessCode: string): Promise<Session> => {
    const { data } = await api.post('/api/participant/sessions/join', { accessCode });
    return data;
  },

  getSessions: async (): Promise<Session[]> => {
    const { data } = await api.get('/api/participant/sessions');
    return data;
  },

  getSessionQuestions: async (sessionId: string): Promise<Question[]> => {
    const { data } = await api.get(`/api/participant/sessions/${sessionId}/questions`);
    return data;
  },

  getQuestion: async (sessionId: string, questionId: string): Promise<Question> => {
    const { data } = await api.get(`/api/participant/sessions/${sessionId}/questions/${questionId}`);
    return data;
  },

  submitSolution: async (
    sessionId: string,
    questionId: string,
    code: string,
    language: string
  ): Promise<Submission> => {
    const { data } = await api.post(
      `/api/participant/sessions/${sessionId}/questions/${questionId}/submit`,
      { code, language }
    );
    return data;
  },

  getSubmissions: async (sessionId: string, questionId: string): Promise<Submission[]> => {
    const { data } = await api.get(
      `/api/participant/sessions/${sessionId}/questions/${questionId}/submissions`
    );
    return data;
  },
};

export default api;
