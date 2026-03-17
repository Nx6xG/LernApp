'use client';

import { useState } from 'react';
import { Sparkles, Layers, HelpCircle, BookOpen, Users, ArrowRight, Check } from 'lucide-react';

const steps = [
  {
    icon: Sparkles,
    color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600',
    title: 'Willkommen bei LernApp!',
    description: 'Dein persönlicher Lernbegleiter mit bewährten Lernmethoden.',
    details: [
      'Erstelle Arbeitsbereiche für verschiedene Fächer',
      'Lade Freunde ein, um gemeinsam zu lernen',
      'Nutze KI um Lerninhalte automatisch zu generieren',
    ],
  },
  {
    icon: Layers,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    title: 'Karteikarten mit Spaced Repetition',
    description: 'Der SM-2 Algorithmus zeigt dir Karten genau dann, wenn du sie wiederholen solltest.',
    details: [
      'Erstelle Stapel für verschiedene Themen',
      'Bewerte dein Wissen: Nochmal, Schwer, Gut, Einfach',
      'Tastenkürzel: Leertaste = Umdrehen, 1-4 = Bewerten',
    ],
  },
  {
    icon: HelpCircle,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    title: 'Quizze & Active Recall',
    description: 'Teste dein Wissen mit verschiedenen Fragetypen.',
    details: [
      'Multiple Choice, Wahr/Falsch, Freitext',
      'KI kann Quizfragen automatisch generieren',
      'Erklärungen zu jeder Antwort',
    ],
  },
  {
    icon: BookOpen,
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    title: 'Theorie-Notizen',
    description: 'Ein Notion-artiger Editor für deine Lernunterlagen.',
    details: [
      'Überschriften, Tabellen, Listen, Code-Blöcke',
      'Tags zum Organisieren (z.B. Netzwerktechnik, Mathe)',
      'Tippe / für das Block-Menü',
    ],
  },
  {
    icon: Users,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    title: 'Zusammenarbeit',
    description: 'Lerne nicht alleine — arbeite in Echtzeit mit anderen.',
    details: [
      'Erstelle Arbeitsbereiche und lade Leute per E-Mail ein',
      'Alle Mitglieder sehen die gleichen Inhalte',
      'Echtzeit-Lernsessions',
    ],
  },
];

interface Props {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg overflow-hidden">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-primary-600' : i < step ? 'bg-primary-300' : 'bg-neutral-200 dark:bg-neutral-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className={`w-16 h-16 rounded-2xl ${current.color} flex items-center justify-center mx-auto mb-6`}>
            <Icon size={32} />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            {current.title}
          </h2>
          <p className="text-neutral-500 mb-6">{current.description}</p>

          <div className="text-left space-y-3 mb-8">
            {current.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={onComplete}
            className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Überspringen
          </button>
          <button
            onClick={() => {
              if (isLast) onComplete();
              else setStep(step + 1);
            }}
            className="btn-primary flex items-center gap-2"
          >
            {isLast ? 'Loslegen!' : 'Weiter'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
