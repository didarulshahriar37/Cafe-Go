import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Zap, Globe, Box, ChefHat, Bell,
    ToggleLeft, ToggleRight, Activity,
    BarChart3, AlertCircle, Clock, Server, RefreshCw, ShieldCheck
} from 'lucide-react';

// Services list is reused; each entry may be overridden by an env var
const SERVICES = [
    { name: 'Gateway', port: 8080, icon: Globe },
    { name: 'Identity', port: 3004, icon: ShieldCheck },
    { name: 'Stock', port: 3001, icon: Box },
    { name: 'Kitchen', port: 3002, icon: ChefHat },
    { name: 'Notifications', port: 3003, icon: Bell }
];

function getServiceUrl(service) {
    const envKey = `VITE_${service.name.toUpperCase()}_URL`;
    const url = import.meta.env[envKey];
    console.log(`[getServiceUrl] ${envKey} = ${url || '(not set)'}`);

    if (url) return url.replace(/\/api\/?$/i, '');

    if (import.meta.env.MODE === 'production') {
        console.warn(`[getServiceUrl] ${service.name}: no URL and MODE=production, returning null`);
        return null;
    }
    const fallback = `http://localhost:${service.port}`;
    console.log(`[getServiceUrl] ${service.name}: using fallback`, fallback);
    return fallback;
}

