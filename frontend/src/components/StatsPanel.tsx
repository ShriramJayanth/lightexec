import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Activity, CheckCircle, XCircle, Shield, Container, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatsPanel() {
  const { stats } = useEditorStore();

  if (!stats) return null;

  const successRate = stats.totalExecutions > 0
    ? ((stats.successfulExecutions / stats.totalExecutions) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="w-80 border-l border-border bg-card overflow-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          System Stats
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Real-time platform metrics</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Success Rate */}
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">Success Rate</div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-green-500">{successRate}%</div>
            <div className="text-sm text-muted-foreground mb-1">
              {stats.successfulExecutions}/{stats.totalExecutions}
            </div>
          </div>
          <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Execution Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Successful</span>
            </div>
            <span className="font-mono font-bold text-green-500">
              {stats.successfulExecutions}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">Failed</span>
            </div>
            <span className="font-mono font-bold text-red-500">
              {stats.failedExecutions}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Security Violations</span>
            </div>
            <span className="font-mono font-bold text-yellow-500">
              {stats.securityViolations}
            </span>
          </div>
        </div>

        {/* Container Stats */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Container Status</div>
          
          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Container className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Active</span>
            </div>
            <span className="font-mono font-bold text-blue-400">
              {stats.activeContainers}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-sm">Pooled</span>
            </div>
            <span className="font-mono font-bold text-purple-400">
              {stats.pooledContainers}
            </span>
          </div>
        </div>

        {/* Average Execution Time */}
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">Avg. Execution Time</div>
          <div className="text-2xl font-bold text-primary">
            {stats.avgExecutionTime.toFixed(0)}ms
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Across all executions
          </div>
        </div>

        {/* Info */}
        <div className="bg-secondary/20 rounded-lg p-3 text-xs text-muted-foreground">
          <p>Stats update every 5 seconds with real-time platform metrics</p>
        </div>
      </div>
    </div>
  );
}
