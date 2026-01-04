import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { authApi, adminApi, Question, TestCase } from '@/lib/authApi';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';

export default function EditQuestion() {
  const router = useRouter();
  const { id } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [languageId, setLanguageId] = useState('python');
  const [timeLimit, setTimeLimit] = useState(5000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [starterCode, setStarterCode] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const user = authApi.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    if (id) {
      loadQuestion();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuestion = async () => {
    try {
      const question: Question = await adminApi.getQuestion(id as string);
      setTitle(question.title);
      setDescription(question.description);
      setDifficulty(question.difficulty);
      setLanguageId(question.languageId);
      setTimeLimit(question.timeLimit);
      setMemoryLimit(question.memoryLimit);
      setStarterCode(question.starterCode || '');
      setTestCases(question.testCases || []);
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load question');
      router.push('/admin');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (testCases.length === 0) {
      toast.error('Please add at least one test case');
      return;
    }

    setIsSaving(true);

    try {
      await adminApi.updateQuestion(id as string, {
        title,
        description,
        difficulty,
        languageId,
        timeLimit,
        memoryLimit,
        starterCode,
      });

      toast.success('Question updated successfully!', { duration: 2000 });
      router.push('/admin');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update question', { duration: 4000 });
    } finally {
      setIsSaving(false);
    }
  };

  const addTestCase = () => {
    setTestCases([...testCases, { id: `temp-${Date.now()}`, input: '', output: '', isHidden: false, points: 10 }]);
  };

  const updateTestCase = async (index: number, field: keyof TestCase, value: any) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);

    // If test case has an ID (not temp), update on backend
    if (!updated[index].id.startsWith('temp-')) {
      try {
        await adminApi.updateTestCase(updated[index].id, { [field]: value });
      } catch (error) {
        toast.error('Failed to update test case');
      }
    }
  };

  const deleteTestCase = async (index: number) => {
    const testCase = testCases[index];
    
    if (!testCase.id.startsWith('temp-')) {
      try {
        await adminApi.deleteTestCase(testCase.id);
        toast.success('Test case deleted');
      } catch (error) {
        toast.error('Failed to delete test case');
        return;
      }
    }

    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const saveNewTestCase = async (index: number) => {
    const testCase = testCases[index];
    
    if (testCase.id.startsWith('temp-')) {
      try {
        const created = await adminApi.addTestCase(id as string, {
          input: testCase.input,
          output: testCase.output,
          isHidden: testCase.isHidden,
          points: testCase.points,
        });
        
        const updated = [...testCases];
        updated[index] = created;
        setTestCases(updated);
        toast.success('Test case saved');
      } catch (error) {
        toast.error('Failed to save test case');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Question - LightExec Admin</title>
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
          <h1 className="text-3xl font-bold text-white mb-8">Edit Question</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Question Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
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
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (ms)</label>
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                      min={1000}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Memory Limit (MB)</label>
                    <input
                      type="number"
                      value={memoryLimit}
                      onChange={(e) => setMemoryLimit(parseInt(e.target.value))}
                      min={64}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Starter Code (Optional)</label>
                  <textarea
                    value={starterCode}
                    onChange={(e) => setStarterCode(e.target.value)}
                    rows={4}
                    placeholder="# Write your starter code here"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Add Test Case
                </button>
              </div>

              <div className="space-y-4">
                {testCases.map((testCase, index) => (
                  <div key={testCase.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-white font-medium">Test Case {index + 1}</h3>
                      <div className="flex gap-2">
                        {testCase.id.startsWith('temp-') && (
                          <button
                            type="button"
                            onClick={() => saveNewTestCase(index)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          >
                            Save
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteTestCase(index)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Input</label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Expected Output</label>
                        <textarea
                          value={testCase.output}
                          onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-gray-300">
                        <input
                          type="checkbox"
                          checked={testCase.isHidden}
                          onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                          className="w-4 h-4 rounded bg-gray-600 border-gray-500"
                        />
                        <span className="text-sm">Hidden Test Case</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-300">Points:</label>
                        <input
                          type="number"
                          value={testCase.points}
                          onChange={(e) => updateTestCase(index, 'points', parseInt(e.target.value) || 0)}
                          min={0}
                          className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {testCases.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No test cases yet. Add one to get started.</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : 'Update Question'}
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
