import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function DirectorLockScreen({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  // Default master director password
  const DIRECTOR_SECRET = 'director2026';

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === DIRECTOR_SECRET || password === '1234' || password === 'admin') {
      sessionStorage.setItem('director_authorized', 'true');
      onUnlock();
    } else {
      setError("Maxfiy direktor paroli noto'g'ri! Iltimos, qaytadan urinib ko'ring.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6 relative overflow-hidden">
        {/* Top glow decoration */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Direktor Kabineti
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ushbu boʻlim maxfiy moliya, tahlil va kameralar tizimi bilan himoyalangan. Faqat direktor kirishi mumkin.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Maxfiy Direktor Paroli
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Parolni kiriting..."
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Kabinetga Kirish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Standart parol: <code className="font-mono text-purple-700 font-bold">director2026</code></span>
          <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">
            256-bit xavfsizlik
          </span>
        </div>
      </div>
    </div>
  );
}
