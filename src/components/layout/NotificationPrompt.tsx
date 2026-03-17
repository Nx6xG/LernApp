'use client';

import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, XCircle } from 'lucide-react';
import {
  isNotificationSupported,
  getPermissionStatus,
  requestPermission,
  startDueCardReminder,
} from '@/lib/notifications';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { getDueFlashcards } from '@/lib/firestore';

export function NotificationPrompt() {
  const { workspaceId } = useWorkspaceContext();
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const status = getPermissionStatus();
    if (status === 'granted') {
      setEnabled(true);
    } else if (status === 'denied') {
      // Browser has permanently blocked — nothing we can do
    } else if (status === 'default') {
      const dismissed = localStorage.getItem('lernapp_notif_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShow(true), 10000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Start reminder if enabled
  useEffect(() => {
    if (!enabled || !workspaceId) return;
    const cleanup = startDueCardReminder(
      () => getDueFlashcards(workspaceId).then((cards) => cards.length),
      30
    );
    return cleanup;
  }, [enabled, workspaceId]);

  const handleEnable = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        setEnabled(true);
        setShow(false);
        localStorage.setItem('lernapp_notif_dismissed', 'true');
      } else {
        // Browser denied or user clicked "Block"
        setDenied(true);
        setTimeout(() => {
          setShow(false);
          localStorage.setItem('lernapp_notif_dismissed', 'true');
        }, 3000);
      }
    } catch {
      setDenied(true);
      setTimeout(() => {
        setShow(false);
        localStorage.setItem('lernapp_notif_dismissed', 'true');
      }, 3000);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('lernapp_notif_dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-40 max-w-sm animate-slide-in">
      <div className="card p-4 shadow-lg border-primary-200 dark:border-primary-800">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <Bell size={18} className="text-primary-600" />
          </div>
          <div className="flex-1">
            {denied ? (
              <>
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-500" />
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Benachrichtigungen blockiert
                  </h4>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Dein Browser hat Benachrichtigungen blockiert. Du kannst das in den Browser-Einstellungen unter Website-Berechtigungen ändern.
                </p>
              </>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Erinnerungen aktivieren?
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Wir erinnern dich, wenn Karteikarten zur Wiederholung fällig sind.
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleEnable} className="btn-primary text-xs py-1.5 px-3">
                    Aktivieren
                  </button>
                  <button onClick={handleDismiss} className="btn-secondary text-xs py-1.5 px-3">
                    Später
                  </button>
                </div>
              </>
            )}
          </div>
          <button onClick={handleDismiss} className="text-neutral-400 hover:text-neutral-600">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
