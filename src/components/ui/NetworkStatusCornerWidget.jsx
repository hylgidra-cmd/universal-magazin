import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { offlineSyncService } from '../../services/offlineSyncService';
import { useToast } from './Toast';

const REFRESH_INTERVAL_SECONDS = 10 * 60; // 10 minutes

export function NetworkStatusCornerWidget({ onRefreshCatalog }) {
  const [isOnline, setIsOnline] = useState(() => offlineSyncService.isOnline());
  const [pendingOrders, setPendingOrders] = useState(() => offlineSyncService.getPendingOrders().length);
  const [secondsRemaining, setSecondsRemaining] = useState(REFRESH_INTERVAL_SECONDS);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const toast = useToast();

  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  // Real connection ping test
  const verifyConnection = async (isSilent = false) => {
    const online = await offlineSyncService.checkRealConnection();
    if (online !== isOnlineRef.current) {
      setIsOnline(online);
      if (!online) {
        toast.warning("🔴 DIQQAT: Internet uzildi! Kassa avtonom (offline) rejimda ishlaydi.", 5000);
      } else {
        toast.success("🟢 Internet aloqasi tiklandi! Server bilan aloqa o'rnatildi.", 4000);
      }
    }
    return online;
  };

  // Perform full refresh (sync + catalog reload)
  const triggerRefresh = async (manual = false) => {
    setIsSyncing(true);
    const online = await verifyConnection(true);

    if (online) {
      try {
        // Sync pending offline orders if any
        const syncResult = await offlineSyncService.syncPendingOrders().catch(() => ({ syncedCount: 0, failedCount: 0 }));
        if (syncResult.syncedCount > 0) {
          toast.success(`✅ ${syncResult.syncedCount} ta offline chek serverga yuklandi!`, 3500);
        }
        setPendingOrders(syncResult.failedCount || 0);

        // Refresh catalog
        if (onRefreshCatalog) {
          await onRefreshCatalog();
        }

        setLastRefreshedAt(new Date());
        setSecondsRemaining(REFRESH_INTERVAL_SECONDS);
        if (manual) {
          toast.success("Ma'lumotlar yangilandi (10 min taymer qayta boshlandi)", 2500);
        }
      } catch (err) {
        console.warn('Refresh error:', err);
      }
    } else {
      if (manual) {
        toast.warning("Internet yo'q. Qayta ulanish kutilmoqda...", 3000);
      }
    }
    setIsSyncing(false);
  };

  // 1. Regular ping check every 8 seconds to detect offline instantly
  useEffect(() => {
    verifyConnection(true);

    const pingInterval = setInterval(() => {
      verifyConnection(true);
    }, 8000);

    const handleWindowOnline = () => {
      verifyConnection();
    };

    const handleWindowOffline = () => {
      setIsOnline(false);
      toast.warning("🔴 DIQQAT: Internet aloqasi uzildi!", 5000);
    };

    const handleQueueUpdated = (e) => {
      setPendingOrders(e.detail?.count || 0);
    };

    window.addEventListener('online', handleWindowOnline);
    window.addEventListener('offline', handleWindowOffline);
    window.addEventListener('offline-orders-updated', handleQueueUpdated);

    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('online', handleWindowOnline);
      window.removeEventListener('offline', handleWindowOffline);
      window.removeEventListener('offline-orders-updated', handleQueueUpdated);
    };
  }, []);

  // 2. Countdown timer for 10-minute auto refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          triggerRefresh(false);
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time mm:ss
  const formatCountdown = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatClock = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 font-sans select-none ${
        isExpanded ? 'w-80' : 'w-auto'
      }`}
    >
      {/* Expanded Card */}
      {isExpanded ? (
        <div
          className={`rounded-2xl shadow-2xl border backdrop-blur-md p-4 transition-all ${
            isOnline
              ? 'bg-white/95 text-slate-800 border-slate-200 shadow-indigo-900/10'
              : 'bg-rose-950/95 text-white border-rose-500 shadow-rose-950/50 ring-4 ring-rose-500/30 animate-pulse'
          }`}
        >
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 border-b pb-2.5 mb-2.5 border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-600 text-white animate-bounce'
                }`}
              >
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-black tracking-tight ${
                      isOnline ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {isOnline ? '🌐 TIZIM ONLINE' : '🔴 OFFLINE (INTERNET YO‘Q)'}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400 animate-ping'
                    }`}
                  />
                </div>
                <div className="text-[10px] opacity-75">
                  {isOnline ? 'Doimiy server aloqasi faol' : 'Kassa avtonom rejimda ishlamoqda'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg hover:bg-black/10 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
              title="Kichraytirish"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Body stats */}
          <div className="space-y-2 text-xs">
            {/* 10-minute auto refresh timer row */}
            <div
              className={`flex items-center justify-between p-2 rounded-xl ${
                isOnline ? 'bg-slate-50 text-slate-700' : 'bg-rose-900/60 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 opacity-70" />
                <span className="text-[11px] font-medium">10 daqiqalik avto-yangilanish:</span>
              </div>
              <span className="font-mono font-black text-xs">
                {formatCountdown(secondsRemaining)}
              </span>
            </div>

            {/* Offline orders queue warning if any */}
            {pendingOrders > 0 && (
              <div className="flex items-center justify-between p-2 bg-amber-500/20 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-400/30">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Kutilayotgan cheklar:</span>
                </div>
                <span className="font-black px-2 py-0.5 bg-amber-500 text-white rounded-md text-[11px]">
                  {pendingOrders} ta
                </span>
              </div>
            )}

            {/* Last updated clock */}
            <div className="flex items-center justify-between text-[10px] opacity-70 px-1">
              <span>Oxirgi tekshirish:</span>
              <span className="font-mono font-semibold">{formatClock(lastRefreshedAt)}</span>
            </div>

            {/* Action button */}
            <button
              onClick={() => triggerRefresh(true)}
              disabled={isSyncing}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 ${
                isOnline
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? 'Yangilanmoqda...'
                  : isOnline
                  ? 'Hozir Yangilash'
                  : 'Aloqani Qayta Tekshirish'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed Mini Floating Pill */
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2 p-2.5 px-3.5 rounded-full shadow-2xl border backdrop-blur-md cursor-pointer transition-all active:scale-95 ${
            isOnline
              ? 'bg-white/95 text-slate-800 border-slate-200 hover:bg-white shadow-indigo-900/15'
              : 'bg-rose-600 text-white border-rose-400 hover:bg-rose-700 shadow-rose-950/40 ring-4 ring-rose-500/30 animate-pulse'
          }`}
          title="Holat panelini ochish"
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-white animate-ping'
            }`}
          />
          <span className="text-xs font-black">
            {isOnline ? 'Online' : 'OFFLINE!'}
          </span>
          <span className="text-[11px] font-mono opacity-80 pl-1 border-l border-current/20">
            {formatCountdown(secondsRemaining)}
          </span>
          {pendingOrders > 0 && (
            <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
              {pendingOrders}
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 opacity-60" />
        </button>
      )}
    </div>
  );
}
