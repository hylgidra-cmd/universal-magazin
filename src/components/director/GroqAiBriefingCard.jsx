import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  RotateCcw,
  Copy,
  Key,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { aiAnalyticsService } from '../../services/aiAnalyticsService';
import { useToast } from '../ui/Toast';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

export function GroqAiBriefingCard({ products = [], orders = [] }) {
  const toast = useToast();
  const [analysis, setAnalysis] = useState(() => aiAnalyticsService.getCachedAnalysis());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-fetch if no cached analysis exists
  useEffect(() => {
    if (!analysis && products.length > 0) {
      handleGenerate(false);
    }
  }, [products.length]);

  const handleGenerate = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiAnalyticsService.generateAnalysis({
        products,
        orders,
        forceRefresh,
      });
      setAnalysis(res);
      if (forceRefresh) {
        toast.success("🧠 Groq AI tahlili yangilandi!", 2500);
      }
    } catch (err) {
      console.error('Groq AI error:', err);
      setError(err.message || "AI tahlilini yuklashda xatolik yuz berdi");
      toast.error("AI tahlilida xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTelegram = () => {
    if (!analysis?.content) return;
    const dateStr = new Date().toLocaleDateString('uz-UZ');
    const msg = `🤖 UNIVERSAL MAGAZIN — GROQ AI KUNLIK TAHLILI\n📅 Sana: ${dateStr}\n------------------------------------\n\n${analysis.content}\n\n✅ Tizim: Universal Magazin Groq LLM`;
    navigator.clipboard.writeText(msg);
    toast.success("📋 AI tahlili nusxalandi! Telegramga yuborishingiz mumkin.");
  };

  const handleSaveCustomKey = (e) => {
    e.preventDefault();
    if (customKeyInput.trim()) {
      aiAnalyticsService.setApiKey(customKeyInput.trim());
      toast.success("Groq API kaliti yangilandi!");
      setShowKeyModal(false);
      handleGenerate(true);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 border-2 border-purple-500/30 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden space-y-5">
      {/* Background ambient glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-purple-500/30 shrink-0">
            <Bot className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Groq AI (Jonli Sunʼiy Intellekt)</span>
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Har Kungi Tovar Tahlili</span>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
              Tugayotgan Tovarlar va Kunlik Zakup Tahlili
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            title="Groq AI dan yangi tahlil olish"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'AI Tahlil Qilmoqda...' : 'Qayta Tahlil Qilish'}</span>
          </button>

          {analysis && (
            <button
              type="button"
              onClick={handleCopyTelegram}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              title="Telegramga nusxalash"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Telegramga</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-all cursor-pointer"
            title={isExpanded ? 'Yigʻish' : 'Kengaytirish'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-300">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <span className="text-sm font-bold text-white block">
              Groq AI doʻkon mahsulotlarini tahlil qilmoqda...
            </span>
            <span className="text-xs text-slate-400">
              Kam qolgan tovarlar, sotuv tezligi va xarid tavsiyalari hisoblanmoqda
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-100">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>AI Tahlilini yuklashda xatolik:</span>
          </div>
          <p>{error}</p>
          <button
            onClick={() => handleGenerate(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs cursor-pointer mt-2"
          >
            Qayta urinib koʻrish
          </button>
        </div>
      ) : analysis?.content ? (
        isExpanded && (
          <div className="space-y-4">
            {/* Formatted Markdown AI Output Container */}
            <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-inner text-xs sm:text-sm">
              <MarkdownRenderer content={analysis.content} />
            </div>

            {/* Footer metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Tahlil vaqti: {new Date(analysis.timestamp).toLocaleTimeString('uz-UZ').slice(0, 5)} | Sana: {analysis.date}
                </span>
                {analysis.model && (
                  <span className="bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-md font-mono text-[10px] border border-purple-700/50">
                    Model: {analysis.model}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="text-[11px] text-slate-400 hover:text-amber-300 underline cursor-pointer flex items-center gap-1"
              >
                <Key className="w-3 h-3" />
                <span>API kalit sozlamalari</span>
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="py-8 text-center text-slate-400 space-y-2">
          <p className="text-sm">Hozircha tahlil mavjud emas.</p>
          <button
            onClick={() => handleGenerate(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            AI Tahlilni Boshlash
          </button>
        </div>
      )}

      {/* Modal to configure custom Groq API Key if needed */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full text-slate-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-600" />
                <span>Groq API Kalitini Sozlash</span>
              </h4>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tizim hozirda Groq API kaliti bilan toʻliq ulangan. Agar kelajakda yangi kalit kiritmoqchi boʻlsangiz, quyida kiritishingiz mumkin:
            </p>

            <form onSubmit={handleSaveCustomKey} className="space-y-3">
              <input
                type="text"
                value={customKeyInput}
                onChange={(e) => setCustomKeyInput(e.target.value)}
                placeholder="gsk_..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer shadow-md"
                >
                  Saqlash va Tekshirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

