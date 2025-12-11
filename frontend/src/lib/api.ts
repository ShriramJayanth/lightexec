import axios from 'axios';
import type { ExecutionResult, Language, Stats } from '@/store/editorStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const executeCode = async (params: {
  code: string;
  language: string;
  stdin?: string;
  timeout?: number;
  memoryLimit?: number;
}): Promise<ExecutionResult> => {
  const response = await api.post<ExecutionResult>('/api/execute', params);
  return response.data;
};

export const getLanguages = async (): Promise<Language[]> => {
  const response = await api.get<{ languages: Language[] }>('/api/languages');
  return response.data.languages;
};

export const getStats = async (): Promise<Stats> => {
  const response = await api.get<Stats>('/api/stats');
  return response.data;
};

export default api;
