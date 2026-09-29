import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { productService } from '../../services/productService';
import { useToast } from '../ui/Toast';
import { Barcode, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { playScannerBeep } from '../../utils/scannerAudio';

export function ProductModal({ isOpen, onClose, product, categories = [], onProductSaved }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: 'ITEM',
    barcode: '',
    cost_price: '0.00',
    sell_price: '0.00',
    stock_quantity: 0,
    is_fast_button: false,
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const toast = useToast();
  const isEditing = Boolean(product);

  const barcodeInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const sellPriceInputRef = useRef(null);

  // Auto-focus barcode input when modal opens for brand new product
  useEffect(() => {
    if (isOpen) {
      setLastScanned(null);
      const timer = setTimeout(() => {
        if (!product) {
          barcodeInputRef.current?.focus();
        } else {
          nameInputRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, product]);

  // Hardware USB Barcode scanner listener
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e) => {
      // If user is inside a textarea, do not intercept
      if (e.target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      if (e.key === 'Enter') {
        // Fast keyboard wedge signature from USB scanner or Barcode to PC app
        if (buffer.length >= 3 && timeDiff < 100) {
          e.preventDefault();
          e.stopPropagation();
          const cleanCode = buffer.trim();
          setFormData((prev) => ({ ...prev, barcode: cleanCode }));
          setLastScanned(cleanCode);
          playScannerBeep('success');
          toast.success(`⚡ Lazer skanerdan o'qildi: ${cleanCode}`);
          buffer = '';

          // Auto move focus to product name if empty, otherwise to sell price
          setTimeout(() => {
            if (!formData.name.trim()) {
              nameInputRef.current?.focus();
            } else {
              sellPriceInputRef.current?.focus();
            }
          }, 50);
          return;
        }
        buffer = '';
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff > 80) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
        lastKeyTime = currentTime;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, formData.name, toast]);

  const generateRandomBarcode = () => {
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
    const code = `200${randomDigits}`.slice(0, 13);
    setFormData((prev) => ({ ...prev, barcode: code }));
    setLastScanned(code);
    playScannerBeep('success');
    toast.info(`Yangi ichki shtrix-kod yaratildi: ${code}`);
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const code = formData.barcode.trim();
      if (code) {
        playScannerBeep('success');
        setLastScanned(code);
        toast.success(`Shtrix-kod qabul qilindi: ${code}`);
        if (!formData.name.trim()) {
          nameInputRef.current?.focus();
        } else {
          sellPriceInputRef.current?.focus();
        }
      }
    }
  };

  useEffect(() => {
    const defaultCat = categories[0]?.id || '';
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || defaultCat,
        unit: product.unit || 'ITEM',
        barcode: product.barcode || '',
        cost_price: product.cost_price || '0.00',
        sell_price: product.sell_price || '0.00',
        stock_quantity: product.stock_quantity ?? 0,
        is_fast_button: Boolean(product.is_fast_button),
        is_active: product.is_active !== undefined ? Boolean(product.is_active) : true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: defaultCat,
        unit: 'ITEM',
        barcode: '',
        cost_price: '0.00',
        sell_price: '0.00',
        stock_quantity: 10,
        is_fast_button: false,
        is_active: true,
      });
    }
  }, [product, categories, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.warning("Mahsulot nomini kiriting");
      return;
    }

    const catToUse = formData.category || categories[0]?.id;
    if (!catToUse) {
      toast.warning("Avval kamida bitta kategoriya yarating!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        category: catToUse,
        description: formData.description.trim() || formData.name.trim(),
      };

      if (isEditing) {
        await productService.updateProduct(product.id, payload);
        toast.success(`"${formData.name}" ma'lumotlari yangilandi`);
      } else {
        await productService.createProduct(payload);
        toast.success(`"${formData.name}" mahsuloti yaratildi`);
      }
      onProductSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || "Mahsulotni saqlashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mahsulot nomi <span className="text-rose-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="masalan: Coca-Cola 1.5L"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kategoriya <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              {categories.length === 0 ? (
                <option value="" disabled>Kategoriyalar mavjud emas</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              O'lchov birligi <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="ITEM">Dona (ITEM)</option>
              <option value="KG">Kilogramm (KG)</option>
              <option value="LITER">Litr (LITER)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-indigo-600" />
                <span>Shtrix-kod (Barcode / QR)</span>
              </label>
              <button
                type="button"
                onClick={generateRandomBarcode}
                title="Do'kon ichki shtrix-kodini avtomatik yaratish"
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Yangi kod</span>
              </button>
            </div>
            <div className="relative">
              <input
                ref={barcodeInputRef}
                type="text"
                value={formData.barcode}
                onChange={(e) => {
                  setFormData({ ...formData, barcode: e.target.value });
                  setLastScanned(null);
                }}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="USB skaner bilan bosing yoki raqam yozing"
                className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {formData.barcode && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, barcode: '' });
                    setLastScanned(null);
                    barcodeInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-2 px-2 py-0.5 text-xs text-slate-400 hover:text-rose-600 font-bold rounded cursor-pointer"
                >
                  Tozalash
                </button>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                USB Lazer apparat ulangan: tovardagi kodni bosing, avtomatik tushadi
              </span>
              {lastScanned && (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Qabul qilindi
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ombordagi qoldiq
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tannarx (Keltirilgan narx)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sotuv narxi <span className="text-rose-500">*</span>
            </label>
            <input
              ref={sellPriceInputRef}
              type="number"
              step="any"
              min="0"
              required
              value={formData.sell_price}
              onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tavsifi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mahsulot haqida qisqacha ma'lumot..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_fast_button}
                onChange={(e) => setFormData({ ...formData, is_fast_button: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">
                Tezkor tugma (Kassada alohida ko'rsatilsin)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">
                Faol mahsulot (Sotuvga ruxsat)
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {loading ? 'Saqlanmoqda...' : isEditing ? "O'zgarishlarni saqlash" : "Yaratish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
