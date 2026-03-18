'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { updateUserProfile } from '@/lib/firestore';
import { getFirebaseAuth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import {
  User,
  Mail,
  MapPin,
  Globe,
  Clock,
  Flame,
  Calendar,
  Camera,
  Save,
  Edit2,
  BookOpen,
  Sparkles,
  Key,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getAIConfig, saveAIConfig, getDefaultModel, type AIProvider, type AIConfig } from '@/lib/ai-config';

export default function ProfilPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const [editing, setEditing] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [dailyGoal, setDailyGoal] = useState(30);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const startEdit = () => {
    setDisplayName(profile?.displayName || '');
    setBio(profile?.bio || '');
    setLocation(profile?.location || '');
    setWebsite(profile?.website || '');
    setDailyGoal(profile?.dailyGoalMinutes || 30);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      // Update Firebase Auth display name
      await updateProfile(getFirebaseAuth().currentUser!, { displayName: displayName.trim() });

      // Update Firestore profile
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        dailyGoalMinutes: dailyGoal,
      });

      // Update local store
      useAuthStore.setState({
        profile: profile
          ? {
              ...profile,
              displayName: displayName.trim(),
              bio: bio.trim(),
              location: location.trim(),
              website: website.trim(),
              dailyGoalMinutes: dailyGoal,
            }
          : null,
      });

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalHours = Math.floor(profile.totalStudyMinutes / 60);
  const totalMins = profile.totalStudyMinutes % 60;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Profil</h1>
        {!editing && (
          <button onClick={startEdit} className="btn-secondary flex items-center gap-2">
            <Edit2 size={16} />
            Bearbeiten
          </button>
        )}
      </div>

      {saved && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg">
          Profil gespeichert!
        </div>
      )}

      {/* Profile Card */}
      <div className="card p-8">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl font-bold text-primary-700 dark:text-primary-300">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                displayName?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dein Name"
                  />
                </div>
                <div>
                  <label className="label">Über mich</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Erzähl etwas über dich..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Standort</label>
                    <input
                      className="input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="z.B. Wien, Österreich"
                    />
                  </div>
                  <div>
                    <label className="label">Website</label>
                    <input
                      className="input"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Tägliches Lernziel (Minuten)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="180"
                      step="5"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value))}
                      className="flex-1 accent-primary-600"
                    />
                    <span className="text-sm font-medium text-neutral-900 dark:text-white w-16 text-right">
                      {dailyGoal} Min.
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    className="btn-primary flex items-center gap-2"
                    disabled={saving || !displayName.trim()}
                  >
                    <Save size={16} />
                    {saving ? 'Speichern...' : 'Speichern'}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {profile.displayName}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">{profile.email}</p>

                {profile.bio && (
                  <p className="text-neutral-700 dark:text-neutral-300 mt-3">{profile.bio}</p>
                )}

                <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-neutral-500">
                  {profile.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {profile.location}
                    </span>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700"
                    >
                      <Globe size={14} />
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Dabei seit {memberSince}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {!editing && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 text-center">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Gesamt gelernt</p>
          </div>

          <div className="card p-5 text-center">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
              <Flame size={20} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{profile.streak}</p>
            <p className="text-xs text-neutral-500 mt-1">Tage Streak</p>
          </div>

          <div className="card p-5 text-center">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{dailyGoal}</p>
            <p className="text-xs text-neutral-500 mt-1">Min./Tag Ziel</p>
          </div>
        </div>
      )}

      {/* AI Settings */}
      <AISettings />
    </div>
  );
}

// ==================== AI Settings Component ====================

