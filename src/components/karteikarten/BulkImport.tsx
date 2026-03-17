'use client';

import { useState } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface Props {
  onImport: (cards: Array<{ front: string; back: string }>) => void;
  onClose: () => void;
}

export function BulkImport({ onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState(';');
  const [error, setError] = useState('');

  const parseCards = () => {
    const lines = text.trim().split('\n').filter((l) => l.trim());
    if (lines.length === 0) {
      setError('Bitte füge mindestens eine Zeile ein.');
      return;
    }

    const cards: Array<{ front: string; back: string }> = [];
    const errors: number[] = [];

    lines.forEach((line, i) => {
      const parts = line.split(separator).map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        cards.push({ front: parts[0], back: parts[1] });
      } else {
        errors.push(i + 1);
      }
    });

    if (cards.length === 0) {
      setError(`Keine gültigen Karten gefunden. Verwende "${separator}" als Trennzeichen zwischen Frage und Antwort.`);
      return;
    }

    if (errors.length > 0) {
      setError(`${cards.length} Karten erkannt. ${errors.length} Zeile${errors.length > 1 ? 'n' : ''} übersprungen (Zeile ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}).`);
    }

    onImport(cards);
  };

  const preview = text
    .trim()
    .split('\n')
    .filter((l) => l.trim())
    .slice(0, 5)
    .map((l) => {
      const parts = l.split(separator).map((p) => p.trim());
      return parts.length >= 2 ? { front: parts[0], back: parts[1], valid: true } : { front: l, back: '', valid: false };
    });

  const exampleText = separator === ';'
    ? 'Was ist Photosynthese?;Der Prozess bei dem Pflanzen Licht in Energie umwandeln\nWas ist Osmose?;Diffusion von Wasser durch eine semipermeable Membran\nWas ist DNA?;Desoxyribonukleinsäure, Träger der Erbinformation'
    : separator === '\t'
    ? 'Was ist Photosynthese?\tDer Prozess bei dem Pflanzen Licht in Energie umwandeln'
    : 'Was ist Photosynthese?,Der Prozess bei dem Pflanzen Licht in Energie umwandeln';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Karten importieren
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-neutral-500">
          Füge mehrere Karten auf einmal ein — eine Karte pro Zeile mit Trennzeichen zwischen Frage und Antwort.
        </p>

        {/* Separator selection */}
        <div>
          <label className="label">Trennzeichen</label>
          <div className="flex gap-2">
            {[
              { value: ';', label: 'Semikolon (;)' },
              { value: ',', label: 'Komma (,)' },
              { value: '\t', label: 'Tab' },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setSeparator(s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  separator === s.value
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text area */}
        <div>
          <label className="label">Karten (eine pro Zeile)</label>
          <textarea
            className="input min-h-[200px] font-mono text-sm"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            placeholder={exampleText}
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && text.trim() && (
          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Vorschau ({text.trim().split('\n').filter((l) => l.trim()).length} Zeilen)
            </p>
            <div className="space-y-2">
              {preview.map((p, i) => (
                <div
                  key={i}
                  className={`flex gap-3 p-2 rounded-lg text-sm ${
                    p.valid
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : 'bg-red-50 dark:bg-red-900/10'
                  }`}
                >
                  <span className="font-medium text-neutral-900 dark:text-white flex-1 truncate">
                    {p.front}
                  </span>
                  {p.valid && (
                    <>
                      <span className="text-neutral-400">→</span>
                      <span className="text-neutral-600 dark:text-neutral-400 flex-1 truncate">
                        {p.back}
                      </span>
                    </>
                  )}
                  {!p.valid && (
                    <span className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      Ungültig
                    </span>
                  )}
                </div>
              ))}
              {text.trim().split('\n').filter((l) => l.trim()).length > 5 && (
                <p className="text-xs text-neutral-400">
                  ... und {text.trim().split('\n').filter((l) => l.trim()).length - 5} weitere
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-orange-600 dark:text-orange-400">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">
            Abbrechen
          </button>
          <button
            onClick={parseCards}
            className="btn-primary flex items-center gap-2"
            disabled={!text.trim()}
          >
            <FileText size={16} />
            Importieren
          </button>
        </div>
      </div>
    </div>
  );
}
