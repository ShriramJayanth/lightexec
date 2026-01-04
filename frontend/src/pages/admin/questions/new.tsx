import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { authApi, adminApi } from '@/lib/authApi';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function NewQuestion() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [languageId, setLanguageId] = useState('python');
  const [starterCode, setStarterCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(5000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [testCases, setTestCases] = useState([
    { input: '', output: '', isHidden: false, points: 10 },
  ]);

  const user = authApi.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', output: '', isHidden: false, points: 10 }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (index: number, field: string, value: any) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create question
      const question = await adminApi.createQuestion({
        title,
        description,
        difficulty,
        languageId,
        starterCode: starterCode || undefined,
        timeLimit,
        memoryLimit,
      });

      // Add test cases
      for (const tc of testCases) {
        if (tc.input || tc.output) {
          await adminApi.addTestCase(question.id, tc);
        }
      }

      toast.success('Question created successfully!', { duration: 2000 });
      router.push('/admin');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create question', { duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>New Question - LightExec Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">Create New Question</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Two Sum Problem"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide a detailed problem description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Difficulty *
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Language *
                    </label>
                    <select
                      value={languageId}
                      onChange={(e) => setLanguageId(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="ruby">Ruby</option>
                      <option value="php">PHP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Starter Code (Optional)
                  </label>
                  <textarea
                    value={starterCode}
                    onChange={(e) => setStarterCode(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="def solution():\n    pass"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time Limit (ms)
                    </label>
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      min="1000"
                      step="1000"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Memory Limit (MB)
                    </label>
                    <input
                      type="number"
                      value={memoryLimit}
                      onChange={(e) => setMemoryLimit(Number(e.target.value))}
                      min="64"
                      step="64"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Test Cases</h2>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Test Case
                </button>
              </div>

              <div className="space-y-4">
                {testCases.map((tc, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-white font-medium">Test Case {index + 1}</h3>
                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Input</label>
                        <textarea
                          value={tc.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Input data..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Expected Output</label>
                        <textarea
                          value={tc.output}
                          onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Expected output..."
                        />
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`hidden-${index}`}
                            checked={tc.isHidden}
                            onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                            className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`hidden-${index}`} className="text-sm text-gray-300">
                            Hidden Test Case
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-300">Points:</label>
                          <input
                            type="number"
                            value={tc.points}
                            onChange={(e) => updateTestCase(index, 'points', Number(e.target.value))}
                            min="1"
                            className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Question'}
              </button>
              <Link
                href="/admin"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