export default function AdminDashboard() {
    const [health, setHealth] = useState({});
    const [metrics, setMetrics] = useState({});
    const [loading, setLoading] = useState({});
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

    const fetchData = async () => {
        const hResults = {};
        const mResults = {};

        console.log('[AdminDashboard] Fetching health/metrics for all services...');

        for (const service of SERVICES) {
            const url = getServiceUrl(service);
            if (!url) {
                console.warn(`[AdminDashboard] ${service.name}: no URL configured, skipping`);
                hResults[service.name] = { status: 'UNKNOWN' };
                mResults[service.name] = null;
                continue;
            }

            console.log(`[AdminDashboard] ${service.name}: fetching from ${url}`);

            // Fetch Health
            try {
                const hRes = await axios.get(`${url}/health`, { timeout: 5000 });
                console.log(`[AdminDashboard] ${service.name} /health: OK`, hRes.data);
                hResults[service.name] = hRes.data;
            } catch (err) {
                console.error(`[AdminDashboard] ${service.name} /health: FAILED`, err.message);
                hResults[service.name] = { status: 'DOWN', chaos: err.response?.data?.chaos };
            }

            // Fetch Metrics
            try {
                const mRes = await axios.get(`${url}/metrics`, { timeout: 5000 });
                console.log(`[AdminDashboard] ${service.name} /metrics: OK`);
                mResults[service.name] = mRes.data;
            } catch (err) {
                console.warn(`[AdminDashboard] ${service.name} /metrics: FAILED`, err.message);
                mResults[service.name] = null;
            }
        }

        setHealth(hResults);
        setMetrics(mResults);
        setLastSync(new Date().toLocaleTimeString());
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
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
            await fetchData();
        } catch (err) {
            console.error(`Failed to toggle chaos for ${service.name}`, err);
        } finally {
            setLoading(prev => ({ ...prev, [service.name]: false }));
        }
    };

    const clearMetrics = async () => {
        for (const service of SERVICES) {
            const url = getServiceUrl(service);
            if (!url) continue;
            try {
                await axios.post(`${url}/metrics/reset`);
            } catch (err) {
                console.warn(`Failed to reset metrics for ${service.name}`);
            }
        }
        await fetchData();
    };

    // Global Stats Aggregation
    const globalRequests = Object.values(metrics).reduce((acc, curr) => acc + (curr?.total_requests || 0), 0);
    const globalFailures = Object.values(metrics).reduce((acc, curr) => acc + (curr?.failed_requests || 0), 0);
    const validLatencies = Object.values(metrics).filter(m => m && m.avg_response_time_ms != null);
    const avgLatency = validLatencies.length > 0
        ? validLatencies.reduce((acc, curr) => acc + parseFloat(curr.avg_response_time_ms || 0), 0) / validLatencies.length
        : 0;

    return (
        <div className="pt-28 pb-12 px-4 max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Activity className="w-7 h-7 text-slate-900" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Admin <span className="text-amber-500">Control</span></h1>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            System Monitoring & Resilience
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <button
                        onClick={clearMetrics}
                        className="px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        Reset System Failures
                    </button>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last Real-time Sync</span>
                        <span className="text-sm font-mono text-amber-500/80 bg-amber-500/5 px-3 py-1 rounded-lg border border-amber-500/10">
                            {lastSync}
                        </span>
                    </div>
                </div>
            </header>

            {/* Global Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard icon={BarChart3} label="Total Throughput" value={globalRequests} color="amber" />
                <MetricCard icon={AlertCircle} label="System Failures" value={globalFailures} color="rose" />
                <MetricCard icon={Clock} label="Avg. System Latency" value={`${avgLatency.toFixed(1)}ms`} color="blue" />
                <MetricCard icon={Server} label="Healthy Nodes" value={`${Object.values(health).filter(h => h.status === 'UP').length}/${SERVICES.length}`} color="emerald" />
            </div>

            {/* Visual Alert for Gateway Latency (Bonus Challenge) */}
            <AnimatePresence>
                {metrics['Gateway']?.avg_response_time_ms > 1000 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-rose-500/20 border border-rose-500/50 p-4 rounded-2xl flex items-center justify-between text-rose-500 shadow-xl shadow-rose-500/10"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shrink-0">
                                <Zap className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-tight text-sm">High Latency Warning</h4>
                                <p className="text-xs opacity-80">Gateway response time is exceeding 1s. Current: {metrics['Gateway'].avg_response_time_ms}ms</p>
                            </div>
                        </div>
                        <div className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1 border border-rose-500/30 rounded-full animate-pulse">
                            Active Breach Alert
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Service Health Grid */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Service Inventory & Chaos Toggle
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {SERVICES.map((service) => {
                        const hData = health[service.name];
                        const mData = metrics[service.name];
                        const isUp = hData?.status === 'UP';
                        const isChaos = hData?.chaos === true;
                        const Icon = service.icon;

                        return (
                            <motion.div
                                key={service.name}
                                layout
                                className={`glass-card p-6 border-l-4 transition-all duration-500 ${isUp ? 'border-l-emerald-500' : isChaos ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-slate-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500 animate-pulse'}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{service.name} Service</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {isUp ? 'Operational' : isChaos ? 'Chaos Injected' : 'Node Disconnected'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chaos Control</span>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleChaos(service)}
                                            disabled={loading[service.name]}
                                            className="relative focus:outline-none group px-2 py-1"
                                        >
                                            <div className={`w-16 h-8 rounded-full transition-all duration-500 flex items-center px-1.5 ${isChaos ? 'bg-rose-500/20 border border-rose-500/50' : 'bg-slate-800 border border-slate-700'
                                                } ${loading[service.name] ? 'opacity-50' : ''}`}>
                                                <motion.div
                                                    animate={{
                                                        x: isChaos ? 28 : 0,
                                                        backgroundColor: loading[service.name] ? '#f59e0b' : (isChaos ? '#f43f5e' : '#475569'),
                                                        boxShadow: isChaos ? '0 0 20px rgba(244, 63, 94, 0.6)' : 'none',
                                                        rotate: loading[service.name] ? 360 : 0
                                                    }}
                                                    transition={loading[service.name]
                                                        ? { repeat: Infinity, duration: 1, ease: "linear" }
                                                        : { type: "spring", stiffness: 500, damping: 30 }
                                                    }
                                                    className="w-6 h-6 rounded-full flex items-center justify-center relative z-10"
                                                >
                                                    {loading[service.name] ? (
                                                        <RefreshCw className="w-3 h-3 text-white" />
                                                    ) : (
                                                        <Zap className={`w-3 h-3 ${isChaos ? 'text-white' : 'text-slate-400'}`} />
                                                    )}
                                                </motion.div>
                                            </div>

                                            {/* Status Badge Pulse */}
                                            {isChaos && !loading[service.name] && (
                                                <motion.div
                                                    layoutId={`chaos-aura-${service.name}`}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.3, 1] }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                    className="absolute inset-0 bg-rose-500/30 blur-xl rounded-full -z-10"
                                                />
                                            )}

                                            <span className="sr-only">Toggle Chaos</span>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Service Local Metrics */}
                                <div className="grid grid-cols-3 gap-4">
                                    <ServiceStat label="Success Rate" value={mData?.success_rate || '0%'} />
                                    <ServiceStat label="Requests" value={mData?.total_requests || 0} />
                                    <ServiceStat label="Avg Resp" value={`${mData?.avg_response_time_ms || 0}ms`} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Design Principles Footer (Same as Chaos Control but refined) */}
            <div className="p-8 glass-card border-dashed border-slate-700/50 opacity-60">
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-[0.2em] mb-4">Chaos Engineering Protocol</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
                    By simulating service outages, we validate our circuit breakers and retry logic.
                    Failures are isolated to specific segments, ensuring that the <b>CafeGo</b> platform
                    maintains core functionality even during partial system degradation.
                </p>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, color }) {
    const colors = {
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/10',
        rose: 'bg-rose-500/10 text-rose-500 border-rose-500/10',
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/10',
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10'
    };

    return (
        <div className={`glass-card p-6 flex items-center gap-5 border ${colors[color]}`}>
            <div className={`p-4 rounded-2xl ${colors[color].split(' ')[0]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                <h3 className="text-2xl font-black text-white">{value}</h3>
            </div>
        </div>
    );
}

function ServiceStat({ label, value }) {
    return (
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">{label}</span>
            <span className="text-sm font-mono text-slate-200">{value}</span>
        </div>
    );
}
