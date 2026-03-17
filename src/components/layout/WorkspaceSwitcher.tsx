'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Check, Bell } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import type { Workspace } from '@/types';

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, currentWorkspaceId, invites, setCurrentWorkspace, createWorkspace } =
    useWorkspaceStore();
  const clearAll = useAppStore((s) => s.clearAll);
  const uid = useAuthStore((s) => s.user?.uid);
  const profile = useAuthStore((s) => s.profile);

  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const switchWorkspace = (id: string) => {
    if (id === currentWorkspaceId) {
      setOpen(false);
      return;
    }
    clearAll();
    setCurrentWorkspace(id);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!uid || !profile || !newName.trim()) return;
    const now = new Date().toISOString();
    const colors = ['#40c057', '#fab005', '#fa5252', '#7950f2', '#15aabf', '#e64980', '#fd7e14', '#4c6ef5'];
    const color = colors[workspaces.length % colors.length];

    const id = await createWorkspace({
      name: newName.trim(),
      description: '',
      color,
      icon: 'folder',
      ownerId: uid,
      members: [{
        userId: uid,
        role: 'owner',
        displayName: profile.displayName,
        email: profile.email,
        joinedAt: now,
      }],
      memberIds: [uid],
      createdAt: now,
      updatedAt: now,
    });

    setNewName('');
    setShowCreate(false);
    switchWorkspace(id);
  };

  return (
    <div className="relative">
      {/* Current workspace button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: currentWorkspace?.color || '#4c6ef5' }}
        >
          {currentWorkspace?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
            {currentWorkspace?.name || 'Arbeitsbereich'}
          </p>
          <p className="text-xs text-neutral-500 truncate">
            {currentWorkspace?.members.length || 0} Mitglied{(currentWorkspace?.members.length || 0) !== 1 ? 'er' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {invites.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {invites.length}
            </span>
          )}
          <ChevronDown size={16} className={`text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-50 card p-2 shadow-lg max-h-80 overflow-y-auto">
            {/* Workspace list */}
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: ws.color }}
                >
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {ws.name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {ws.members.length} Mitglied{ws.members.length !== 1 ? 'er' : ''}
                  </p>
                </div>
                {ws.id === currentWorkspaceId && (
                  <Check size={16} className="text-primary-600 flex-shrink-0" />
                )}
              </button>
            ))}

            {/* Pending invites */}
            {invites.length > 0 && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2">
                <p className="px-3 py-1 text-xs font-medium text-neutral-400 uppercase">Einladungen</p>
                {invites.map((inv) => (
                  <div key={inv.id} className="px-3 py-2 flex items-center gap-2">
                    <Bell size={14} className="text-orange-500 flex-shrink-0" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate flex-1">
                      {inv.workspaceName}
                    </span>
                    <span className="text-xs text-neutral-400">von {inv.invitedByName}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Create new */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2">
              {showCreate ? (
                <div className="px-2 py-1 space-y-2">
                  <input
                    className="input text-sm py-1.5"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="z.B. LAP, Matura, Mathe..."
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCreate} className="btn-primary text-xs py-1 px-3">
                      Erstellen
                    </button>
                    <button onClick={() => setShowCreate(false)} className="text-xs text-neutral-500">
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                >
                  <Plus size={16} />
                  Neuer Arbeitsbereich
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
