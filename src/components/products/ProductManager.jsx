import React, { useState, useMemo } from 'react';
import { ProductModal } from './ProductModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import { productService } from '../../services/productService';
import { useToast } from '../ui/Toast';
import { formatCurrency, getUnitLabel } from '../../utils/formatters';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Zap,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
} from 'lucide-react';

export function ProductManager({ products = [], categories = [], onProductsUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const toast = useToast();

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (statusFilter === 'ACTIVE' && !p.is_active) return false;
      if (statusFilter === 'INACTIVE' && p.is_active) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchBarcode = p.barcode?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        if (!matchName && !matchBarcode && !matchDesc) return false;
      }
      return true;
    });
  }, [products, selectedCategory, statusFilter, searchTerm]);

  const handleEdit = (prod) => {
    setSelectedProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleDelete = async (prod) => {
    const confirmed = window.confirm(
      `"${prod.name}" mahsulotini o'chirishni tasdiqlaysizmi?\n\nDIQQAT: Ushbu mahsulot bilan bog'liq buyurtmalar tarixi ham o'chishi mumkin!`
    );
    if (!confirmed) return;

    setDeletingId(prod.id);
    try {
      await productService.deleteProduct(prod.id);
      toast.success(`"${prod.name}" muvaffaqiyatli o'chirildi`);
      onProductsUpdated();
    } catch (err) {
      toast.error(err.message || "Mahsulotni o'chirishda xatolik");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (prod) => {
    try {
      await productService.updateProduct(prod.id, { is_active: !prod.is_active });
      toast.success(`Mahsulot holati: ${!prod.is_active ? 'Faol' : 'Nofaol'}`);
      onProductsUpdated();
    } catch (err) {
      toast.error(err.message || "Holatni o'zgartirishda xatolik");
    }
  };

  const handleQuickStock = async (prod, delta) => {
    const newStock = Math.max(0, (prod.stock_quantity ?? 0) + delta);
    try {
      await productService.updateStock(prod.id, newStock);
      onProductsUpdated();
    } catch (err) {
      toast.error(err.message || "Qoldiqni yangilashda xatolik");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mahsulotlar va Ombor</h1>
          <p className="text-xs text-slate-500 mt-1">
            Barcha tovarlar, narxlar, qoldiqlar va kategoriyalarni boshqarish
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Kategoriyalar ({categories.length})</span>
          </button>

          <button
            onClick={handleCreate}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi mahsulot</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nomi, shtrix-kodi bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          >
            <option value="ALL">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          >
            <option value="ALL">Barcha holatlar</option>
            <option value="ACTIVE">Faqat faol</option>
            <option value="INACTIVE">Faqat nofaol</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Mahsulot</th>
                <th className="px-4 py-3.5">Kategoriya</th>
                <th className="px-4 py-3.5">Shtrix-kod</th>
                <th className="px-4 py-3.5">Birlik</th>
                <th className="px-4 py-3.5 text-right">Sotuv narxi</th>
                <th className="px-4 py-3.5 text-right">Tannarx</th>
                <th className="px-4 py-3.5 text-center">Ombor qoldig'i</th>
                <th className="px-4 py-3.5 text-center">Tezkor</th>
                <th className="px-4 py-3.5 text-center">Holat</th>
                <th className="px-5 py-3.5 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Hech qanday mahsulot topilmadi
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stock = p.stock_quantity ?? 0;
                  const categoryName = categoryMap[p.category] || '-';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{p.description}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                          {categoryName}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                        {p.barcode || '-'}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {getUnitLabel(p.unit)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {formatCurrency(p.sell_price)}
                      </td>

                      <td className="px-4 py-3.5 text-right text-xs text-slate-400">
                        {formatCurrency(p.cost_price)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                          <button
                            onClick={() => handleQuickStock(p, -1)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-white text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span
                            className={`text-xs font-bold px-1.5 ${
                              stock > 10
                                ? 'text-emerald-700'
                                : stock > 0
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {stock}
                          </span>
                          <button
                            onClick={() => handleQuickStock(p, 1)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-white text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {p.is_fast_button ? (
                          <span className="inline-flex p-1 bg-amber-50 text-amber-600 rounded-md" title="Tezkor tugma">
                            <Zap className="w-4 h-4 fill-amber-500" />
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className="cursor-pointer"
                          title={p.is_active ? 'Faol' : 'Nofaol'}
                        >
                          {p.is_active ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-300" />
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deletingId === p.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs font-medium text-slate-500 flex items-center justify-between">
          <span>Ko'rsatilgan mahsulotlar: {filteredProducts.length} ta</span>
          <span>Jami mahsulotlar: {products.length} ta</span>
        </div>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        categories={categories}
        onProductSaved={onProductsUpdated}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesUpdated={onProductsUpdated}
      />
    </div>
  );
}
