import React from 'react';
import { UserRole, User } from '../types.ts';
import { LogOut, Activity } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentRole: UserRole;
  onSwitchPortal: (role: UserRole) => void;
  onLogout: () => void;
  onOpenAuthModal: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentRole,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-800 uppercase tracking-tight">
            Lumina Health
          </span>
          {currentRole && (
            <span className="ml-2 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 tracking-wider">
              {currentRole === 'doctor' ? 'Doctor Workstation' : 'Patient Portal'}
            </span>
          )}
        </div>

        {/* User Status / Logout */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
                <span className="text-[11px] font-medium text-blue-700 capitalize flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                  {currentUser.role} Account
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-inner">
                {currentUser.name.charAt(0)}
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200/80 transition-colors flex items-center gap-2 text-xs font-bold"
              >
                <span>Logout</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
