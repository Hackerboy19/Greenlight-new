import React, { useState } from 'react';
import { AdminSidebar, AdminNavItem } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import type { AdminUser } from '../../../utils/adminAuth';

export interface AdminShellProps<Id extends string> {
  navItems: AdminNavItem<Id>[];
  activeId: Id;
  onNavigate: (id: Id) => void;
  user: AdminUser;
  onSignOut: () => void;
  onReaderView: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Page frame for every Admin CMS screen: sidebar, top header and content. */
export function AdminShell<Id extends string>({
  navItems,
  activeId,
  onNavigate,
  user,
  onSignOut,
  onReaderView,
  isDark,
  onToggleTheme,
  title,
  subtitle,
  actions,
  children
}: AdminShellProps<Id>) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <AdminSidebar
        items={navItems}
        activeId={activeId}
        onSelect={onNavigate}
        user={user}
        onSignOut={onSignOut}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar
          title={title}
          subtitle={subtitle}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onOpenMenu={() => setMenuOpen(true)}
          onReaderView={onReaderView}
          actions={actions}
        />
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
