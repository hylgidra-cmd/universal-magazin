import React from 'react';
import {
  ShoppingCart,
  Package,
  ReceiptText,
  BookOpen,
  LogOut,
  RotateCcw,
  UserCircle2,
  Store,
  Monitor,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { authService } from '../../services/authService';

export function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  currentRole = 'admin',
  onSync,
  syncing,
}) {
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
                    currentRole === 'director'
                      ? 'bg-purple-100 text-purple-700'
                      : currentRole === 'kassa'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {currentRole === 'director'
                    ? 'Direktor'
                    : currentRole === 'kassa'
                    ? 'Kassa'
                    : 'Admin'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 leading-tight block">
                {currentRole === 'director'
                  ? 'Direktor Nazorat va Tahlil Portali'
                  : currentRole === 'kassa'
                  ? 'Kassa Savdo Terminali'
                  : 'Universal Doʻkon Boshqaruvi'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1">
            {/* 1. KASSA TABS */}
            {currentRole === 'kassa' && (
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
            )}

            {/* 2. DIRECTOR TABS (Self-contained monitoring) */}
            {currentRole === 'director' && (
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span>Jonli Tahliliy Monitoring Portali</span>
              </div>
            )}

            {/* 3. ADMIN TABS (Clean: ONLY POS, Products, Orders, Debts — NO DIRECTOR TAB) */}
            {currentRole === 'admin' && (
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
            {/* ADMIN VIEW: Dedicated external links to Kassa and Director (NO switcher pills) */}
            {currentRole === 'admin' ? (
              <div className="flex items-center gap-1.5">
                <a
                  href="/director"
                  target="_blank"
                  rel="noreferrer"
                  title="Direktor havolasini ochish (/director)"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Direktor</span>
                  <ExternalLink className="w-3 h-3 text-purple-400" />
                </a>

                <a
                  href="/kassa"
                  target="_blank"
                  rel="noreferrer"
                  title="Kassa havolasini ochish (/kassa)"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kassa</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </div>
            ) : currentRole === 'kassa' ? (
              /* KASSA VIEW: Locked Cashier Badge */
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Monitor className="w-3.5 h-3.5" />
                <span>Kassa Terminali</span>
              </div>
            ) : (
              /* DIRECTOR VIEW: Locked Director Badge */
              <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <Briefcase className="w-3.5 h-3.5" />
                <span>Direktor Kabineti</span>
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
          ) : currentRole === 'director' ? (
            <div className="text-xs font-bold text-purple-700 py-1 px-2">
              Direktor Tahliliy Monitoring Portali
            </div>
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
