import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ChevronRight, Moon, Star } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleEmailLogin(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050816] overflow-hidden">
            {/* Background Image / Decoration */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-[1200px] px-6 py-12 flex flex-col lg:flex-row items-center justify-between gap-16">

                {/* Left Side: Branding / Impact */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 text-center lg:text-left"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-8">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span>CafeGo Platform</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-6">
                        Experience the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500">
                            CafeGo Magic
                        </span>
                    </h1>

                    <p className="text-slate-400 text-lg lg:text-xl max-w-xl leading-relaxed mb-10">
                        The ultimate smart cafeteria system designed for a seamless Iftar experience. Pure speed, precision, and elegance.
                    </p>

                    <div className="flex items-center justify-center lg:justify-start gap-8 opacity-50">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white">0.5s</span>
                            <span className="text-xs uppercase tracking-widest">Latency</span>
                        </div>
                        <div className="h-10 w-px bg-slate-800" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white">Real-time</span>
                            <span className="text-xs uppercase tracking-widest">Tracking</span>
                        </div>
                        <div className="h-10 w-px bg-slate-800" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white">Secure</span>
                            <span className="text-xs uppercase tracking-widest">JWT Auth</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-[480px]"
                >
                    <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Moon className="w-6 h-6 text-slate-950 fill-slate-950" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                                <p className="text-slate-400 text-sm">Please sign in with your Email</p>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleEmailLogin} className="space-y-5">
                            <div className="group relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="group relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm px-2">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
                                    <input type="checkbox" className="w-4 h-4 rounded accent-amber-500 bg-slate-800 border-slate-700" />
                                    <span>Remember me</span>
                                </label>
                                <span className="text-amber-500/50 font-bold text-[10px] tracking-widest uppercase">IUT Secured Access</span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                            >
                                {loading ? 'Validating...' : 'Sign in to CafeGo'}
                                {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>

            {/* Floating decoration */}
            <div className="absolute top-20 right-20 w-96 h-96 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
    );
}
