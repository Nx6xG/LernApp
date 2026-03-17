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
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(getAIConfig());
  }, []);

  const handleSave = () => {
    saveAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProviderChange = (provider: AIProvider) => {
    setConfig({
      provider,
      apiKey: provider === 'server' ? '' : config.apiKey,
      model: provider === 'server' ? '' : getDefaultModel(provider),
    });
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
        <Sparkles size={20} className="text-primary-600" />
        KI-Einstellungen
      </h2>

      <p className="text-sm text-neutral-500">
        Wähle welche KI für die Generierung von Karteikarten, Quizfragen und Zusammenfassungen verwendet wird.
      </p>

      {/* Provider selection */}
      <div>
        <label className="label">Anbieter</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {([
            { id: 'server' as AIProvider, name: 'Server-Standard', desc: 'Nutzt den vom Betreiber konfigurierten Key' },
            { id: 'anthropic' as AIProvider, name: 'Anthropic (Claude)', desc: 'Eigener API-Key für Claude' },
            { id: 'openai' as AIProvider, name: 'OpenAI (GPT)', desc: 'Eigener API-Key für GPT' },
          ]).map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderChange(p.id)}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                config.provider === p.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
              }`}
            >
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{p.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* API Key input */}
      {config.provider !== 'server' && (
        <>
          <div>
            <label className="label flex items-center gap-2">
              <Key size={14} />
              API-Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                className="input pr-10 font-mono text-sm"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder={config.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Dein Key wird nur lokal im Browser gespeichert, nicht auf dem Server.
            </p>
          </div>

          <div>
            <label className="label">Modell</label>
            <input
              className="input text-sm"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder={getDefaultModel(config.provider)}
            />
            <p className="text-xs text-neutral-400 mt-1">
              {config.provider === 'anthropic'
                ? 'z.B. claude-sonnet-4-20250514, claude-haiku-4-5-20251001'
                : 'z.B. gpt-4o-mini, gpt-4o, gpt-4-turbo'}
            </p>
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={16} />
          Speichern
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <Check size={14} />
            Gespeichert!
          </span>
        )}
      </div>
    </div>
  );
}
