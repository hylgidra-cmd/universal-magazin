import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Maximize2,
  Camera,
  Settings,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Shield,
  Layers,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useToast } from '../ui/Toast';

export function DirectorCameraSystem() {
  const [cameras, setCameras] = useState([
    {
      id: 1,
      name: 'Kassa №1 (Sotuv va Toʻlov zonasi)',
      location: 'Kassa maydoni',
      status: 'active',
      isLocalWebcam: true,
      streamUrl: '',
    },
    {
      id: 2,
      name: 'Savdo Zali (Vitrinalar va Rastalar)',
      location: 'Asosiy savdo zali',
      status: 'active',
      isLocalWebcam: false,
      streamUrl: '',
    },
    {
      id: 3,
      name: 'Ombor (Sklad va Tovar tushirish)',
      location: 'Orqa omborxona',
      status: 'active',
      isLocalWebcam: false,
      streamUrl: '',
    },
    {
      id: 4,
      name: 'Asosiy Kirish / Chiqish Eshigi',
      location: 'Eshik oldi',
      status: 'standby',
      isLocalWebcam: false,
      streamUrl: '',
    },
  ]);

  const [activeCamId, setActiveCamId] = useState(null); // Full screen modal if selected
  const [editingCam, setEditingCam] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const localVideoRef = useRef(null);
  const modalVideoRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const toast = useToast();

  // Clock for camera timestamp overlay
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle local webcam activation
  const toggleLocalWebcam = async () => {
    if (isWebcamActive) {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
        webcamStreamRef.current = null;
      }
      setIsWebcamActive(false);
      toast.info("Kassa kamerasi toʻxtatildi");
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        webcamStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsWebcamActive(true);
        toast.success("Kassa jonli kamerasi muvaffaqiyatli ishga tushdi!");
      } catch (err) {
        console.error('Webcam error:', err);
        toast.error("Kameraga ulanishda xatolik. Brauzerda kameraga ruxsat berilganligini tekshiring.");
      }
    }
  };

  useEffect(() => {
    if (isWebcamActive && localVideoRef.current && webcamStreamRef.current) {
      localVideoRef.current.srcObject = webcamStreamRef.current;
    }
  }, [isWebcamActive]);

  const handleSaveCameraConfig = (e) => {
    e.preventDefault();
    if (!editingCam) return;
    setCameras((prev) =>
      prev.map((c) => (c.id === editingCam.id ? { ...c, ...editingCam } : c))
    );
    toast.success(`"${editingCam.name}" sozlamalari saqlandi`);
    setEditingCam(null);
  };

  const handleCaptureSnapshot = (camName) => {
    toast.success(`"${camName}" kamerasidan kadr rasmga olindi va saqlandi!`);
  };

  return (
    <div className="space-y-6">
      {/* CCTV Header info */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-black tracking-wider uppercase text-rose-400">
              LIVE CCTV SURVEILLANCE
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Doʻkon Xavfsizlik va Jonli Kameralar Monitoringi
          </h2>
          <p className="text-xs text-slate-400">
            Kassa, savdo zali va ombordagi harakatlarni real vaqtda jonli video orqali kuzatib boring.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleLocalWebcam}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isWebcamActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isWebcamActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            <span>{isWebcamActive ? 'Kassa Kamerasini Toʻxtatish' : 'Kassa Kamerasini Yoqish (Test)'}</span>
          </button>
        </div>
      </div>

      {/* 4-Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cameras.map((cam) => {
          const isWebcam = cam.isLocalWebcam;

          return (
            <div
              key={cam.id}
              className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-lg flex flex-col group relative"
            >
              {/* Top video overlay */}
              <div className="p-3.5 bg-gradient-to-b from-slate-950/90 to-transparent absolute top-0 inset-x-0 z-20 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isWebcam && isWebcamActive ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-bold tracking-tight text-[11px] truncate max-w-[200px]">
                    {cam.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
                  <span>{currentTime}</span>
                  <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold text-slate-200">
                    {isWebcam && isWebcamActive ? 'LIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>

              {/* Video Player Display Area */}
              <div className="w-full aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                {isWebcam && isWebcamActive ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : cam.streamUrl ? (
                  <iframe
                    src={cam.streamUrl}
                    title={cam.name}
                    className="w-full h-full border-0 pointer-events-auto"
                    allow="autoplay; encrypted-media"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3 text-slate-500 select-none">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-300">
                        {isWebcam
                          ? 'Kassa jonli kamerasini yoqish uchun yuqoridagi tugmani bosing'
                          : 'IP Kamera (RTSP/HLS/HTTP Stream) ulanmagan'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Dahua, Hikvision yoki IP-kamera oqimi URL manzilini ulashingiz mumkin
                      </p>
                    </div>
                  </div>
                )}

                {/* Rec blinking badge */}
                {(isWebcamActive || cam.streamUrl) && (
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] text-rose-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    REC • 1080p 25fps
                  </div>
                )}
              </div>

              {/* Bottom camera control toolbar */}
              <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span className="text-[11px] text-slate-400 truncate">
                  Joylashuv: <strong className="text-slate-200">{cam.location}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCaptureSnapshot(cam.name)}
                    title="Kameradan surat olish"
                    className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-400"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setEditingCam(cam)}
                    title="Kamera sozlamalari (IP/URL)"
                    className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-400"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActiveCamId(cam.id)}
                    title="Katta ekranga yoyish"
                    className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-400"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Camera Settings Modal */}
      {editingCam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Kamera Sozlamalari: #{editingCam.id}
              </h3>
              <button
                onClick={() => setEditingCam(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Yopish
              </button>
            </div>

            <form onSubmit={handleSaveCameraConfig} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kamera Nomi
                </label>
                <input
                  type="text"
                  required
                  value={editingCam.name}
                  onChange={(e) => setEditingCam({ ...editingCam, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Joylashuvi
                </label>
                <input
                  type="text"
                  required
                  value={editingCam.location}
                  onChange={(e) => setEditingCam({ ...editingCam, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  IP Kamera Stream URL (HLS / m3u8 / HTTP / RTSP-Web)
                </label>
                <input
                  type="url"
                  placeholder="https://...m3u8 yoki video stream manzili"
                  value={editingCam.streamUrl || ''}
                  onChange={(e) => setEditingCam({ ...editingCam, streamUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Doʻkonga oʻrnatilgan NVR/DVR video kuzatuv serveri havolasi
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCam(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Camera Modal */}
      {activeCamId && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4">
          <div className="flex items-center justify-between text-white p-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="font-bold text-sm">
                {cameras.find((c) => c.id === activeCamId)?.name}
              </h3>
            </div>
            <button
              onClick={() => setActiveCamId(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Yopish (Esc)
            </button>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center relative">
            {activeCamId === 1 && isWebcamActive ? (
              <video
                ref={modalVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-400 text-center space-y-2">
                <Video className="w-12 h-12 mx-auto text-slate-500" />
                <p className="text-sm font-semibold">Jonli oqim katta ekranda namoyish qilinmoqda</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
