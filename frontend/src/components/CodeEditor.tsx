import { useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useEditorStore } from '@/store/editorStore';
import { Loader2 } from 'lucide-react';

export function CodeEditor() {
  const { code, setCode, language, theme } = useEditorStore();
  const editorRef = useRef<any>(null);

  const getMonacoLanguage = (langId: string): string => {
    const map: Record<string, string> = {
      python: 'python',
      javascript: 'javascript',
      typescript: 'typescript',
      cpp: 'cpp',
      c: 'c',
      java: 'java',
      rust: 'rust',
      go: 'go',
      ruby: 'ruby',
      php: 'php',
    };
    return map[langId] || 'plaintext';
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, monospace',
      lineNumbers: 'on',
      rulers: [80, 120],
      renderWhitespace: 'selection',
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });
  };

  return (
    <div className="flex-1 relative">
      <Editor
        height="100%"
        language={language ? getMonacoLanguage(language.id) : 'plaintext'}
        value={code}
        onChange={(value) => setCode(value || '')}
        theme={theme}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
        options={{
          fontLigatures: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
        }}
      />
    </div>
  );
}