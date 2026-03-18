'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  HelpCircle,
  BookOpen,
  Target,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { useTheme } from '@/hooks/useTheme';
import { OnlineUsers } from './OnlineUsers';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { SearchModal } from './SearchModal';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/karteikarten', label: 'Karteikarten', icon: Layers },
  { href: '/quiz', label: 'Quiz', icon: HelpCircle },
  { href: '/theorie', label: 'Theorie', icon: BookOpen },
  { href: '/fortschritt', label: 'Fortschritt', icon: Target },
  { href: '/zusammenarbeit', label: 'Zusammenarbeit', icon: Users },
  { href: '/arbeitsbereich', label: 'Arbeitsbereich', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useAuthStore((s) => s.profile);
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-neutral-800 shadow-md lg:hidden"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Workspace Switcher */}
          <div className="px-3 pt-4 pb-2 border-b border-neutral-200 dark:border-neutral-700">
            <WorkspaceSwitcher />
          </div>

          {/* Search */}
          <div className="px-3 pt-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <Search size={16} />
              <span className="flex-1 text-left">Suche...</span>
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 rounded">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Online users */}
          <OnlineUsers />

          {/* Theme toggle */}
          <div className="px-3 pb-2">
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  theme === 'light' ? 'bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500'
                }`}
              >
                <Sun size={13} />
                Hell
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  theme === 'dark' ? 'bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500'
                }`}
              >
                <Moon size={13} />
                Dunkel
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  theme === 'system' ? 'bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500'
                }`}
              >
                <Monitor size={13} />
                Auto
              </button>
            </div>
          </div>

          {/* User section */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <Link
              href="/profil"
              className="flex items-center gap-3 mb-3 px-2 py-2 -mx-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors group"
              onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
            >
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300 flex-shrink-0">
                {profile?.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                  {profile?.displayName || 'Benutzer'}
                </p>
                <p className="text-xs text-neutral-500 truncate">{profile?.email}</p>
              </div>
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Abmelden
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
