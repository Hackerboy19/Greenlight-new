import React from 'react';
import { LogOut, X } from 'lucide-react';
import { GreenLightLogo } from '../../GreenLightLogo';
import type { AdminUser } from '../../../utils/adminAuth';

export interface AdminNavItem<Id extends string = string> {
  id: Id;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Small count shown after the label, e.g. the number of articles. */
  count?: number;
  /** Section heading the item is grouped under. */
  group?: string;
}

export interface AdminSidebarProps<Id extends string> {
  items: AdminNavItem<Id>[];
  activeId: Id;
  onSelect: (id: Id) => void;
  user: AdminUser;
  onSignOut: () => void;
  /** Mobile only: whether the drawer is open. */
  open: boolean;
  onClose: () => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/**
 * Left navigation for the Admin CMS. A fixed column on large screens and a
 * slide-in drawer on phones and tablets.
 */
export function AdminSidebar<Id extends string>({
  items,
  activeId,
  onSelect,
  user,
  onSignOut,
  open,
  onClose
}: AdminSidebarProps<Id>) {
  const groups: { name: string; items: AdminNavItem<Id>[] }[] = [];
  for (const item of items) {
    const name = item.group || '';
    let group = groups.find((g) => g.name === name);
    if (!group) groups.push((group = { name, items: [] }));
    group.items.push(item);
  }

  return (
    <>
      {/* Backdrop behind the mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-slate-950/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Admin navigation"
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          {/* The same lockup as the reader site's header, with the CMS named underneath. */}
          <GreenLightLogo variant="horizontal" size="sm" subtitle="Admin CMS" className="min-w-0" />
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map((group) => (
            <div key={group.name || 'main'}>
              {group.name && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700/70 dark:text-brand-400/70">
                  {group.name}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon, count }) => {
                  const active = id === activeId;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(id);
                          onClose();
                        }}
                        aria-current={active ? 'page' : undefined}
                        className={`w-full min-h-[40px] flex items-center gap-3 px-3.5 py-2 rounded-full text-sm transition-all active:scale-[0.98] ${
                          active
                            ? 'bg-brand-600 text-white font-bold shadow-card ring-2 ring-brand-500/20'
                            : 'font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left truncate">{label}</span>
                        {count !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              active
                                ? 'bg-white/20 text-white'
                                : 'bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 ring-2 ring-brand-500/20">
              {initials(user.name || user.email) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{user.role}</div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
