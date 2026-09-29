import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { categoryService } from '../../services/categoryService';
import { useToast } from '../ui/Toast';
import { Plus, Trash2, Edit2, AlertTriangle, Check, X, Tag } from 'lucide-react';

export function CategoryManagerModal({ isOpen, onClose, categories, onCategoriesUpdated }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      await categoryService.createCategory(newCategoryName.trim());
      toast.success(`"${newCategoryName}" kategoriyasi yaratildi`);
      setNewCategoryName('');
      onCategoriesUpdated();
    } catch (err) {
      toast.error(err.message || "Kategoriya yaratishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingCategory(cat);
    setEditName(cat.name);
  };

  const handleSaveEdit = async (cat) => {
    if (!editName.trim() || editName.trim() === cat.name) {
      setEditingCategory(null);
      return;
    }

    setLoading(true);
    try {
      await categoryService.updateCategory(cat.name, editName.trim());
      toast.success("Kategoriya nomi yangilandi");
      setEditingCategory(null);
      onCategoriesUpdated();
    } catch (err) {
      toast.error(err.message || "Kategoriyani yangilashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat) => {
    const confirmed = window.confirm(
      `DIQQAT! "${cat.name}" kategoriyasini o'chirmoqchimisiz?\n\nOgohlantirish: Ushbu kategoriyadagi barcha mahsulotlar ham o'chib ketadi!`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await categoryService.deleteCategory(cat.name);
      toast.success(`"${cat.name}" kategoriyasi o'chirildi`);
      onCategoriesUpdated();
    } catch (err) {
      toast.error(err.message || "Kategoriyani o'chirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kategoriyalar boshqaruvi" maxWidth="max-w-lg">
      <div className="space-y-6">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            required
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Yangi kategoriya nomi..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading || !newCategoryName.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Qo'shish</span>
          </button>
        </form>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Kategoriyani o'chirish unga biriktirilgan mahsulotlar va buyurtma tarixini o'chirishi mumkin (CASCADE).
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {categories.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Hali kategoriyalar mavjud emas</div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="py-3 flex items-center justify-between gap-3">
                {editingCategory?.id === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-indigo-400 rounded-lg text-sm font-medium"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(cat)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-800 text-sm">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
