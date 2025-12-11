import { Settings, Keyboard } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

export function ExecutionControls() {
  const { language } = useEditorStore();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-xs">
        <span className="text-muted-foreground">Timeout:</span>
        <span className="font-mono font-medium">{language?.defaultTimeout || 10000}ms</span>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-xs">
        <span className="text-muted-foreground">Memory:</span>
        <span className="font-mono font-medium">{language?.defaultMemory || 128}MB</span>
      </div>

      <button
        className="p-2 hover:bg-accent rounded-lg transition-colors"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded text-xs text-muted-foreground">
        <Keyboard className="w-3 h-3" />
        <span>Ctrl+Enter to run</span>
      </div>
    </div>
  );
}
