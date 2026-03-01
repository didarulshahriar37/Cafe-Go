import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Moon, User } from 'lucide-react';

export default function Navbar() {
    const { currentUser, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <Moon className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        Cafe<span className="text-amber-500">Go</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-200">{currentUser?.email}</span>
                    </div>

                    <button
                        onClick={logout}
                        className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all border border-slate-700"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
