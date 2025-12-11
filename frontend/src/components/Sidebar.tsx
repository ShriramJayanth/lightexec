import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import {
  FileCode2,
  BookOpen,
  Github,
  FileText,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const codeExamples: Record<string, string> = {
  python: `# Python Hello World\nprint("Hello from LightExec!")\n\n# Calculate factorial\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(f"Factorial of 5: {factorial(5)}")`,
  javascript: `// JavaScript Hello World\nconsole.log("Hello from LightExec!");\n\n// Calculate fibonacci\nfunction fibonacci(n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(\`Fibonacci of 10: \${fibonacci(10)}\`);`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from LightExec!" << endl;\n    \n    // Calculate sum\n    int sum = 0;\n    for (int i = 1; i <= 10; i++) {\n        sum += i;\n    }\n    \n    cout << "Sum of 1-10: " << sum << endl;\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from LightExec!");\n        \n        // Calculate sum\n        int sum = 0;\n        for (int i = 1; i <= 10; i++) {\n            sum += i;\n        }\n        \n        System.out.println("Sum of 1-10: " + sum);\n    }\n}`,
};

export function Sidebar({ isOpen }: SidebarProps) {
  const { setCode, language } = useEditorStore();

  const loadExample = (langId: string) => {
    const example = codeExamples[langId];
    if (example) {
      setCode(example);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => {}}
        />
      )}

      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out overflow-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 space-y-6">
          {/* Quick Start */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-primary" />
              Quick Start
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm bg-secondary hover:bg-accent rounded-lg transition-colors">
                New File
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-secondary hover:bg-accent rounded-lg transition-colors">
                Upload Code
              </button>
            </div>
          </div>

          {/* Code Examples */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Examples
            </h3>
            <div className="space-y-2">
              {Object.keys(codeExamples).map((langId) => (
                <button
                  key={langId}
                  onClick={() => loadExample(langId)}
                  className="w-full text-left px-3 py-2 text-sm bg-secondary hover:bg-accent rounded-lg transition-colors capitalize"
                >
                  {langId} Example
                </button>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Resources
            </h3>
            <div className="space-y-2">
              <a
                href="#"
                className="block px-3 py-2 text-sm bg-secondary hover:bg-accent rounded-lg transition-colors"
              >
                Documentation
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-sm bg-secondary hover:bg-accent rounded-lg transition-colors"
              >
                API Reference
              </a>
              <a
                href="#"
                className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary hover:bg-accent rounded-lg transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub Repo
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2">✨ Features</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• 15+ Programming Languages</li>
              <li>• Sub-100ms Initialization</li>
              <li>• 10,000+ Concurrent Users</li>
              <li>• Multi-layer Security</li>
              <li>• Real-time Execution</li>
              <li>• Container Isolation</li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
