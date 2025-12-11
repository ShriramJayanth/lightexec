import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { ChevronDown, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
  const { language, languages, setLanguage } = useEditorStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: typeof language) => {
    if (lang) {
      setLanguage(lang);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-accent rounded-lg transition-colors border border-border"
      >
        <Code2 className="w-4 h-4" />
        <span className="text-sm font-medium">
          {language ? `${language.name} ${language.version}` : 'Select Language'}
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-xl z-50 max-h-96 overflow-auto">
          <div className="p-2">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleSelect(lang)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded hover:bg-accent transition-colors text-left',
                  language?.id === lang.id && 'bg-primary text-primary-foreground'
                )}
              >
                <div>
                  <div className="font-medium text-sm">{lang.name}</div>
                  <div className="text-xs text-muted-foreground">{lang.version}</div>
                </div>
                {lang.supportsCompilation && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                    Compiled
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}