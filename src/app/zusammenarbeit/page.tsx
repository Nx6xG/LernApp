'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { ref, push, onValue, set, update, off } from 'firebase/database';
import { getFirebaseRtdb } from '@/lib/firebase';
import type { CollaborationSession, Participant } from '@/types';
import { Users, Plus, Play, Copy, Check, LogOut, Crown } from 'lucide-react';

export default function ZusammenarbeitPage() {
  const { uid, profile, workspaceId } = useWorkspaceContext();
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!uid || !workspaceId) return;
    const sessionsRef = ref(getFirebaseRtdb(), `sessions/${workspaceId}`);
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val,
          participants: val.participants ? Object.values(val.participants) : [],
        })) as CollaborationSession[];
        setSessions(list.filter((s) => s.status !== 'completed'));
      }
    });
    return () => off(sessionsRef);
  }, [uid]);

  // Listen to current session changes
  useEffect(() => {
    if (!currentSession?.id) return;
    const sessionRef = ref(getFirebaseRtdb(), `sessions/${workspaceId}/${currentSession.id}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentSession({
          ...data,
          id: currentSession.id,
          participants: data.participants ? Object.values(data.participants) : [],
        });
      }
    });
    return () => off(sessionRef);
  }, [currentSession?.id]);

  const handleCreate = async () => {
    if (!uid || !profile || !newTitle.trim()) return;
    const sessionRef = push(ref(getFirebaseRtdb(), `sessions/${workspaceId}`));
    const session: Omit<CollaborationSession, 'id'> = {
      workspaceId,
      hostId: uid,
      hostName: profile.displayName,
      title: newTitle,
      type: 'flashcard',
      resourceId: '',
      participants: [
        {
          userId: uid,
          displayName: profile.displayName,
          isReady: true,
          joinedAt: new Date().toISOString(),
        },
      ],
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };
    await set(sessionRef, session);
    setCurrentSession({ ...session, id: sessionRef.key! });
    setNewTitle('');
    setShowNew(false);
  };

  const handleJoin = async (sessionId: string) => {
    if (!uid || !profile) return;
    const participant: Participant = {
      userId: uid,
      displayName: profile.displayName,
      isReady: false,
      joinedAt: new Date().toISOString(),
    };
    await update(ref(getFirebaseRtdb(), `sessions/${workspaceId}/${sessionId}/participants/${uid}`), participant);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) setCurrentSession(session);
  };

  const handleLeave = async () => {
    if (!currentSession || !uid) return;
    await set(ref(getFirebaseRtdb(), `sessions/${workspaceId}/${currentSession.id}/participants/${uid}`), null);
    if (currentSession.hostId === uid) {
      await update(ref(getFirebaseRtdb(), `sessions/${workspaceId}/${currentSession.id}`), { status: 'completed' });
    }
    setCurrentSession(null);
  };

  const copySessionId = () => {
    if (currentSession) {
      navigator.clipboard.writeText(currentSession.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinByCode = async () => {
    if (joinCode.trim()) {
      await handleJoin(joinCode.trim());
      setJoinCode('');
    }
  };

  // Active session view
  if (currentSession) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {currentSession.title}
            </h1>
            <p className="text-neutral-500 mt-1">
              Erstellt von {currentSession.hostName}
            </p>
          </div>
          <button onClick={handleLeave} className="btn-danger flex items-center gap-2">
            <LogOut size={16} />
            Verlassen
          </button>
        </div>

        {/* Session code */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Session-Code</p>
            <p className="font-mono text-sm text-neutral-900 dark:text-white">{currentSession.id}</p>
          </div>
          <button onClick={copySessionId} className="btn-secondary flex items-center gap-2 text-sm">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Kopiert!' : 'Kopieren'}
          </button>
        </div>

        {/* Participants */}
        <div className="card p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Teilnehmer ({currentSession.participants.length})
          </h3>
          <div className="space-y-3">
            {currentSession.participants.map((p) => (
              <div key={p.userId} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                  {p.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-neutral-900 dark:text-white font-medium">{p.displayName}</span>
                {p.userId === currentSession.hostId && (
                  <Crown size={14} className="text-yellow-500" />
                )}
                <span
                  className={`ml-auto badge ${
                    p.isReady
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700'
                  }`}
                >
                  {p.isReady ? 'Bereit' : 'Wartet'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-neutral-500 text-sm">
          Teile den Session-Code mit deinen Freunden, damit sie beitreten können.
        </div>
      </div>
    );
  }

  // Session list
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Zusammenarbeit</h1>
          <p className="text-neutral-500 mt-1">Lerne gemeinsam mit anderen in Echtzeit</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Neue Session
        </button>
      </div>

      {/* Join by code */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <input
          className="input flex-1"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Session-Code eingeben..."
          onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
        />
        <button onClick={handleJoinByCode} className="btn-primary" disabled={!joinCode.trim()}>
          Beitreten
        </button>
      </div>

      {showNew && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Neue Lernsession</h3>
          <div>
            <label className="label">Titel</label>
            <input
              className="input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Mathe-Lerngruppe"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary">Erstellen</button>
            <button onClick={() => setShowNew(false)} className="btn-secondary">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Active sessions */}
      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">{session.title}</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Von {session.hostName} &middot; {session.participants.length} Teilnehmer
                </p>
              </div>
              <button
                onClick={() => handleJoin(session.id)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Play size={14} />
                Beitreten
              </button>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && !showNew && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
            Keine aktiven Sessions
          </h3>
          <p className="text-neutral-500 mb-4">
            Erstelle eine Session oder tritt einer bei!
          </p>
        </div>
      )}
    </div>
  );
}
