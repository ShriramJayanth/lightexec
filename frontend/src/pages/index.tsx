import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useEditorStore } from '@/store/editorStore';
import { getLanguages, executeCode, getStats } from '@/lib/api';
import { Header } from '@/components/Header';
import { CodeEditor } from '@/components/CodeEditor';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ExecutionControls } from '@/components/ExecutionControls';
import { OutputPanel } from '@/components/OutputPanel';
import { StatsPanel } from '@/components/StatsPanel';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'sonner';
import { Play, Loader2 } from 'lucide-react';

export default function Home() {
  const {
    code,
    language,
    languages,
    stdin,
    isExecuting,
    setLanguages,
    setLanguage,
    setIsExecuting,
    setExecutionResult,
    setStats,
  } = useEditorStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Fetch supported languages
    getLanguages()
      .then((langs) => {
        setLanguages(langs);
        if (langs.length > 0 && !language) {
          setLanguage(langs.find((l) => l.id === 'python') || langs[0]);
        }
      })
      .catch((error) => {
        toast.error('Failed to load languages');
        console.error(error);
      });

    // Fetch stats periodically
    const statsInterval = setInterval(() => {
      getStats()
        .then(setStats)
        .catch(console.error);
    }, 5000);

    return () => clearInterval(statsInterval);
  }, []);

  const handleExecute = async () => {
    if (!language) {
      toast.error('Please select a language');
      return;
    }

    if (!code.trim()) {
      toast.error('Please write some code');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await executeCode({
        code,
        language: language.id,
        stdin: stdin || undefined,
        timeout: language.defaultTimeout,
        memoryLimit: language.defaultMemory,
      });

      setExecutionResult(result);

      if (result.error) {
        toast.error(`Execution failed: ${result.error}`);
      } else if (result.exitCode !== 0) {
        toast.warning(`Exited with code ${result.exitCode}`);
      } else {
        toast.success(`Executed in ${result.executionTime}ms`);
      }

      // Refresh stats
      getStats().then(setStats).catch(console.error);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Execution failed');
      console.error(error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <Head>
        <title>LightExec - Secure Online Code Execution</title>
        <meta name="description" content="Lightweight container-based sandbox for secure online code execution" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} />

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Top Controls */}
            <div className="border-b border-border bg-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <LanguageSelector />
                <ExecutionControls />
              </div>
              
              <button
                onClick={handleExecute}
                disabled={isExecuting || !language}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Code
                  </>
                )}
              </button>
            </div>

            {/* Editor and Output */}
            <div className="flex-1 flex overflow-hidden">
              {/* Code Editor */}
              <div className="flex-1 flex flex-col border-r border-border">
                <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-sm text-muted-foreground font-mono">
                      {language ? `main${language.extensions[0]}` : 'main.txt'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {code.split('\n').length} lines
                  </div>
                </div>
                <CodeEditor />
              </div>

              {/* Output Panel */}
              <div className="w-1/2 flex flex-col">
                <OutputPanel />
              </div>
            </div>
          </main>

          {/* Stats Panel */}
          <StatsPanel />
        </div>
      </div>
    </>
  );
}
