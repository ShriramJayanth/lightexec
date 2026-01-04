import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { authApi, adminApi, Question, Session } from '@/lib/authApi';
import { toast } from 'sonner';
import Link from 'next/link';
import { Plus, LogOut, FileQuestion, Calendar, Users, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const user = authApi.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [questionsData, sessionsData] = await Promise.all([
        adminApi.getQuestions(),
        adminApi.getSessions(),
      ]);
      setQuestions(questionsData);
      setSessions(sessionsData);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if question is used in any session
    const usedInSessions = sessions.filter(s => s.questionIds.includes(questionId));
    if (usedInSessions.length > 0) {
      toast.error(`Cannot delete: Question is used in ${usedInSessions.length} session(s)`);
      return;
    }

    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await adminApi.deleteQuestion(questionId);
      toast.success('Question deleted successfully', { duration: 2000 });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete question', { duration: 4000 });
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await adminApi.deleteSession(sessionId);
      toast.success('Session deleted successfully', { duration: 2000 });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete session', { duration: 4000 });
    }
  };

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - LightExec</title>
      </Head>

      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">LightExec Admin</h1>
                <p className="text-gray-400 text-sm">Welcome, {user?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Questions</p>
                  <p className="text-3xl font-bold text-white mt-2">{questions.length}</p>
                </div>
                <FileQuestion className="text-blue-500" size={40} />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Sessions</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {sessions.filter((s) => s.isActive).length}
                  </p>
                </div>
                <Calendar className="text-green-500" size={40} />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Sessions</p>
                  <p className="text-3xl font-bold text-white mt-2">{sessions.length}</p>
                </div>
                <Users className="text-purple-500" size={40} />
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Questions</h2>
              <Link
                href="/admin/questions/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
                New Question
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questions.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                  <FileQuestion className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">No questions yet. Create your first question!</p>
                </div>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{question.title}</h3>
                        <span
                          className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
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
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/questions/${question.id}/edit`}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={(e) => handleDeleteQuestion(question.id, e)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {question.description}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{question.languageId}</span>
                      <span className="text-gray-500">
                        {question.testCases?.length || 0} test cases
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sessions Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Sessions</h2>
              <Link
                href="/admin/sessions/new"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
                New Session
              </Link>
            </div>

            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                  <Calendar className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">No sessions yet. Create your first session!</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="block bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{session.name}</h3>
                        <p className="text-gray-400 text-sm mt-1">{session.description}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 text-xs rounded ${
                              session.isActive
                                ? 'bg-green-900 text-green-300'
                                : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {session.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-3 py-1 text-xs bg-blue-900 text-blue-300 rounded font-mono">
                            {session.accessCode}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/sessions/${session.id}/participants`}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Users size={16} className="inline mr-1" />
                            Participants
                          </Link>
                          <Link
                            href={`/admin/sessions/${session.id}/edit`}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4 text-sm text-gray-400">
                      <span>{session.questionIds.length} questions</span>
                      <span>•</span>
                      <span>{new Date(session.startTime).toLocaleDateString()}</span>
                      <span>→</span>
                      <span>{new Date(session.endTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
