import React, { useState } from 'react';
import {
  ShoppingCart,
  Package,
  ReceiptText,
  BookOpen,
  LogOut,
  RotateCcw,
  UserCircle2,
  Store,
  Shield,
  Monitor,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../ui/Toast';

export function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  currentRole = 'admin',
  onRoleChange,
  onSync,
  syncing,
}) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopyKassaLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/kassa`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(`Kassa havolasi nusxalandi: ${url}`, 2500);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 select-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 leading-none tracking-tight">
                  POStore
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    currentRole === 'kassa'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {currentRole === 'kassa' ? 'Kassa' : 'Admin'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 leading-tight block">
                {currentRole === 'kassa' ? 'Sotuvchi Terminali' : 'Doʻkon Boshqaruv Tizimi'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1">
            {/* KASSA MODE TABS */}
            {currentRole === 'kassa' ? (
              <>
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'pos'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Kassa (POS Terminal)</span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Ombor Qoldigʻi (Sklad)</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ReceiptText className="w-4 h-4" />
                  <span>Cheklarim</span>
                </button>
              </>
            ) : (
              /* ADMIN MODE TABS (NO DIRECTOR TAB) */
              <>
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'pos'
                      ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Kassa (POS)</span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Mahsulotlar va Ombor</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ReceiptText className="w-4 h-4" />
                  <span>Cheklar tarixi</span>
                </button>

                <button
                  onClick={() => setActiveTab('debts')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'debts'
                      ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Nasiya daftari</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Admin has Switch to Kassa and Copy Kassa link */}
            {currentRole === 'admin' ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onRoleChange('kassa')}
                  title="Kassir ekranini ochish (/kassa)"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Kassa Terminali</span>
                </button>

                <button
                  onClick={handleCopyKassaLink}
                  title="Kassa havolasini nusxalash (/kassa)"
                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ) : (
              /* Kassa view: Locked indicator with button to return to Admin if authorized */
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Kassa</span>
                </div>

                <button
                  onClick={() => onRoleChange('admin')}
                  title="Admin boshqaruviga qaytish"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              </div>
            )}

            {/* Sync button */}
            <button
              onClick={onSync}
              disabled={syncing}
              title="Yangilash"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${syncing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* User Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <UserCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.first_name || currentUser?.username || 'Foydalanuvchi'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                    {currentRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => authService.logout()}
              title="Tizimdan chiqish"
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile secondary tab navigation */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100">
          {currentRole === 'kassa' ? (
            <>
              <button
                onClick={() => setActiveTab('pos')}
                className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  activeTab === 'pos' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Kassa (POS)
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  activeTab === 'products' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Sklad Qoldigʻi
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Cheklarim
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('pos')}
                className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  activeTab === 'pos' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                }`}
              >
                Kassa
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  activeTab === 'products' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                }`}
              >
                Mahsulotlar
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                }`}
              >
                Cheklar
              </button>
              <button
                onClick={() => setActiveTab('debts')}
                className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  activeTab === 'debts' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                }`}
              >
                Nasiya
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
