import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useToast } from '../ui/Toast';
import { Lock, User, ArrowRight, ShieldCheck, Store, Eye, EyeOff, KeyRound } from 'lucide-react';

export function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.warning('Login va parolni kiriting');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(username.trim(), password.trim());
      toast.success(`Xush kelibsiz, ${user.first_name || user.username}! (${user.role})`);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      toast.error(err.message || 'Login yoki parol noto‘g‘ri');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin');
    toast.info("Hisob ma'lumotlari kiritildi (admin / admin)");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 mb-4 ring-8 ring-indigo-500/10">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">POStore Kassa</h1>
          <p className="text-slate-400 text-sm mt-1">Savdo va do'kon boshqaruv tizimi</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-900">Tizimga kirish</h2>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="admin / admin ma'lumotlarini to'ldirish"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Avto-to'ldirish</span>
            </button>
          </div>
          <p className="text-slate-500 text-sm mb-6">Hisob ma'lumotlaringizni kiriting</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Foydalanuvchi nomi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="masalan: admin"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Password with Eye Icon */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                />
                {/* Eye button: Click to toggle OR hold down to view */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onTouchStart={() => setShowPassword(true)}
                  onTouchEnd={() => setShowPassword(false)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  title={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rish (bosib turing)'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-indigo-600" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Info & Active Server Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-indigo-900">
              <span className="font-semibold">Asosiy tizim hisobi:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">
                admin / admin
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700">Xavfsiz ulanish:</span>
                <p className="mt-0.5 leading-relaxed">
                  So'rovlar mahalliy Vite proksi orqali to'g'ridan-to'g'ri serverga xavfsiz yo'naltiriladi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
