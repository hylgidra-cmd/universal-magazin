import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useToast } from '../ui/Toast';
import { Lock, User, ArrowRight, ShieldCheck, Store, Eye, EyeOff, Shield, ShoppingCart, Briefcase } from 'lucide-react';

export function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const toast = useToast();

  const handleSelectRole = (roleKey, u, p) => {
    setSelectedRole(roleKey);
    setUsername(u);
    setPassword(p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.warning('Login va parolni kiriting');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(username.trim(), password.trim());
      const roleName = user.role === 'CASHIER' ? 'Kassa' : user.role === 'DIRECTOR' ? 'Direktor' : 'Admin';
      toast.success(`Xush kelibsiz, ${user.first_name || user.username}! (${roleName})`);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      toast.error(err.message || 'Login yoki parol noto‘g‘ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 mb-3 ring-8 ring-indigo-500/10">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">POStore Kassa & Savdo</h1>
          <p className="text-slate-400 text-sm mt-1">Avtomatlashtirilgan do'kon boshqaruv tizimi</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Tizimga kirish</h2>
            <p className="text-slate-500 text-xs mt-0.5">Hisobingizni tanlang yoki login/parolni kiriting</p>
          </div>

          {/* Quick Role Switcher Pills */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => handleSelectRole('admin', 'admin', 'admin')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Shield className="w-4 h-4 mb-1" />
              <span>👑 Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('kassa', 'kassa', 'kassa123')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'kassa'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShoppingCart className="w-4 h-4 mb-1" />
              <span>🛒 Kassa</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('director', 'director', '1234')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'director'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Briefcase className="w-4 h-4 mb-1" />
              <span>📊 Direktor</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Foydalanuvchi nomi (Login)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setSelectedRole('');
                  }}
                  placeholder="masalan: kassa yoki admin"
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
              className={`w-full mt-2 py-3.5 px-4 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 ${
                selectedRole === 'kassa'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : selectedRole === 'director'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {selectedRole === 'kassa'
                      ? 'Kassir sifatida kirish'
                      : selectedRole === 'director'
                      ? 'Direktor kabinetiga kirish'
                      : 'Admin sifatida kirish'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Info & Active Server Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Mavjud hisoblar:
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <div
                onClick={() => handleSelectRole('admin', 'admin', 'admin')}
                className="bg-indigo-50/80 p-2 rounded-lg border border-indigo-100 text-indigo-900 cursor-pointer hover:bg-indigo-100"
              >
                <div className="font-bold">👑 Admin:</div>
                <div className="font-mono text-[10px] text-slate-600">admin / admin</div>
              </div>
              <div
                onClick={() => handleSelectRole('kassa', 'kassa', 'kassa123')}
                className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-100 text-emerald-900 cursor-pointer hover:bg-emerald-100"
              >
                <div className="font-bold">🛒 Kassa:</div>
                <div className="font-mono text-[10px] text-slate-600">kassa / kassa123</div>
              </div>
              <div
                onClick={() => handleSelectRole('director', 'director', '1234')}
                className="bg-purple-50/80 p-2 rounded-lg border border-purple-100 text-purple-900 cursor-pointer hover:bg-purple-100"
              >
                <div className="font-bold">📊 Direktor:</div>
                <div className="font-mono text-[10px] text-slate-600">director / 1234</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Har bir xodim o'z roli bo'yicha cheklangan huquqlarga ega bo'ladi.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
