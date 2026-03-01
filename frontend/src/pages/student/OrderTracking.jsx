import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Clock,
    ChefHat,
    PackageCheck,
    ArrowLeft,
    CheckCircle2,
    Circle,
    Loader2
} from 'lucide-react';
import socketService from '../../services/api/socket.service';

const steps = [
    { key: 'PENDING_KITCHEN', label: 'Order Received', icon: Clock },
    { key: 'COOKING', label: 'In the Kitchen', icon: ChefHat },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: PackageCheck }
];

export default function OrderTracking() {
    const { orderId } = useParams();
    const [status, setStatus] = useState('PENDING_KITCHEN');
    const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        if (!orderId) return;

        socketService.subscribeToOrder(orderId, (data) => {
            setStatus(data.status);
            setLastUpdate(new Date().toLocaleTimeString());
        });

        return () => {
            // In a real app, you might want to unsubscribe specifically
            // For this hackathon, we'll keep it simple
        };
    }, [orderId]);

    const getCurrentStepIndex = () => {
        return steps.findIndex(step => step.key === status);
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
        <div className="pt-28 pb-12 px-4 max-w-3xl mx-auto">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Track Your <span className="text-amber-500">Iftar</span></h1>
                        <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Order ID: {orderId}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 font-medium italic">Last update at {lastUpdate}</span>
                        <div className="flex items-center gap-2 mt-1">
                            {status !== 'READY_FOR_PICKUP' && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                            <span className="text-sm font-bold text-amber-500">{status.replace(/_/g, ' ')}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="relative">
                    {/* Progress Bar Background */}
                    <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-slate-800 md:left-0 md:top-[27px] md:right-0 md:bottom-auto md:h-0.5 md:w-full" />

                    {/* Animated Progress Bar */}
                    <motion.div
                        className="absolute left-[27px] top-0 w-0.5 bg-amber-500 md:left-0 md:top-[27px] md:h-0.5 origin-left"
                        initial={{ scaleY: 0 }}
                        animate={{
                            scaleY: currentStepIndex / (steps.length - 1),
                            scaleX: currentStepIndex / (steps.length - 1)
                        }}
                        transition={{ duration: 0.5 }}
                        style={{
                            height: '100%',
                            width: '100%'
                        }}
                    />

                    <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-4">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isActive = index === currentStepIndex;
                            const Icon = step.icon;

                            return (
                                <div key={step.key} className="flex flex-row md:flex-col items-center gap-4 md:text-center z-10 flex-1">
                                    <div className={`
                                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2
                                        ${isCompleted ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/20' :
                                            isActive ? 'bg-slate-800 border-amber-400 shadow-xl shadow-amber-500/10' :
                                                'bg-slate-900 border-slate-700'}
                                    `}>
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-7 h-7 text-slate-950" />
                                        ) : (
                                            <Icon className={`w-7 h-7 ${isActive ? 'text-amber-400' : 'text-slate-600'}`} />
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <span className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-600'}`}>
                                            {step.label}
                                        </span>
                                        {isActive && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-[10px] text-amber-500 font-bold uppercase mt-1"
                                            >
                                                Current Status
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {status === 'READY_FOR_PICKUP' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-16 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center"
                    >
                        <h3 className="text-xl font-bold text-amber-400 mb-2">Bismillah! Your meal is ready.</h3>
                        <p className="text-slate-400 text-sm">Please head to the cafeteria counter and show your Order ID to collect your Iftar.</p>
                    </motion.div>
                )}
            </motion.div>

            <div className="mt-8 glass-card p-6 border-dashed opacity-50 text-center">
                <p className="text-xs text-slate-500">The Kitchen usually processes orders in 3-5 minutes. Updates appear here in real-time.</p>
            </div>
        </div>
    );
}
