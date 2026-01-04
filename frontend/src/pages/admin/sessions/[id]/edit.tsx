import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { authApi, adminApi, Question, Session } from '@/lib/authApi';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';

export default function EditSession() {
  const router = useRouter();
  const { id } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [accessCode, setAccessCode] = useState('');

  const user = authApi.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    if (id) {
      loadSession();
      loadQuestions();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSession = async () => {
    try {
      const session: Session = await adminApi.getSession(id as string);
      setName(session.name);
      setDescription(session.description || '');
      setStartTime(new Date(session.startTime).toISOString().slice(0, 16));
      setEndTime(new Date(session.endTime).toISOString().slice(0, 16));
      setSelectedQuestions(session.questionIds);
      setAccessCode(session.accessCode);
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load session');
      router.push('/admin');
    }
  };

  const loadQuestions = async () => {
    try {
      const data = await adminApi.getQuestions();
      setQuestions(data);
    } catch (error) {
      toast.error('Failed to load questions');
    }
  };

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((qid) => qid !== questionId) : [...prev, questionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    setIsSaving(true);

    try {
      await adminApi.updateSession(id as string, {
        name,
        description,
        startTime,
        endTime,
        questionIds: selectedQuestions,
      });

      toast.success('Session updated successfully!', { duration: 2000 });
      router.push('/admin');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update session', { duration: 4000 });
    } finally {
      setIsSaving(false);
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
        <title>Edit Session - LightExec Admin</title>
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Edit Session</h1>
            <Link
              href={`/admin/sessions/${id}/participants`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              View Participants
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Access Code Display */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300 mb-1">Access Code (Read-only)</p>
                  <p className="text-xl font-mono font-bold text-white">{accessCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(accessCode);
                    toast.success('Access code copied!');
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Copy Code
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Session Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Session Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Backend Developer Interview"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe the purpose of this session..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 [color-scheme:dark]"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 [color-scheme:dark]"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Question Selection */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                Select Questions ({selectedQuestions.length} selected)
              </h2>

              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto text-gray-600 mb-3" size={48} />
                  <p className="text-gray-400 mb-4">No questions available</p>
                  <Link
                    href="/admin/questions/new"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Question
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedQuestions.includes(question.id)
                          ? 'border-green-500 bg-green-900/20'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                      onClick={() => toggleQuestion(question.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => {}}
                          className="mt-1 w-5 h-5 rounded bg-gray-600 border-gray-500 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium">{question.title}</h3>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
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
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {question.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>{question.languageId}</span>
                            <span>•</span>
                            <span>{question.testCases?.length || 0} test cases</span>
                            <span>•</span>
                            <span>{question.timeLimit}ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSaving || questions.length === 0}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : 'Update Session'}
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
