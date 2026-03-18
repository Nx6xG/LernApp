'use client';

import { usePresence } from '@/hooks/usePresence';

export function OnlineUsers() {
  const users = usePresence();

  if (users.length === 0) return null;

  return (
    <div className="px-3 py-2">
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2 px-1">
        Online ({users.length})
      </p>
      <div className="space-y-1">
        {users.map((user) => (
          <div
            key={user.userId}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg"
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: user.color }}
              >
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                {user.displayName}
              </p>
              <p className="text-[10px] text-neutral-400 truncate">
                {user.page}
                {user.detail && ` · ${user.detail}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
