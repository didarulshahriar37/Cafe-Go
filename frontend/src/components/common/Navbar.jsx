import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Moon, User, Activity, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
    const { currentUser, logout, userRole } = useAuth();
    const [isHealthy, setIsHealthy] = useState(true);

    // strips /api suffix so health check hits the right path
    function normalizeGatewayBase(url) {
        if (!url) return null;
        return url.replace(/\/api\/?$/i, '');
    }

    useEffect(() => {
        const checkHealth = async () => {
            try {
                let gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || '';
                gatewayUrl = normalizeGatewayBase(gatewayUrl) || 'http://localhost:8080';

                if (import.meta.env.MODE === 'production' && gatewayUrl.includes('localhost')) {
                    setIsHealthy(false);
                    return;
                }

                await axios.get(`${gatewayUrl}/health`, { timeout: 1500 });
                setIsHealthy(true);
            } catch (err) {
                setIsHealthy(false);
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link to={userRole === 'admin' ? '/admin/chaos' : '/'} className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <Moon className="w-6 h-6 text-amber-500" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">
                            Cafe<span className="text-amber-500">Go</span> {userRole === 'admin' && <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 ml-2">ADMIN</span>}
                        </span>
                    </Link>

                    {(userRole === 'admin' || isHealthy === false) && (
                        <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500 ${isHealthy ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/5 border-rose-500/20 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                            }`}>
                            <Activity className={`w-3 h-3 ${isHealthy ? '' : 'animate-pulse'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">{isHealthy ? 'System Optimal' : 'Degraded Performance'}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {userRole === 'admin' && (
                        <Link
                            to="/admin/chaos"
                            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all border border-slate-700"
                            title="Admin Dashboard"
                        >
                            <ShieldAlert className="w-5 h-5" />
                        </Link>
                    )}

                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-200">{currentUser?.email?.split('@')[0]}</span>
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
