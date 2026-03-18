import { ref, set, onValue, onDisconnect, off, serverTimestamp } from 'firebase/database';
import { getFirebaseRtdb } from './firebase';

export interface UserPresence {
  userId: string;
  displayName: string;
  page: string; // current route, e.g. '/karteikarten'
  detail?: string; // e.g. deck name, note title
  color: string;
  lastSeen: number;
}

const PRESENCE_COLORS = [
  '#4c6ef5', '#40c057', '#fab005', '#fa5252', '#7950f2',
  '#15aabf', '#e64980', '#fd7e14', '#20c997', '#845ef7',
];

function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}

const rtdb = () => getFirebaseRtdb();

/**
 * Sets the current user's presence in a workspace.
 * Auto-removes on disconnect.
 */
export function setPresence(
  workspaceId: string,
  userId: string,
  displayName: string,
  page: string,
  detail?: string
): void {
  const presenceRef = ref(rtdb(), `presence/${workspaceId}/${userId}`);
  const data: UserPresence = {
    userId,
    displayName,
    page,
    detail,
    color: getColorForUser(userId),
    lastSeen: Date.now(),
  };
  set(presenceRef, data);
  onDisconnect(presenceRef).remove();
}

/**
 * Removes presence when leaving.
 */
export function removePresence(workspaceId: string, userId: string): void {
  const presenceRef = ref(rtdb(), `presence/${workspaceId}/${userId}`);
  set(presenceRef, null);
}

/**
 * Subscribes to all presence data for a workspace.
 * Returns cleanup function.
 */
export function subscribeToPresence(
  workspaceId: string,
  currentUserId: string,
  callback: (users: UserPresence[]) => void
): () => void {
  const presenceRef = ref(rtdb(), `presence/${workspaceId}`);
  const handler = onValue(presenceRef, (snap) => {
    const data = snap.val();
    if (!data) {
      callback([]);
      return;
    }
    const users = Object.values(data) as UserPresence[];
    // Filter out current user and stale entries (>5 min old)
    const fresh = users.filter(
      (u) => u.userId !== currentUserId && Date.now() - u.lastSeen < 5 * 60 * 1000
    );
    callback(fresh);
  });

  return () => off(presenceRef);
}
