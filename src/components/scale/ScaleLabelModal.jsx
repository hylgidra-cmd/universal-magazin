import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import {
  Scale,
  Printer,
  Barcode as BarcodeIcon,
  QrCode,
  Check,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Copy,
  Tag,
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { formatCurrency } from '../../utils/formatters';
import { generateWeightBarcode } from '../../utils/weightBarcode';
import { useToast } from '../ui/Toast';

export function ScaleLabelModal({
  isOpen,
  onClose,
  products = [],
  onAddToCart,
}) {
  const toast = useToast();

  // Filter only weighed products (KG, LITER, or all if none)
  const weighedProducts = products.filter((p) => p.unit === 'KG' || p.unit === 'LITER');
  const availableProducts = weighedProducts.length > 0 ? weighedProducts : products;

  const [selectedProductId, setSelectedProductId] = useState(availableProducts[0]?.id || '');
  const [weightKg, setWeightKg] = useState('1.000');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const barcodeSvgRef = useRef(null);

  const selectedProduct = availableProducts.find((p) => p.id === Number(selectedProductId)) || availableProducts[0];

  const weightNum = parseFloat(weightKg) || 0;
  const pricePerKg = Number(selectedProduct?.sell_price) || 0;
  const totalPrice = Math.round(weightNum * pricePerKg);

  // Generate EAN-13 weight-embedded barcode (e.g. 220113014506)
  const generatedBarcode = selectedProduct ? generateWeightBarcode(selectedProduct.id, weightNum) : '';

  // Render JsBarcode and QRCode
  useEffect(() => {
    if (!isOpen || !selectedProduct || !generatedBarcode) return;

    // Render 1D Barcode
    if (barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, generatedBarcode, {
          format: 'EAN13',
          lineColor: '#000',
          width: 2,
          height: 48,
          displayValue: true,
          fontSize: 13,
          font: 'monospace',
          margin: 4,
        });
      } catch (err) {
        // Fallback to CODE128 if EAN13 length differs
        try {
          JsBarcode(barcodeSvgRef.current, generatedBarcode, {
            format: 'CODE128',
            width: 2,
            height: 48,
            displayValue: true,
          });
        } catch (e) {
          console.error('Barcode render error:', e);
        }
      }
    }

    // Render 2D QR Code
    const qrPayload = JSON.stringify({
      id: selectedProduct.id,
      name: selectedProduct.name,
      weight: weightNum,
      price: totalPrice,
      barcode: generatedBarcode,
    });

    QRCode.toDataURL(qrPayload, { width: 140, margin: 1 }, (err, url) => {
      if (!err && url) {
        setQrDataUrl(url);
      }
    });
  }, [isOpen, selectedProduct, generatedBarcode, weightNum, totalPrice]);

  const handlePrintLabel = () => {
    window.print();
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(generatedBarcode);
    toast.success(`Shtrix-kod nusxalandi: ${generatedBarcode}`);
  };

  const handleDirectAdd = () => {
    if (!selectedProduct || weightNum <= 0) return;
    if (onAddToCart) {
      onAddToCart(selectedProduct, weightNum);
      toast.success(`"${selectedProduct.name}" (${weightNum} kg) savatga qo'shildi`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tarozi & Kiloli Tovar Etiketkasi (Termo-Nakleyka)"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Top Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Select Product */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-600" />
              <span>Kiloli Tovarni Tanlang</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.sell_price)} / {p.unit || 'kg'}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              1 kg narxi: <strong className="text-slate-700">{formatCurrency(pricePerKg)}</strong>
            </span>
          </div>

          {/* 2. Weight input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>Oʻlchangan Vazn (Kilogramm)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.005"
                min="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="masalan: 1.450"
                className="w-full pl-4 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                KG
              </span>
            </div>

            {/* Quick weight pills */}
            <div className="flex items-center gap-1.5 mt-2">
              {['0.250', '0.500', '1.000', '1.500', '2.000'].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeightKg(w)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    weightKg === w
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {w} kg
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Calculation Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
              Hisoblangan Jami Qiymat
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight mt-0.5">
              {formatCurrency(totalPrice)}
            </div>
            <span className="text-xs text-indigo-100 mt-1 block">
              Formula: {weightNum} kg × {formatCurrency(pricePerKg)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onAddToCart && (
              <button
                type="button"
                onClick={handleDirectAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Savatga Qoʻshish</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyBarcode}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-white/20"
              title="Kassada test qilish uchun shtrix-kodni nusxalash"
            >
              <Copy className="w-4 h-4" />
              <span>Kodni Nusxalash</span>
            </button>
          </div>
        </div>

        {/* Thermal Sticky Label Preview (58mm x 40mm Standard Stiker) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-purple-600" />
              <span>Chiqariladigan Termo-Nakleyka (Stiker) Koʻrinishi:</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Standart 58×40mm oʻlcham
            </span>
          </div>

          {/* Label Container Printable */}
          <div className="p-4 bg-slate-100/80 rounded-2xl flex items-center justify-center">
            <div
              id="printable-thermal-label"
              className="w-80 bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 shadow-sm space-y-3 text-slate-900 font-sans"
            >
              {/* Store header */}
              <div className="text-center border-b border-slate-200 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  UNIVERSAL MAGAZIN
                </h4>
                <div className="text-[10px] text-slate-500">
                  Sana: {new Date().toLocaleDateString('uz-UZ')} {new Date().toLocaleTimeString().slice(0, 5)}
                </div>
              </div>

              {/* Product Info */}
              <div className="text-center space-y-0.5">
                <h3 className="text-sm font-black text-slate-900">
                  {selectedProduct?.name}
                </h3>
                <div className="text-xs text-slate-600 font-semibold">
                  1 kg narxi: {formatCurrency(pricePerKg)}
                </div>
              </div>

              {/* Big Weight & Total Price */}
              <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-200">
                <div className="text-xs font-bold text-slate-600">
                  VAZNI: <span className="text-sm font-black text-indigo-700">{weightNum} kg</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  SUMMA: {formatCurrency(totalPrice)}
                </div>
              </div>

              {/* Barcode and QR */}
              <div className="flex flex-col items-center justify-center pt-1 space-y-2">
                <svg ref={barcodeSvgRef} className="w-full max-w-[240px]"></svg>
                {qrDataUrl && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 w-full justify-center">
                    <img src={qrDataUrl} alt="QR Code" className="w-14 h-14" />
                    <div className="text-[9px] text-slate-500 leading-tight">
                      <div>Kassa lazer skaneri</div>
                      <div>yoki QR skaner</div>
                      <div>uchun tayyor kod</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kassa ushbu shtrix-kodni skanerlaganda narx va vazn avtomatik chiqadi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Yopish
            </button>
            <button
              type="button"
              onClick={handlePrintLabel}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Stikerni Chop Etish</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
