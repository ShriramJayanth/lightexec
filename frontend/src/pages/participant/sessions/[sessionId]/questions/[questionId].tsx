import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { authApi, participantApi, Question, TestCase, Submission } from '@/lib/authApi';
import { toast } from 'sonner';
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function SolveQuestion() {
  const router = useRouter();
  const { sessionId, questionId } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [result, setResult] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const user = authApi.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'PARTICIPANT') {
      router.push('/login');
      return;
    }

    if (sessionId && questionId) {
      loadQuestion();
      loadSubmissions();
    }
  }, [sessionId, questionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuestion = async () => {
    try {
      const data = await participantApi.getSessionQuestions(sessionId as string);
      const q = data.find((q: Question) => q.id === questionId);
      
      if (!q) {
        toast.error('Question not found');
        router.push(`/participant/sessions/${sessionId}`);
        return;
      }

      setQuestion(q);
      setLanguage(q.languageId);
      setCode(q.starterCode || getDefaultCode(q.languageId));
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load question');
      router.push('/participant');
    }
  };

  const loadSubmissions = async () => {
    try {
      const data = await participantApi.getSubmissions(
        sessionId as string,
        questionId as string
      );
      setSubmissions(data);
    } catch (error) {
      // Ignore errors for submissions
    }
  };

  const getDefaultCode = (lang: string) => {
    const templates: Record<string, string> = {
      python: '# Write your solution here\ndef solution():\n    pass\n',
      javascript: '// Write your solution here\nfunction solution() {\n    \n}\n',
      typescript: '// Write your solution here\nfunction solution(): void {\n    \n}\n',
      java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
      c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
    };
    return templates[lang] || '// Write your solution here\n';
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const submission = await participantApi.submitSolution(
        sessionId as string,
        questionId as string,
        code,
        language
      );

      setResult(submission);
      loadSubmissions();

      if (submission.status === 'PASSED') {
        toast.success(`All tests passed! Score: ${submission.score}/${submission.totalScore}`);
      } else if (submission.status === 'FAILED') {
        toast.warning(`${submission.testsPassed}/${submission.testsTotal} tests passed. Score: ${submission.score}/${submission.totalScore}`);
      } else if (submission.status === 'ERROR') {
        toast.error(submission.error || 'Execution error');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLanguageMode = (lang: string) => {
    const modes: Record<string, string> = {
      python: 'python',
      javascript: 'javascript',
      typescript: 'typescript',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rust',
      ruby: 'ruby',
      php: 'php',
    };
    return modes[lang] || 'javascript';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!question) return null;

  const visibleTestCases = question.testCases?.filter((tc) => !tc.isHidden) || [];

  return (
    <>
      <Head>
        <title>{question.title} - LightExec</title>
      </Head>

      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href={`/participant/sessions/${sessionId}`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Session
            </Link>
          </div>
        </header>

        <div className="flex h-[calc(100vh-73px)]">
          {/* Left Panel - Problem Description */}
          <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold text-white">{question.title}</h1>
                <span
                  className={`px-3 py-1 text-sm rounded ${
                    question.difficulty === 'easy'
                      ? 'bg-green-900 text-green-300'
                      : question.difficulty === 'medium'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-red-900 text-red-300'
                  }`}
                >
                  {question.difficulty}
                </span>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 whitespace-pre-wrap mb-6">
                  {question.description}
                </div>
              </div>

              {visibleTestCases.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Sample Test Cases</h3>
                  {visibleTestCases.map((tc, index) => (
                    <div key={tc.id} className="mb-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <p className="text-sm font-medium text-gray-400 mb-2">Example {index + 1}</p>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Input:</span>
                          <pre className="mt-1 p-2 bg-gray-900 rounded text-sm text-gray-300 overflow-x-auto">
                            {tc.input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Output:</span>
                          <pre className="mt-1 p-2 bg-gray-900 rounded text-sm text-gray-300 overflow-x-auto">
                            {tc.output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex gap-4 text-sm text-gray-400">
                <div>
                  <Clock size={16} className="inline mr-1" />
                  Time Limit: {question.timeLimit}ms
                </div>
                <div>Memory Limit: {question.memoryLimit}MB</div>
              </div>
            </div>
          </div>

          {/* Right Panel - Code Editor & Results */}
          <div className="w-1/2 flex flex-col">
            {/* Editor Controls */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Submit
                  </>
                )}
              </button>
            </div>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                height="100%"
                language={getLanguageMode(language)}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Results Panel */}
            {result && (
              <div className="border-t border-gray-700 bg-gray-800 p-4 max-h-64 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  {result.status === 'PASSED' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <XCircle className="text-red-500" size={20} />
                  )}
                  <span className="text-white font-medium">
                    {result.status.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-sm">
                    Score: {result.score}/{result.totalScore}
                  </span>
                  <span className="text-gray-400 text-sm ml-auto">
                    {result.executionTime}ms
                  </span>
                </div>

                {result.error && (
                  <div className="mb-3 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
                    {result.error}
                  </div>
                )}

                <div className="space-y-2">
                  {result.testResults?.map((tr: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        tr.passed
                          ? 'bg-green-900/20 border-green-800'
                          : 'bg-red-900/20 border-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {tr.passed ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <XCircle size={16} className="text-red-500" />
                        )}
                        <span className="text-white text-sm font-medium">
                          Test Case {index + 1}
                        </span>
                        {!tr.hidden && (
                          <span className="text-gray-400 text-xs ml-auto">
                            {tr.points} points
                          </span>
                        )}
                      </div>
                      {!tr.hidden && (
                        <div className="text-xs text-gray-400 ml-6">
                          {tr.passed ? (
                            <span>Output matched expected result</span>
                          ) : (
                            <div>
                              <div>Expected: {tr.expected}</div>
                              <div>Got: {tr.actual}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {tr.hidden && (
                        <div className="text-xs text-gray-500 ml-6">Hidden test case</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
