import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { authApi, participantApi, Question } from '@/lib/authApi';
import { toast } from 'sonner';
import { ArrowLeft, Clock, CheckCircle, Loader2 } from 'lucide-react';

export default function SessionQuestions() {
  const router = useRouter();
  const { sessionId } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const user = authApi.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'PARTICIPANT') {
      router.push('/login');
      return;
    }

    if (sessionId) {
      loadSession();
      loadQuestions();
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSession = async () => {
    try {
      const sessions = await participantApi.getSessions();
      const s = sessions.find((s: any) => s.id === sessionId);
      setSession(s);
    } catch (error) {
      toast.error('Failed to load session');
    }
  };

  const loadQuestions = async () => {
    try {
      const data = await participantApi.getSessionQuestions(sessionId as string);
      setQuestions(data);
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load questions');
      router.push('/participant');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  const isSessionActive = session && new Date(session.startTime) <= new Date() && new Date(session.endTime) >= new Date();

  return (
    <>
      <Head>
        <title>{session?.name || 'Session'} - LightExec</title>
      </Head>

      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/participant"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Session Info */}
          {session && (
            <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{session.name}</h1>
                  {session.description && (
                    <p className="text-gray-400">{session.description}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    session.status === 'active'
                      ? 'bg-green-900 text-green-300'
                      : session.status === 'upcoming'
                      ? 'bg-blue-900 text-blue-300'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {session.status}
                </span>
              </div>

              <div className="flex gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>
                    {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}
                  </span>
                </div>
              </div>

              {!isSessionActive && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded text-yellow-300 text-sm">
                  {session.status === 'upcoming' ? '⏰ Session has not started yet' : '⏱️ Session has ended'}
                </div>
              )}
            </div>
          )}

          {/* Questions List */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Problems ({questions.length})
            </h2>

            {questions.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-400">No questions in this session</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {questions.map((question, index) => (
                  <Link
                    key={question.id}
                    href={`/participant/sessions/${sessionId}/questions/${question.id}`}
                    className="block bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-medium">#{index + 1}</span>
                        <h3 className="text-lg font-semibold text-white">
                          {question.title}
                        </h3>
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
                      {question.isCompleted && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-500" size={20} />
                          <span className="text-green-400 text-sm font-medium">Completed</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {question.description}
                    </p>

                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{question.languageId}</span>
                      <span>•</span>
                      <span>{question.testCases?.length || 0} test cases</span>
                      <span>•</span>
                      <span>{question.timeLimit}ms</span>
                      <span>•</span>
                      <span>{question.memoryLimit}MB</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
