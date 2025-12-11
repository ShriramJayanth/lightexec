import { create } from 'zustand';

export interface Language {
  id: string;
  name: string;
  version: string;
  extensions: string[];
  supportsCompilation: boolean;
  defaultTimeout: number;
  defaultMemory: number;
}

export interface ExecutionResult {
  executionId: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  compilationOutput?: string;
  error?: string;
  securityViolations?: string[];
}

export interface Stats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  securityViolations: number;
  activeContainers: number;
  pooledContainers: number;
}

interface EditorStore {
  code: string;
  language: Language | null;
  languages: Language[];
  stdin: string;
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  stats: Stats | null;
  theme: 'vs-dark' | 'light';
  
  setCode: (code: string) => void;
  setLanguage: (language: Language) => void;
  setLanguages: (languages: Language[]) => void;
  setStdin: (stdin: string) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  setExecutionResult: (result: ExecutionResult | null) => void;
  setStats: (stats: Stats | null) => void;
  toggleTheme: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  code: '# Write your code here\nprint("Hello from LightExec!")',
  language: null,
  languages: [],
  stdin: '',
  isExecuting: false,
  executionResult: null,
  stats: null,
  theme: 'vs-dark',
  
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setLanguages: (languages) => set({ languages }),
  setStdin: (stdin) => set({ stdin }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setExecutionResult: (executionResult) => set({ executionResult }),
  setStats: (stats) => set({ stats }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'vs-dark' ? 'light' : 'vs-dark' })),
}));
