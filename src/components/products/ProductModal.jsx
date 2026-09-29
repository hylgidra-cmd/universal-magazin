import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { productService } from '../../services/productService';
import { useToast } from '../ui/Toast';
import { Barcode, Camera } from 'lucide-react';
import { CameraScannerModal } from '../common/CameraScannerModal';

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const toast = useToast();
  const isEditing = Boolean(product);

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
    <>
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Shtrix-kod (Barcode / QR)
              </label>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Kameradan skanerlash</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Skanerlang yoki qo'lda raqam kiriting"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                title="Kamerani ochish"
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
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

    <CameraScannerModal
      isOpen={isCameraOpen}
      onClose={() => setIsCameraOpen(false)}
      onScanSuccess={(code) => {
        setFormData((prev) => ({ ...prev, barcode: code }));
        toast.success(`Skanerlandi: ${code}`);
      }}
      title="Mahsulot shtrix-kodini skanerlash"
    />
  </>
  );
}