function AISettings() {
  const [config, setConfig] = useState<AIConfig>({ provider: 'server', apiKey: '', model: '' });
  const [showSetup, setShowSetup] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testError, setTestError] = useState('');

  useEffect(() => {
    const stored = getAIConfig();
    setConfig(stored);
  }, []);

  const isConnected = config.provider !== 'server' && config.apiKey.length > 5;

  const handleSave = (newConfig: AIConfig) => {
    saveAIConfig(newConfig);
    setConfig(newConfig);
    setShowSetup(false);
  };

  const handleDisconnect = () => {
    const reset: AIConfig = { provider: 'server', apiKey: '', model: '' };
    saveAIConfig(reset);
    setConfig(reset);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'flashcards',
          topic: 'Test',
          count: 1,
          difficulty: 'easy',
          language: 'de',
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Fehler ${res.status}`);
      }
      setTestResult('success');
    } catch (err: any) {
      setTestResult('error');
      setTestError(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
        <Sparkles size={20} className="text-primary-600" />
        KI-Verbindung
      </h2>

      {/* Connected state */}
      {isConnected && !showSetup ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Check size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-300">
                {config.provider === 'anthropic' ? 'Claude (Anthropic)' : 'GPT (OpenAI)'} verbunden
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Modell: {config.model || getDefaultModel(config.provider)} &middot; Key: ...{config.apiKey.slice(-4)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleTest} className="btn-secondary text-sm flex items-center gap-2" disabled={testing}>
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {testing ? 'Teste...' : 'Verbindung testen'}
            </button>
            <button onClick={() => setShowSetup(true)} className="btn-secondary text-sm">
              Ändern
            </button>
            <button onClick={handleDisconnect} className="text-sm text-red-500 hover:text-red-600 px-3">
              Trennen
            </button>
          </div>

          {testResult === 'success' && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check size={14} /> Verbindung funktioniert!
            </p>
          )}
          {testResult === 'error' && (
            <p className="text-sm text-red-600 dark:text-red-400">{testError}</p>
          )}
        </div>
      ) : !showSetup ? (
        /* Not connected state */
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Verbinde deine eigene KI um Karteikarten, Quizfragen und Zusammenfassungen automatisch generieren zu lassen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => { setConfig({ ...config, provider: 'openai' }); setShowSetup(true); }}
              className="p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 text-left transition-colors group"
            >
              <p className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600">OpenAI (GPT)</p>
              <p className="text-xs text-neutral-500 mt-1">GPT-4o, GPT-4o-mini, etc.</p>
            </button>
            <button
              onClick={() => { setConfig({ ...config, provider: 'anthropic' }); setShowSetup(true); }}
              className="p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 text-left transition-colors group"
            >
              <p className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600">Anthropic (Claude)</p>
              <p className="text-xs text-neutral-500 mt-1">Claude Sonnet, Claude Haiku, etc.</p>
            </button>
          </div>
        </div>
      ) : (
        /* Setup flow */
        <SetupFlow
          provider={config.provider === 'server' ? 'openai' : config.provider}
          initialKey={config.apiKey}
          initialModel={config.model}
          onSave={handleSave}
          onCancel={() => setShowSetup(false)}
        />
      )}
    </div>
  );
}

// ==================== Setup Flow ====================

function SetupFlow({
  provider,
  initialKey,
  initialModel,
  onSave,
  onCancel,
}: {
  provider: AIProvider;
  initialKey: string;
  initialModel: string;
  onSave: (config: AIConfig) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(initialKey ? 2 : 1);
  const [apiKey, setApiKey] = useState(initialKey);
  const [model, setModel] = useState(initialModel || getDefaultModel(provider));
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState(false);
  const [testError, setTestError] = useState('');

  const isAnthropic = provider === 'anthropic';
  const providerName = isAnthropic ? 'Anthropic' : 'OpenAI';

  const handleTest = async () => {
    setTesting(true);
    setTestOk(false);
    setTestError('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'flashcards', topic: 'Test', count: 1,
          difficulty: 'easy', language: 'de',
          provider, apiKey, model,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Fehler ${res.status}`);
      }
      setTestOk(true);
      setStep(3);
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              s < step ? 'bg-green-500 text-white'
              : s === step ? 'bg-primary-600 text-white'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
            }`}>
              {s < step ? <Check size={14} /> : s}
            </div>
            {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-700'}`} />}
          </div>
        ))}
        <span className="text-xs text-neutral-400 ml-2">
          {step === 1 ? 'Key erstellen' : step === 2 ? 'Key eingeben' : 'Fertig!'}
        </span>
      </div>

      {/* Step 1: Instructions */}
      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {providerName} API-Key erstellen
          </h3>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {isAnthropic ? 'Gehe zu console.anthropic.com' : 'Gehe zu platform.openai.com'}
                </p>
                <a
                  href={isAnthropic ? 'https://console.anthropic.com/settings/keys' : 'https://platform.openai.com/api-keys'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:text-primary-700 underline"
                >
                  {isAnthropic ? 'console.anthropic.com/settings/keys' : 'platform.openai.com/api-keys'} &rarr;
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {isAnthropic
                  ? 'Erstelle einen Account (falls nötig) und klicke auf "Create Key"'
                  : 'Melde dich an und klicke auf "Create new secret key"'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                Kopiere den Key — er beginnt mit {isAnthropic ? '"sk-ant-"' : '"sk-"'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-primary text-sm">
              Key habe ich, weiter
            </button>
            <button onClick={onCancel} className="btn-secondary text-sm">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Enter key */}
      {step === 2 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {providerName} API-Key eingeben
          </h3>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              className="input pr-10 font-mono text-sm"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestError(''); }}
              placeholder={isAnthropic ? 'sk-ant-api03-...' : 'sk-proj-...'}
              autoFocus
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-neutral-400">
            Dein Key bleibt nur in deinem Browser gespeichert.
          </p>

          {testError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
              {testError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleTest}
              className="btn-primary text-sm flex items-center gap-2"
              disabled={testing || apiKey.length < 5}
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {testing ? 'Teste Verbindung...' : 'Verbinden & Testen'}
            </button>
            <button onClick={() => setStep(1)} className="btn-secondary text-sm">
              Zurück
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <Check size={20} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-300">Verbindung erfolgreich!</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {providerName} ist bereit. Du kannst jetzt KI-Features nutzen.
              </p>
            </div>
          </div>

          <div>
            <label className="label">Modell (optional)</label>
            <select
              className="input text-sm"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {isAnthropic ? (
                <>
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (empfohlen)</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (schneller, günstiger)</option>
                </>
              ) : (
                <>
                  <option value="gpt-4o-mini">GPT-4o Mini (empfohlen, günstig)</option>
                  <option value="gpt-4o">GPT-4o (besser, teurer)</option>
                </>
              )}
            </select>
          </div>

          <button
            onClick={() => onSave({ provider, apiKey, model })}
            className="btn-primary text-sm w-full"
          >
            Fertig — KI aktivieren
          </button>
        </div>
      )}
    </div>
  );
}
