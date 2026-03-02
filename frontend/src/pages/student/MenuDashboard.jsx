import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ShoppingCart, CheckCircle2, AlertCircle, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CafeService from '../../services/api/cafe.service';
import { useAuth } from '../../context/AuthContext';

export default function MenuDashboard() {
    const { userRole } = useAuth();
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(false);
    const [ordering, setOrdering] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const fetchStock = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await CafeService.checkStock();

            // API should return an array of inventory items, but depending
            // on environment it might wrap the array in an object (e.g.
            // { items: [...] }) or return something else on error.  Be
            // defensive here to avoid crashing the component when
            // `items.map` is called.
            let list = [];
            if (Array.isArray(data)) {
                list = data;
            } else if (data && Array.isArray(data.items)) {
                list = data.items;
            } else {
                // anything else is unexpected – convert to empty and
                // surface an error so the user knows something went wrong.
                console.warn('Unexpected stock payload', data);
                setError('Received invalid inventory data from server');
            }

            setItems(list);
        } catch (err) {
            setError(err.message || 'Failed to sync with stock-service');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    const addToCart = (item) => {
        setCart(prev => ({
            ...prev,
            [item._id]: {
                ...item,
                qty: (prev[item._id]?.qty || 0) + 1
            }
        }));
    };

    const removeFromCart = (itemId) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[itemId].qty > 1) {
                newCart[itemId].qty -= 1;
            } else {
                delete newCart[itemId];
            }
            return newCart;
        });
    };

    const handlePlaceOrder = async () => {
        if (userRole !== 'student') {
            setError("Admins are not permitted to place orders. Please log in as a student.");
            return;
        }
        if (Object.keys(cart).length === 0) return;

        try {
            setOrdering(true);
            setError(null);

            const orderItems = Object.values(cart).map(item => ({
                itemId: item._id,
                quantity: item.qty
            }));

            // Generate unique idempotency key for this checkout attempt
            const idKey = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const result = await CafeService.placeOrder(orderItems, idKey);

            setSuccess(result.message);
            setCart({}); // Clear cart

            // Redirect to tracking page after 1.5 seconds so they see the success message
            setTimeout(() => {
                navigate(`/track/${idKey}`);
            }, 1500);

            // Auto-refresh stock
            setTimeout(fetchStock, 2000);

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);

        } catch (err) {
            setError(err.message || 'Order failed. Please check stock and try again.');
        } finally {
            setOrdering(false);
        }
    };

    const cartTotal = Object.values(cart).reduce((total, item) => total + (item.price * item.qty), 0);
    const cartCount = Object.values(cart).reduce((total, item) => total + item.qty, 0);

    return (
        <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Menu Area */}
            <div className="lg:col-span-2 space-y-8">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">CafeGo <span className="text-amber-500">Menu</span></h1>
                        <p className="text-slate-400 mt-1">Select your Iftar or Suhoor favorites.</p>
                    </div>

                    <button
                        onClick={fetchStock}
                        disabled={loading}
                        className="secondary-button"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Syncing...' : 'Refresh Stock'}
                    </button>
                </header>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 flex items-center gap-3"
                    >
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">{success}</span>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {items.length === 0 && !loading && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center glass-card border-dashed">
                            <ShoppingBag className="w-12 h-12 text-slate-700 mb-4" />
                            <p className="text-slate-500">No items available in the cafeteria right now.</p>
                        </div>
                    )}

                    {items.map((item) => (
                        <motion.div
                            key={item._id}
                            layout
                            className="glass-card overflow-hidden group hover:border-amber-500/30 transition-colors"
                        >
                            <div className="h-48 bg-slate-700/50 relative overflow-hidden">
                                <img
                                    src={item.image || `https://source.unsplash.com/featured/?food,${item.title}`}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full text-xs font-bold text-amber-500 border border-amber-500/20">
                                    {item.category || 'Specialty'}
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">{item.title}</h3>
                                    <span className="text-amber-500 font-bold tracking-wider">${item.price}</span>
                                </div>
                                <p className="text-xs text-slate-400 mb-5 line-clamp-2 leading-relaxed">
                                    {item.description || "A delicious traditional choice for your Ramadan meal, prepared fresh daily."}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${item.stock > 10 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {item.stock > 0 ? 'In Stock' : 'Sold Out'}
                                        </span>
                                        <span className="text-lg font-black text-slate-200">{item.stock} LEFT</span>
                                    </div>

                                    <button
                                        disabled={item.stock <= 0}
                                        onClick={() => addToCart(item)}
                                        className={`p-3 rounded-xl transition-all ${item.stock > 0
                                            ? 'bg-amber-500 text-slate-900 hover:scale-110'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            }`}
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Cart / Plate Sidebar */}
            <div className="lg:col-span-1">
                <div className="glass-card p-6 sticky top-28">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            Your <span className="text-amber-500">Plate</span>
                            {cartCount > 0 && (
                                <span className="text-xs bg-amber-500 text-slate-900 w-5 h-5 flex items-center justify-center rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </h2>
                        <ShoppingCart className="w-6 h-6 text-slate-500" />
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-8">
                        {Object.values(cart).length === 0 && (
                            <div className="py-12 flex flex-col items-center gap-3 opacity-30">
                                <ShoppingBag className="w-10 h-10" />
                                <p className="text-sm italic">Plate is empty...</p>
                            </div>
                        )}

                        <AnimatePresence>
                            {Object.values(cart).map((item) => (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-700/30"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-200">{item.title}</span>
                                        <span className="text-xs text-amber-500/70 font-medium">${item.price} x {item.qty}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => removeFromCart(item._id)} className="p-1 hover:text-rose-400 transition-colors">
                                            {item.qty === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                        </button>
                                        <span className="text-sm font-bold min-w-[20px] text-center">{item.qty}</span>
                                        <button onClick={() => addToCart(item)} className="p-1 hover:text-amber-400 transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="border-t border-slate-700/50 pt-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium uppercase tracking-widest text-xs">Iftar Total</span>
                            <span className="text-3xl font-black text-white">${cartTotal.toFixed(2)}</span>
                        </div>

                        <button
                            disabled={cartCount === 0 || ordering || userRole !== 'student'}
                            onClick={handlePlaceOrder}
                            className={`luminous-button w-full ${userRole !== 'student' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                        >
                            {ordering ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-5 h-5" />
                            )}
                            {ordering ? 'Reserving...' : userRole === 'student' ? 'Confirm Order' : 'Student Access Only'}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
