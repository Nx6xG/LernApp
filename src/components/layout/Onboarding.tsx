'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sparkles,
  Layers,
  HelpCircle,
  BookOpen,
  Users,
  ArrowRight,
  Check,
  Target,
  Search,
  X,
} from 'lucide-react';

interface Step {
  icon: typeof Sparkles;
  color: string;
  title: string;
  description: string;
  details: string[];
  route: string;
  cta: string;
}

const steps: Step[] = [
  {
    icon: Sparkles,
    color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600',
    title: 'Willkommen bei LernApp!',
    description: 'Dein persönlicher Lernbegleiter. Lass uns eine kurze Tour machen!',
    details: [
      'Erstelle Arbeitsbereiche für verschiedene Fächer',
      'Lade Freunde ein, um gemeinsam zu lernen',
      'Nutze KI um Lerninhalte automatisch zu generieren',
    ],
    route: '/dashboard',
    cta: 'Tour starten',
  },
  {
    icon: Layers,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    title: 'Karteikarten',
    description: 'Erstelle Stapel und lerne mit Spaced Repetition.',
    details: [
      'Erstelle Stapel für verschiedene Themen',
      'Bewerte dein Wissen: Nochmal, Schwer, Gut, Einfach',
      'Leertaste = Umdrehen, 1-4 = Bewerten',
    ],
    route: '/karteikarten',
    cta: 'Karteikarten öffnen',
  },
  {
    icon: HelpCircle,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    title: 'Quizze',
    description: 'Teste dein Wissen mit verschiedenen Fragetypen.',
    details: [
      'Multiple Choice, Wahr/Falsch, Freitext',
      'KI kann Quizfragen automatisch generieren',
      'Erklärungen nach jeder Antwort',
    ],
    route: '/quiz',
    cta: 'Quiz öffnen',
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
    route: '/theorie',
    cta: 'Theorie öffnen',
  },
  {
    icon: Target,
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600',
    title: 'Lernziele & Fortschritt',
    description: 'Setze dir Ziele und verfolge deinen Fortschritt mit Charts.',
    details: [
      'Meilensteine für jedes Ziel',
      'Tages- und Wochen-Statistiken',
      'Streak-Tracking für tägliches Lernen',
    ],
    route: '/fortschritt',
    cta: 'Fortschritt öffnen',
  },
  {
    icon: Users,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    title: 'Zusammenarbeit',
    description: 'Lerne nicht alleine — arbeite in Echtzeit mit anderen.',
    details: [
      'Arbeitsbereiche mit E-Mail-Einladungen',
      'Alle Mitglieder sehen die gleichen Inhalte',
      'Echtzeit-Lernsessions',
    ],
    route: '/zusammenarbeit',
    cta: 'Zusammenarbeit öffnen',
  },
  {
    icon: Search,
    color: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300',
    title: 'Tipp: Schnellsuche',
    description: 'Drücke Ctrl+K um jederzeit nach Inhalten zu suchen.',
    details: [
      'Durchsucht Stapel, Quizze, Notizen und Ziele',
      'Funktioniert von jeder Seite aus',
      'Probier es aus!',
    ],
    route: '/dashboard',
    cta: 'Tour abschließen',
  },
];

interface Props {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [waitingForRoute, setWaitingForRoute] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  // When waiting for route change, advance once we arrive
  useEffect(() => {
    if (waitingForRoute && pathname === current.route) {
      setWaitingForRoute(false);
    }
  }, [pathname, waitingForRoute, current.route]);

  const handleNext = () => {
    if (isLast) {
      onComplete();
      router.push('/dashboard');
      return;
    }

    const nextStep = steps[step + 1];
    // Navigate to the next step's route
    if (pathname !== nextStep.route) {
      router.push(nextStep.route);
      setWaitingForRoute(true);
    }
    setStep(step + 1);
  };

  const handleCTA = () => {
    // Navigate to current step's route if not already there
    if (pathname !== current.route) {
      router.push(current.route);
      setWaitingForRoute(true);
    }
    // For the first step ("Tour starten") and last step, advance
    if (step === 0 || isLast) {
      handleNext();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
      <div className="card shadow-2xl border-primary-200 dark:border-primary-800 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-neutral-100 dark:bg-neutral-700">
          <div
            className="h-1 bg-primary-600 transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-11 h-11 rounded-xl ${current.color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">
                    Schritt {step + 1} von {steps.length}
                  </p>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    {current.title}
                  </h3>
                </div>
                <button
                  onClick={onComplete}
                  className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 flex-shrink-0"
                  title="Tour beenden"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-sm text-neutral-500 mt-1">{current.description}</p>

              {/* Details */}
              <div className="mt-3 space-y-1.5">
                {current.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">{detail}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4">
                {step === 0 ? (
                  <button onClick={handleCTA} className="btn-primary text-sm py-1.5 flex items-center gap-2">
                    {current.cta}
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <>
                    {pathname !== current.route && (
                      <button onClick={handleCTA} className="btn-primary text-sm py-1.5 flex items-center gap-2">
                        {current.cta}
                        <ArrowRight size={14} />
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className={`${pathname === current.route ? 'btn-primary' : 'btn-secondary'} text-sm py-1.5 flex items-center gap-2`}
                    >
                      {isLast ? 'Fertig!' : 'Weiter'}
                      <ArrowRight size={14} />
                    </button>
                  </>
                )}
                <span className="text-xs text-neutral-400">
                  oder <button onClick={onComplete} className="underline hover:text-neutral-600">überspringen</button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
