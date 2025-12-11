import { useState } from 'react';

function AdminLogin({ isOpen, onClose, onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Sačuvaj token u localStorage
                localStorage.setItem('adminToken', data.token);
                setPassword('');
                onLogin(data.token);
                onClose();
            } else {
                setError(data.error || 'Pogrešna lozinka');
            }
        } catch (err) {
            setError('Greška pri povezivanju sa serverom');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <span>🔐</span> Admin Pristup
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <span className="text-2xl">×</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Lozinka
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Unesite admin lozinku"
                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-fifa-blue dark:focus:border-fifa-gold focus:outline-none transition-colors"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-lg p-3">
                            <p className="text-red-800 dark:text-red-200 text-sm font-semibold flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            disabled={loading}
                        >
                            Otkaži
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-lg bg-fifa-blue hover:bg-blue-700 dark:bg-fifa-gold dark:hover:bg-yellow-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading || !password}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">⏳</span> Proveravam...
                                </>
                            ) : (
                                <>
                                    <span>🔓</span> Unlock
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        🔒 Bezbedna autentifikacija sa JWT tokenima
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
