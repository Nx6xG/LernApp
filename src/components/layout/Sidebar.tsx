'use client';

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
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

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

  return (
    <>
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

          {/* User section */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                {profile?.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {profile?.displayName || 'Benutzer'}
                </p>
                <p className="text-xs text-neutral-500 truncate">{profile?.email}</p>
              </div>
            </div>
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
