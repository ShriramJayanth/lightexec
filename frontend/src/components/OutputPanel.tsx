import { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { cn, formatTime, formatBytes } from '@/lib/utils';
import {
  Terminal,
  AlertCircle,
  CheckCircle2,
  Clock,
  MemoryStick,
  XCircle,
  FileText,
  Shield,
} from 'lucide-react';

type Tab = 'output' | 'stdin' | 'info';

export function OutputPanel() {
  const { executionResult, isExecuting, stdin, setStdin } = useEditorStore();
  const [activeTab, setActiveTab] = useState<Tab>('output');

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'output', label: 'Output', icon: Terminal },
    { id: 'stdin', label: 'Input', icon: FileText },
    { id: 'info', label: 'Info', icon: Shield },
  ];

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Tabs */}
      <div className="flex items-center border-b border-border bg-secondary/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-foreground bg-card'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'output' && (
          <div className="p-4 font-mono text-sm">
            {isExecuting ? (
              <div className="flex items-center gap-2 text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Executing code...
              </div>
            ) : executionResult ? (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {executionResult.exitCode === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={cn(
                    'font-medium',
                    executionResult.exitCode === 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {executionResult.exitCode === 0 ? 'Success' : `Exit Code: ${executionResult.exitCode}`}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {formatTime(executionResult.executionTime)}
                  </span>
                </div>

                {/* Compilation Output */}
                {executionResult.compilationOutput && (
                  <div className="space-y-2">
                    <div className="text-yellow-500 font-medium">Compilation Output:</div>
                    <pre className="text-yellow-400 whitespace-pre-wrap bg-secondary/50 p-3 rounded">
                      {executionResult.compilationOutput}
                    </pre>
                  </div>
                )}

                {/* Stdout */}
                {executionResult.stdout && (
                  <div className="space-y-2">
                    <div className="text-green-500 font-medium">Standard Output:</div>
                    <pre className="text-green-400 whitespace-pre-wrap bg-secondary/50 p-3 rounded">
                      {executionResult.stdout}
                    </pre>
                  </div>
                )}

                {/* Stderr */}
                {executionResult.stderr && (
                  <div className="space-y-2">
                    <div className="text-red-500 font-medium">Standard Error:</div>
                    <pre className="text-red-400 whitespace-pre-wrap bg-secondary/50 p-3 rounded">
                      {executionResult.stderr}
                    </pre>
                  </div>
                )}

                {/* Error */}
                {executionResult.error && (
                  <div className="space-y-2">
                    <div className="text-red-500 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Error:
                    </div>
                    <pre className="text-red-400 whitespace-pre-wrap bg-secondary/50 p-3 rounded">
                      {executionResult.error}
                    </pre>
                  </div>
                )}

                {/* Security Violations */}
                {executionResult.securityViolations && executionResult.securityViolations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-yellow-500 font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Security Warnings:
                    </div>
                    <ul className="text-yellow-400 space-y-1 bg-secondary/50 p-3 rounded">
                      {executionResult.securityViolations.map((violation, i) => (
                        <li key={i}>• {violation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!executionResult.stdout && !executionResult.stderr && !executionResult.error && (
                  <div className="text-muted-foreground italic">No output</div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground italic">
                Run your code to see output here
              </div>
            )}
          </div>
        )}

        {activeTab === 'stdin' && (
          <div className="p-4">
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input for your program (if needed)..."
              className="w-full h-full min-h-[200px] bg-secondary border border-border rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              This input will be passed to your program via stdin
            </div>
          </div>
        )}

        {activeTab === 'info' && executionResult && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Execution Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatTime(executionResult.executionTime)}
                </div>
              </div>

              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MemoryStick className="w-4 h-4" />
                  <span className="text-sm">Memory Used</span>
                </div>
                <div className="text-2xl font-bold">
                  {executionResult.memoryUsed} MB
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Execution ID</span>
                <span className="font-mono">{executionResult.executionId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Exit Code</span>
                <span className={cn(
                  'font-mono font-medium',
                  executionResult.exitCode === 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {executionResult.exitCode}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <span className={cn(
                  'font-medium',
                  executionResult.exitCode === 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {executionResult.exitCode === 0 ? 'Completed' : 'Failed'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
