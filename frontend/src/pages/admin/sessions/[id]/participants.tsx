import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { authApi, adminApi } from '@/lib/authApi';
import { toast } from 'sonner';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, Award, Loader2 } from 'lucide-react';

interface ParticipantStatus {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  joinedAt: string;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  score: {
    achieved: number;
    maximum: number;
    percentage: number;
  };
  questions: Array<{
    questionId: string;
    status: string;
    score: number;
    totalScore: number;
    attempts: number;
    lastAttempt: string | null;
    firstAcceptedAt?: string | null;
  }>;
  totalAttempts: number;
  earliestCompletion: number | null;
}

export default function SessionParticipants() {
  const router = useRouter();
  const { id } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<ParticipantStatus[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  const user = authApi.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    if (id) {
      loadSessionData();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSessionData = async () => {
    try {
      // Load session details
      const sessionData = await adminApi.getSession(id as string);
      setSession(sessionData);

      // Load questions
      const questionsData = await Promise.all(
        sessionData.questionIds.map((qid: string) => adminApi.getQuestion(qid))
      );
      setQuestions(questionsData);

      // Load participants
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/sessions/${id}/participants`, {
        headers: {
          'Authorization': `Bearer ${authApi.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load participants');
      }

      const data = await response.json();
      setParticipants(data);
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load session data');
      router.push('/admin');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'text-green-500';
      case 'FAILED':
        return 'text-yellow-500';
      case 'ERROR':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'FAILED':
      case 'ERROR':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  return (
    <>
      <Head>
        <title>Participants - {session?.name || 'Session'} - LightExec Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href={`/admin/sessions/${id}/edit`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Session
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Session Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users size={32} className="text-blue-500" />
              <h1 className="text-3xl font-bold text-white">{session?.name}</h1>
            </div>
            <p className="text-gray-400">
              {participants.length} Participant{participants.length !== 1 ? 's' : ''} • {questions.length} Question{questions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-blue-500" />
                <div>
                  <p className="text-gray-400 text-sm">Total Participants</p>
                  <p className="text-2xl font-bold text-white">{participants.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-500" />
                <div>
                  <p className="text-gray-400 text-sm">Avg Completion</p>
                  <p className="text-2xl font-bold text-white">
                    {participants.length > 0
                      ? Math.round(participants.reduce((sum, p) => sum + p.progress.percentage, 0) / participants.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-yellow-500" />
                <div>
                  <p className="text-gray-400 text-sm">Avg Score</p>
                  <p className="text-2xl font-bold text-white">
                    {participants.length > 0
                      ? Math.round(participants.reduce((sum, p) => sum + p.score.percentage, 0) / participants.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-purple-500" />
                <div>
                  <p className="text-gray-400 text-sm">Total Attempts</p>
                  <p className="text-2xl font-bold text-white">
                    {participants.reduce((sum, p) => sum + p.totalAttempts, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Participants Table */}
          {participants.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No participants have joined this session yet</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Participant
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Score
                      </th>
                      {questions.map((q, idx) => (
                        <th key={q.id} className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Q{idx + 1}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Attempts
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {participants.map((participant, index) => {
                      const rank = index + 1;
                      const getRankDisplay = () => {
                        if (rank === 1) return <span className="text-2xl">🥇</span>;
                        if (rank === 2) return <span className="text-2xl">🥈</span>;
                        if (rank === 3) return <span className="text-2xl">🥉</span>;
                        return <span className="text-gray-400 font-medium">#{rank}</span>;
                      };
                      
                      return (
                        <tr key={participant.user.id} className={`hover:bg-gray-750 ${
                          rank <= 3 ? 'bg-gray-800/50' : ''
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getRankDisplay()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {participant.user.name || 'Unnamed'}
                            </div>
                            <div className="text-sm text-gray-400">{participant.user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-white">
                            {participant.progress.completed}/{participant.progress.total}
                          </div>
                          <div className="text-xs text-gray-400">
                            {participant.progress.percentage}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-white">
                            {participant.score.achieved}/{participant.score.maximum}
                          </div>
                          <div className="text-xs text-gray-400">
                            {participant.score.percentage}%
                          </div>
                        </td>
                        {questions.map((q) => {
                          const qStat = participant.questions.find(qs => qs.questionId === q.id);
                          return (
                            <td key={q.id} className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getStatusIcon(qStat?.status || 'NOT_ATTEMPTED')}
                                <span className={`text-xs ${getStatusColor(qStat?.status || 'NOT_ATTEMPTED')}`}>
                                  {qStat?.score || 0}/{qStat?.totalScore || 0}
                                </span>
                              </div>
                              {qStat && qStat.attempts > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {qStat.attempts} attempt{qStat.attempts !== 1 ? 's' : ''}
                                </div>
                              )}
                              {qStat && qStat.firstAcceptedAt && (
                                <div className="text-xs text-green-400 mt-1">
                                  ✓ {new Date(qStat.firstAcceptedAt).toLocaleTimeString()}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">
                          {participant.totalAttempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">
                          {new Date(participant.joinedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
