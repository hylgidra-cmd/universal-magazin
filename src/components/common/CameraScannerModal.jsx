import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

export function CameraScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Shtrix-kod / QR-kod skaneri",
}) {
  const [errorMsg, setErrorMsg] = useState(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const readerElementId = 'html5-qr-reader-box';

    const startScanner = async () => {
      try {
        setErrorMsg(null);
        const html5QrCode = new Html5Qrcode(readerElementId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.floor(minEdge * 0.75);
            return {
              width: edgeSize,
              height: Math.floor(edgeSize * 0.7),
            };
          },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
            onScanSuccess(decodedText);
            stopScanner();
            onClose();
          },
          () => {
            // ignore continuous scanning attempts
          }
        );
      } catch (err) {
        console.error('Camera scan error:', err);
        if (isMounted) {
          setErrorMsg(
            "Kamerani ishga tushirishda xatolik. Iltimos, brauzerda kameraga ruxsat (Permission) berilganligini tekshiring."
          );
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (e) {
      console.warn('Error stopping camera scanner:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center">
          <div className="w-full bg-slate-950 rounded-2xl overflow-hidden relative min-h-[260px] flex items-center justify-center">
            <div id="html5-qr-reader-box" className="w-full" />
          </div>

          <p className="text-xs text-slate-500 text-center mt-3">
            Kamerani mahsulot shtrix-kodiga yoki QR-kodiga toʻgʻrilang. Tizim avtomatik taniydi.
          </p>

          {errorMsg && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 w-full">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
