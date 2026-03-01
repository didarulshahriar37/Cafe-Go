import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ChevronRight, Moon, Star } from 'lucide-react';

export default function Login() {
    const { login, loginWithGoogle } = useAuth();
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
            setError('Check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            setError('Google sign-in failed.');
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
                        <span>Ramadan Cafe System</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-6">
                        Experience the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500">
                            Luna Magic
                        </span>
                    </h1>

                    <p className="text-slate-400 text-lg lg:text-xl max-w-xl leading-relaxed mb-10">
                        The ultimate smart cafeteria system designed for a seamless Iftar and Suhoor experience. Pure speed, precision, and elegance.
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
                            <span className="text-xs uppercase tracking-widest">Firebase</span>
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
                                <p className="text-slate-400 text-sm">Please enter your details</p>
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
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                                    placeholder="School email address"
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
                                <a href="#" className="text-amber-500 hover:text-amber-400 font-medium">Forgot password?</a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                            >
                                {loading ? 'Signing in...' : 'Sign in to Luna'}
                                {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0b1025] px-4 text-slate-500 font-bold tracking-widest">Or continue with</span></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-4 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google Account
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Floating Moon for Aesthetic */}
            <div className="absolute top-20 right-20 w-96 h-96 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
    );
}
