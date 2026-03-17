'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  Settings,
  Users,
  Mail,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  LogOut,
  UserPlus,
  Palette,
  Check,
} from 'lucide-react';
import type { WorkspaceRole, WorkspaceMember } from '@/types';

const roleLabels: Record<WorkspaceRole, string> = {
  owner: 'Eigentümer',
  admin: 'Admin',
  member: 'Mitglied',
  viewer: 'Betrachter',
};

const roleIcons: Record<WorkspaceRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const colors = ['#4c6ef5', '#40c057', '#fab005', '#fa5252', '#7950f2', '#15aabf', '#e64980', '#fd7e14'];

export default function ArbeitsbereichPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const profile = useAuthStore((s) => s.profile);
  const {
    currentWorkspace,
    updateWorkspace,
    deleteWorkspace,
    sendInvite,
    removeMember,
    invites,
    acceptInvite,
    declineInvite,
  } = useWorkspaceStore();

  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [desc, setDesc] = useState(currentWorkspace?.description || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member');
  const [inviteSent, setInviteSent] = useState(false);

  if (!currentWorkspace) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Settings size={32} className="text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">Kein Arbeitsbereich ausgewählt.</p>
      </div>
    );
  }

  const isOwner = currentWorkspace.ownerId === uid;
  const isAdmin = currentWorkspace.members.find((m) => m.userId === uid)?.role === 'admin' || isOwner;

  const handleSaveName = async () => {
    if (name.trim()) {
      await updateWorkspace(currentWorkspace.id, {
        name: name.trim(),
        description: desc.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditName(false);
    }
  };

  const handleColorChange = async (color: string) => {
    await updateWorkspace(currentWorkspace.id, { color, updatedAt: new Date().toISOString() });
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !uid || !profile) return;
    await sendInvite({
      workspaceId: currentWorkspace.id,
      workspaceName: currentWorkspace.name,
      invitedEmail: inviteEmail.trim().toLowerCase(),
      invitedBy: uid,
      invitedByName: profile.displayName,
      role: inviteRole,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setInviteEmail('');
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
  };

  const handleRemoveMember = async (member: WorkspaceMember) => {
    if (!confirm(`${member.displayName} wirklich entfernen?`)) return;
    await removeMember(currentWorkspace.id, member);
  };

  const handleLeave = async () => {
    if (!uid || !profile) return;
    const me = currentWorkspace.members.find((m) => m.userId === uid);
    if (!me) return;
    if (isOwner) {
      if (!confirm('Als Eigentümer wird der Arbeitsbereich gelöscht. Fortfahren?')) return;
      await deleteWorkspace(currentWorkspace.id);
    } else {
      if (!confirm('Arbeitsbereich wirklich verlassen?')) return;
      await removeMember(currentWorkspace.id, me);
    }
  };

  const handleAcceptInvite = async (inviteId: string, workspaceId: string) => {
    if (!uid || !profile) return;
    await acceptInvite(inviteId, {
      userId: uid,
      role: 'member',
      displayName: profile.displayName,
      email: profile.email,
      joinedAt: new Date().toISOString(),
    }, workspaceId);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Arbeitsbereich</h1>
        <p className="text-neutral-500 mt-1">Verwalte deinen Arbeitsbereich und lade Mitglieder ein</p>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Einladungen</h2>
          {invites.map((inv) => (
            <div key={inv.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{inv.workspaceName}</p>
                <p className="text-sm text-neutral-500">Eingeladen von {inv.invitedByName}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptInvite(inv.id, inv.workspaceId)}
                  className="btn-primary text-sm py-1.5"
                >
                  Annehmen
                </button>
                <button
                  onClick={() => declineInvite(inv.id)}
                  className="btn-secondary text-sm py-1.5"
                >
                  Ablehnen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workspace Settings */}
      <div className="card p-6 space-y-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <Settings size={20} />
          Einstellungen
        </h2>

        {/* Name & Description */}
        {editName ? (
          <div className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Beschreibung</label>
              <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveName} className="btn-primary text-sm">Speichern</button>
              <button onClick={() => setEditName(false)} className="btn-secondary text-sm">Abbrechen</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: currentWorkspace.color }}
              >
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">{currentWorkspace.name}</p>
                <p className="text-sm text-neutral-500">{currentWorkspace.description || 'Keine Beschreibung'}</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setName(currentWorkspace.name);
                  setDesc(currentWorkspace.description);
                  setEditName(true);
                }}
                className="btn-secondary text-sm"
              >
                Bearbeiten
              </button>
            )}
          </div>
        )}

        {/* Color picker */}
        {isAdmin && (
          <div>
            <label className="label">Farbe</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {currentWorkspace.color === c && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card p-6 space-y-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <Users size={20} />
          Mitglieder ({currentWorkspace.members.length})
        </h2>

        {/* Invite form */}
        {isAdmin && (
          <div className="flex gap-3">
            <input
              className="input flex-1"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="E-Mail-Adresse eingeben..."
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <select
              className="input w-32"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
            >
              <option value="member">Mitglied</option>
              <option value="admin">Admin</option>
              <option value="viewer">Betrachter</option>
            </select>
            <button onClick={handleInvite} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <UserPlus size={16} />
              Einladen
            </button>
          </div>
        )}

        {inviteSent && (
          <p className="text-sm text-green-600 dark:text-green-400">Einladung gesendet!</p>
        )}

        {/* Member list */}
        <div className="space-y-2">
          {currentWorkspace.members.map((member) => {
            const RoleIcon = roleIcons[member.role];
            return (
              <div key={member.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-white text-sm truncate">
                    {member.displayName}
                    {member.userId === uid && (
                      <span className="text-neutral-400 font-normal"> (Du)</span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                    <RoleIcon size={12} />
                    {roleLabels[member.role]}
                  </span>
                  {isAdmin && member.userId !== uid && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Gefahrenzone</h2>
        <button onClick={handleLeave} className="btn-danger flex items-center gap-2">
          {isOwner ? <Trash2 size={16} /> : <LogOut size={16} />}
          {isOwner ? 'Arbeitsbereich löschen' : 'Arbeitsbereich verlassen'}
        </button>
      </div>
    </div>
  );
}
