import React, { useState, useEffect, useRef } from 'react';
import { FastButtons } from './FastButtons';
import { Cart } from './Cart';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { Search, Barcode, Package, Zap } from 'lucide-react';
import { formatCurrency, getUnitLabel } from '../../utils/formatters';
import { orderService } from '../../services/orderService';
import { useToast } from '../ui/Toast';
import { playScannerBeep } from '../../utils/scannerAudio';

export function PosTerminal({ products = [], categories = [], onStockUpdated }) {
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const barcodeInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Global hardware barcode scanner listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
        return;
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cartItems.length > 0 && !isCheckoutOpen) {
          setIsCheckoutOpen(true);
        }
        return;
      }

      // If a modal is open, don't intercept scanner
      if (isCheckoutOpen || isReceiptOpen) return;

      // If user is actively typing in the manual text search input
      if (document.activeElement?.getAttribute('data-search-box') === 'true') {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      if (e.key === 'Enter') {
        // Fast keyboard wedge from USB scanner or Barcode to PC app
        if (buffer.length >= 2 && timeDiff < 100) {
          e.preventDefault();
          e.stopPropagation();
          const cleanCode = buffer.trim();
          buffer = '';

          const matched = products.find(
            (p) =>
              p.barcode === cleanCode ||
              p.id.toString() === cleanCode ||
              p.name.toLowerCase() === cleanCode.toLowerCase()
          );

          if (matched) {
            handleAddToCart(matched, 1);
            playScannerBeep('success');
            toast.success(`⚡ "${matched.name}" savatga qo'shildi`);
          } else {
            playScannerBeep('error');
            toast.error(`Shtrix-kod bazadan topilmadi: "${cleanCode}"`);
          }
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
  }, [products, cartItems.length, isCheckoutOpen, isReceiptOpen, toast]);

  const handleAddToCart = (product, quantityToAdd = 1) => {
    if (!product.is_active) {
      toast.warning("Ushbu mahsulot nofaol holatda");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }
      return [...prev, { product, quantity: quantityToAdd, price: product.sell_price }];
    });

    toast.info(`"${product.name}" savatga qo'shildi`, 1500);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
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

    const matched = products.find(
      (p) =>
        p.barcode === query ||
        p.id.toString() === query ||
        p.name.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      handleAddToCart(matched, 1);
      playScannerBeep('success');
      setBarcodeQuery('');
      barcodeInputRef.current?.focus();
    } else {
      playScannerBeep('error');
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
            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-80 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Barcode className="w-5 h-5 text-indigo-500" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                placeholder="Lazer skaner yoki kod (Enter)..."
                className="w-full pl-11 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200/60 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  USB Skaner
                </span>
              </div>
            </form>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                data-search-box="true"
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
    </div>
  );
}
