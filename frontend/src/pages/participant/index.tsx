import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { authApi, participantApi, Session } from '@/lib/authApi';
import { toast } from 'sonner';
import Link from 'next/link';
import { Plus, LogOut, Calendar, Code } from 'lucide-react';

export default function ParticipantDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [accessCode, setAccessCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const user = authApi.getCurrentUser();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSessions = async () => {
    try {
      const data = await participantApi.getSessions();
      setSessions(data);
    } catch (error: any) {
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);

    try {
      await participantApi.joinSession(accessCode);
      toast.success('Joined session successfully!');
      setShowJoinModal(false);
      setAccessCode('');
      loadSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join session');
    } finally {
      setIsJoining(false);
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
        <title>My Sessions - LightExec</title>
      </Head>

      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">LightExec</h1>
                <p className="text-gray-400 text-sm">Welcome, {user?.name}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Code size={18} />
                  Playground
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">My Sessions</h2>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Join Session
            </button>
          </div>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
                <Calendar className="mx-auto text-gray-600 mb-4" size={64} />
                <p className="text-gray-400 mb-4">No sessions yet</p>
                <p className="text-gray-500 text-sm">
                  Join a session using an access code to get started!
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/participant/sessions/${session.id}`}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-500 transition-colors"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{session.name}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{session.description}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Questions:</span>
                      <span className="text-white">{session.questions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          session.isActive
                            ? 'bg-green-900 text-green-300'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {session.isActive ? 'Active' : 'Ended'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ends:</span>
                      <span className="text-white">
                        {new Date(session.endTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>

        {/* Join Session Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Join Session</h3>
              <form onSubmit={handleJoinSession} className="space-y-4">
                <div>
                  <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300 mb-2">
                    Access Code
                  </label>
                  <input
                    id="accessCode"
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    required
                    placeholder="ABC123XY"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-center text-lg"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinModal(false);
                      setAccessCode('');
                    }}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isJoining}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {isJoining ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
