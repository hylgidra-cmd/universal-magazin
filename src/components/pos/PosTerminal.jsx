import React, { useState, useEffect, useRef } from 'react';
import { FastButtons } from './FastButtons';
import { Cart } from './Cart';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { ScaleLabelModal } from '../scale/ScaleLabelModal';
import { Search, Barcode, Package, Scale } from 'lucide-react';
import { formatCurrency, getUnitLabel } from '../../utils/formatters';
import { parseWeightBarcode } from '../../utils/weightBarcode';
import { orderService } from '../../services/orderService';
import { useToast } from '../ui/Toast';

export function PosTerminal({ products = [], categories = [], onStockUpdated }) {
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);

  const barcodeInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cartItems.length > 0 && !isCheckoutOpen) {
          setIsCheckoutOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isCheckoutOpen]);

  const handleAddToCart = (product, quantityToAdd = 1) => {
    if (!product.is_active) {
      toast.warning("Ushbu mahsulot nofaol holatda");
      return;
    }

    const qty = Number(Number(quantityToAdd).toFixed(3));

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Number((item.quantity + qty).toFixed(3)) }
            : item
        );
      }
      return [...prev, { product, quantity: qty, price: product.sell_price }];
    });

    const unitStr = product.unit === 'KG' ? `${qty} kg` : `${qty} ta`;
    toast.info(`"${product.name}" (${unitStr}) savatga qo'shildi`, 1500);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    const qty = Number(Number(newQuantity).toFixed(3));
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (window.confirm("Savatni butunlay tozalashni tasdiqlaysizmi?")) {
      setCartItems([]);
    }
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const query = barcodeQuery.trim();
    if (!query) return;

    // 1. Check if scanned barcode is a weight-embedded barcode (EAN-13 starting with 22 or 2D QR)
    const weightParsed = parseWeightBarcode(query, products);
    if (weightParsed) {
      handleAddToCart(weightParsed.product, weightParsed.weightInKg);
      toast.success(
        `⚖️ Tarozi stikeri o'qildi: "${weightParsed.product.name}" (${weightParsed.weightInKg} kg — ${formatCurrency(weightParsed.totalPrice)})`,
        3000
      );
      setBarcodeQuery('');
      return;
    }

    // 2. Standard product barcode lookup
    const matched = products.find(
      (p) =>
        p.barcode === query ||
        p.id.toString() === query ||
        p.name.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      handleAddToCart(matched, 1);
      setBarcodeQuery('');
    } else {
      toast.error(`Shtrix-kod bo'yicha mahsulot topilmadi: "${query}"`);
    }
  };

  const categoryMap = React.useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (!p.is_active) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(query);
        const barcodeMatch = p.barcode?.toLowerCase().includes(query);
        const descMatch = p.description?.toLowerCase().includes(query);
        if (!nameMatch && !barcodeMatch && !descMatch) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchTerm]);

  const handleCompleteCheckout = async (paymentDetails) => {
    setIsProcessingCheckout(true);
    try {
      const res = await orderService.checkout({
        cartItems,
        paidCash: paymentDetails.paidCash,
        paidCard: paymentDetails.paidCard,
        paidDebt: paymentDetails.paidDebt,
        debtorUserId: paymentDetails.debtorUserId,
        autoDeductStock: true,
      });

      toast.success("Savdo muvaffaqiyatli yakunlandi!");

      const orderReceiptData = {
        order: res.order,
        items: cartItems.map((ci) => ({
          product: ci.product.id,
          product_name: ci.product.name,
          quantity: ci.quantity,
          price: ci.price || ci.product.sell_price,
        })),
        tenderedCash: paymentDetails.tenderedCash,
        changeDue: paymentDetails.changeDue,
      };

      setCompletedOrderData(orderReceiptData);
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      setCartItems([]);

      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-64 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Barcode className="w-5 h-5 text-indigo-500" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                placeholder="Shtrix-kod (Enter)"
                className="w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </form>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mahsulot nomi yoki tavsifi bo'yicha qidirish..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Tozalash
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsScaleModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              title="Tarozi orqali o'lchangan tovarlar uchun stiker etiketka chiqarish va shtrix-kod yaratish"
            >
              <Scale className="w-4 h-4 text-amber-300" />
              <span>Tarozi & Etiketka</span>
            </button>
          </div>

          <FastButtons products={products} onAddToCart={handleAddToCart} />

          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Barchasi ({products.filter((p) => p.is_active).length})
              </button>
              {categories.map((c) => {
                const count = products.filter((p) => p.category === c.id && p.is_active).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === c.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Mos mahsulotlar topilmadi</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const stock = product.stock_quantity ?? 0;
                const isOutOfStock = stock <= 0;
                const categoryName = categoryMap[product.category] || 'Umumiy';

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                    className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all group relative select-none ${
                      isOutOfStock
                        ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50/50'
                        : 'border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 active:scale-[0.98] cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1.5">
                        <span className="truncate">{categoryName}</span>
                        {product.barcode && (
                          <span className="font-mono text-[10px] text-slate-300">
                            #{product.barcode}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <div className="text-base font-extrabold text-slate-900">
                          {formatCurrency(product.sell_price)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          1 {getUnitLabel(product.unit)} uchun
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          stock > 10
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : stock > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {stock > 0 ? `${stock} ${getUnitLabel(product.unit)}` : 'Tugagan'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-4 sticky top-20">
          <Cart
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={() => setIsCheckoutOpen(true)}
          />
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onCompleteCheckout={handleCompleteCheckout}
        isProcessing={isProcessingCheckout}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        orderData={completedOrderData}
        onNewSale={() => {
          setIsReceiptOpen(false);
          setCompletedOrderData(null);
          barcodeInputRef.current?.focus();
        }}
      />

      <ScaleLabelModal
        isOpen={isScaleModalOpen}
        onClose={() => setIsScaleModalOpen(false)}
        products={products}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
