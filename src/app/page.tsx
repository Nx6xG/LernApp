'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { redirect } from 'next/navigation';
import { Sparkles, BookOpen, Brain, Users } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, error, signIn, signUp, clearError } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    redirect('/dashboard');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp(email, password, displayName);
    } else {
      await signIn(email, password);
    }
  };

  const features = [
    { icon: BookOpen, title: 'Karteikarten', desc: 'Spaced Repetition für optimales Lernen' },
    { icon: Brain, title: 'Active Recall', desc: 'Quiz und Rückfragen für tiefes Verständnis' },
    { icon: Users, title: 'Zusammenarbeit', desc: 'Lerne gemeinsam mit anderen in Echtzeit' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">LernApp</h1>
        </div>
        <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
          Dein persönlicher
          <br />
          <span className="text-primary-600">Lernbegleiter</span>
        </h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-12">
          Erstelle deine eigenen Lerninhalte und übe mit bewährten Methoden wie Spaced Repetition
          und Active Recall.
        </p>

        <div className="space-y-6">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <f.icon size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-neutral-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Sparkles className="text-white" size={22} />
            </div>
            <h1 className="text-2xl font-bold">LernApp</h1>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              {isSignUp ? 'Konto erstellen' : 'Willkommen zurück'}
            </h2>
            <p className="text-neutral-500 mb-6">
              {isSignUp ? 'Erstelle ein kostenloses Konto' : 'Melde dich an, um weiterzulernen'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Dein Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label className="label">E-Mail</label>
                <input
                  type="email"
                  className="input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Passwort</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                {isSignUp ? 'Registrieren' : 'Anmelden'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  clearError();
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {isSignUp ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
