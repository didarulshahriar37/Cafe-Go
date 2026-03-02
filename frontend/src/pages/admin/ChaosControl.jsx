import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Globe, Github, Box, ChefHat, Bell, ToggleLeft, ToggleRight, Radio } from 'lucide-react';

// Each service may have a deployed URL configured via VITE_<SERVICE>_URL
const SERVICES = [
    { name: 'Gateway', port: 8080, icon: Globe },
    { name: 'Stock', port: 3001, icon: Box },
    { name: 'Kitchen', port: 3002, icon: ChefHat },
    { name: 'Notifications', port: 3003, icon: Bell }
];

function getServiceUrl(service) {
    const envKey = `VITE_${service.name.toUpperCase()}_URL`;
    const url = import.meta.env[envKey];
    if (url) return url.replace(/\/api\/?$/i, ''); // strip "/api" if present

    // If we're running in production the absence of a URL means the
    // service isn't reachable from the front‑end – don't fall back to
    // localhost, return null so callers can skip attempting requests.
    if (import.meta.env.MODE === 'production') {
        return null;
    }
    return `http://localhost:${service.port}`;
}

export default function ChaosControl() {
    const [health, setHealth] = useState({});
    const [loading, setLoading] = useState({});

    const fetchHealth = async () => {
        const results = {};
        for (const service of SERVICES) {
            const url = getServiceUrl(service);
            if (!url) {
                // no configured endpoint for this environment; skip
                results[service.name] = { status: 'UNKNOWN' };
                continue;
            }
            try {
                const response = await axios.get(`${url}/health`, { timeout: 1000 });
                results[service.name] = response.data;
            } catch (err) {
                results[service.name] = { status: 'DOWN', chaos: err.response?.data?.chaos };
            }
        }
        setHealth(results);
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 3000);
        return () => clearInterval(interval);
    }, []);

    const toggleChaos = async (service) => {
        const url = getServiceUrl(service);
        if (!url) {
            console.warn('toggleChaos skipped - no URL for', service.name);
            return;
        }

        setLoading(prev => ({ ...prev, [service.name]: true }));
        try {
            await axios.post(`${url}/chaos/toggle`);
            await fetchHealth();
        } catch (err) {
            console.error(`Failed to toggle chaos for ${service.name}`, err);
        } finally {
            setLoading(prev => ({ ...prev, [service.name]: false }));
        }
    };

    return (
        <div className="pt-28 pb-12 px-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <ShieldAlert className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white">Chaos <span className="text-rose-500">Control</span> Panel</h1>
                    <p className="text-slate-400 text-sm">Inject failures and monitor system resilience.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SERVICES.map((service) => {
                    const statusData = health[service.name];
                    const isUp = statusData?.status === 'UP';
                    const isChaos = statusData?.chaos === true;
                    const Icon = service.icon;

                    return (
                        <motion.div
                            key={service.name}
                            layout
                            className={`glass-card p-6 border-l-4 transition-all ${isUp ? 'border-l-emerald-500' : isChaos ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-slate-700'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">{service.name} Service</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {isUp ? 'Healthy' : 'Error / Injected Failure'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleChaos(service)}
                                    disabled={loading[service.name]}
                                    className={`relative flex items-center transition-all ${loading[service.name] ? 'opacity-50' : 'hover:scale-105'}`}
                                >
                                    {isChaos ? (
                                        <ToggleRight className="w-12 h-12 text-rose-500" />
                                    ) : (
                                        <ToggleLeft className="w-12 h-12 text-slate-600" />
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                                    <span className="text-[10px] uppercase text-slate-500 block mb-1">Port</span>
                                    <span className="text-sm font-mono text-slate-300">:{service.port}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                                    <span className="text-[10px] uppercase text-slate-500 block mb-1">Impact</span>
                                    <span className="text-sm text-slate-300">{isChaos ? 'Disabled' : 'Operational'}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-12 p-8 glass-card border-dashed border-rose-500/20 bg-rose-500/5">
                <h2 className="text-xl font-bold text-rose-100 flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-rose-500" />
                    Failure Isolation Principles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-slate-400">
                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-200">1. Graceful Degradation</h4>
                        <p>If the <b>Notification Service</b> is down, students can still order food and see progress bars—they just won't get real-time toast alerts.</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-200">2. Request Isolation</h4>
                        <p>Disabling the <b>Kitchen</b> prevents <i>cooking</i>, but the <b>Stock Service</b> continues to allow browsing and inventory management.</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-200">3. Independent Failure</h4>
                        <p>Services communicate via an event bus (RabbitMQ) or Gateway proxy. A failure in one node is trapped at the network layer.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
