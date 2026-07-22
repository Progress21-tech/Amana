'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, Bot, LogOut, User as UserIcon, X } from 'lucide-react';
import { getUser, clearToken, isAdmin } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const admin = isAdmin();
  const user = getUser();

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  if (!mounted) return <div className="hidden lg:block w-60 bg-white border-r border-gray-100 flex-shrink-0" />;

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100 h-screen flex flex-col flex-shrink-0",
        "transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-600 tracking-tight">Amana.</h1>
        <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard" onClick={onClose} className={cn("flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === '/dashboard' ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
          <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
        </Link>

        {admin && (
          <>
            <Link href="/members" onClick={onClose} className={cn("flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname.startsWith('/members') ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
              <Users className="w-5 h-5 mr-3" /> Members
            </Link>
            <Link href="/loans" onClick={onClose} className={cn("flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname.startsWith('/loans') ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
              <CreditCard className="w-5 h-5 mr-3" /> Loans
            </Link>
          </>
        )}

        {!admin && (
          <Link href="/account" onClick={onClose} className={cn("flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === '/account' ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
            <UserIcon className="w-5 h-5 mr-3" /> My Account
          </Link>
        )}

        <Link href="/assistant" onClick={onClose} className={cn("flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === '/assistant' ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
          <Bot className="w-5 h-5 mr-3" /> AI Assistant
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut className="w-5 h-5 mr-3" /> Logout
        </button>
      </div>
    </div>
  );
}
