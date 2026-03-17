'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Layers, Sparkles, X, Loader2 } from 'lucide-react';

interface Props {
  onAddFlashcard: (front: string, back: string) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function SelectionContextMenu({ onAddFlashcard, containerRef }: Props) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [mode, setMode] = useState<'menu' | 'form'>('menu');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || text.length < 3) return;

    // Only handle if selection is within our container
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) return;

    e.preventDefault();
    setSelectedText(text);
    setPosition({ x: e.clientX, y: e.clientY });
    setMode('menu');
    setShow(true);
  }, [containerRef]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    if (show) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [show]);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [handleContextMenu]);

  const handleAddAsFlashcard = () => {
    setFront(selectedText);
    setBack('');
    setMode('form');
  };

  const handleSubmit = () => {
    if (front.trim() && back.trim()) {
      onAddFlashcard(front.trim(), back.trim());
      setShow(false);
    }
  };

  if (!show) return null;

  // Keep menu within viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - (mode === 'form' ? 280 : 120)),
    zIndex: 60,
  };

  return (
    <div ref={menuRef} style={menuStyle} className="w-72">
      <div className="card shadow-2xl overflow-hidden">
        {mode === 'menu' ? (
          <div className="p-1">
            <button
              onClick={handleAddAsFlashcard}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-left transition-colors"
            >
              <Layers size={16} className="text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Als Karteikarte</p>
                <p className="text-xs text-neutral-500 truncate max-w-[200px]">
                  &quot;{selectedText.slice(0, 40)}{selectedText.length > 40 ? '...' : ''}&quot;
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-primary-600" />
                Karteikarte erstellen
              </h4>
              <button onClick={() => setShow(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={14} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Vorderseite (Frage)</label>
              <textarea
                className="input text-sm py-1.5 min-h-[60px]"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Frage..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Rückseite (Antwort)</label>
              <textarea
                className="input text-sm py-1.5 min-h-[60px]"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Antwort..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} className="btn-primary text-xs py-1.5 flex-1" disabled={!front.trim() || !back.trim()}>
                Erstellen
              </button>
              <button onClick={() => setShow(false)} className="btn-secondary text-xs py-1.5">
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
