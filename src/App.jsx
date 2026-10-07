import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ToastProvider, useToast } from './components/ui/Toast';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { PosTerminal } from './components/pos/PosTerminal';
import { ProductManager } from './components/products/ProductManager';
import { OrderHistory } from './components/orders/OrderHistory';
import { DebtTracker } from './components/debts/DebtTracker';
import { DirectorDashboard } from './components/director/DirectorDashboard';
import { AdminAiAnalytics } from './components/admin/AdminAiAnalytics';
import { authService } from './services/authService';
import { productService } from './services/productService';
import { categoryService } from './services/categoryService';
import { orderService } from './services/orderService';
import { DEMO_PRODUCTS, DEMO_CATEGORIES, DEMO_ORDERS } from './data/demoStoreData';

function getInitialRole(user) {
  if (user) {
    if (user.role === 'CASHIER' || user.username === 'kassa' || user.username === 'kassir') return 'kassa';
    if (user.role === 'DIRECTOR' || user.username === 'director') return 'director';
  }
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path.includes('director') || hash.includes('director')) return 'director';
  if (path.includes('kassa') || hash.includes('kassa')) return 'kassa';
  return 'admin';
}

function MainApp() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [currentRole, setCurrentRole] = useState(() => getInitialRole(authService.getCurrentUser()));
  const [activeTab, setActiveTab] = useState(() => {
    const role = getInitialRole(authService.getCurrentUser());
    return role === 'director' ? 'director' : 'pos';
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Listen for browser URL changes (back/forward navigation)
  useEffect(() => {
    const handleUrlChange = () => {
      const user = authService.getCurrentUser();
      const role = getInitialRole(user);
      setCurrentRole(role);
      if (role === 'director') setActiveTab('director');
      else if (role === 'kassa') setActiveTab('pos');
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Sync role and update URL
  const handleRoleChange = (newRole) => {
    if (currentUser?.role === 'CASHIER' || currentUser?.username === 'kassa') {
      if (newRole !== 'kassa') {
        toastRef.current.warning("Kassa xodimi uchun admin va direktor bo'limlari cheklangan.");
        return;
      }
    }
    setCurrentRole(newRole);
    window.history.pushState(null, '', `/${newRole}`);
    if (newRole === 'director') {
      setActiveTab('director');
    } else if (newRole === 'kassa') {
      setActiveTab('pos');
    } else {
      setActiveTab('pos');
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    const initialRole = getInitialRole(user);
    setCurrentRole(initialRole);
    if (initialRole === 'kassa') {
      setActiveTab('pos');
      window.history.replaceState(null, '', '/kassa');
    } else if (initialRole === 'director') {
      setActiveTab('director');
      window.history.replaceState(null, '', '/director');
    } else {
      setActiveTab('pos');
      window.history.replaceState(null, '', '/admin');
    }
  };

  useEffect(() => {
    const handleAuthChange = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    };
    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  const loadCatalog = useCallback(async (isSilent = false) => {
    if (!authService.isAuthenticated()) return;
    if (!isSilent) setLoadingInitial(true);
    else setSyncing(true);

    try {
      const [fetchedProducts, fetchedCategories, fetchedOrders] = await Promise.all([
        productService.getAllProducts().catch(() => []),
        categoryService.getAllCategories().catch(() => []),
        orderService.getAllOrders().catch(() => []),
      ]);
      setProducts(fetchedProducts || []);
      setCategories(fetchedCategories || []);
      setOrders(fetchedOrders || []);
      if (isSilent) toastRef.current.success("Ma'lumotlar yangilandi", 2000);
    } catch (err) {
      console.error('Failed to load catalog:', err);
      toastRef.current.error(err.message || "Katalog ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoadingInitial(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadCatalog();
    }
  }, [currentUser, loadCatalog]);

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onSync={() => loadCatalog(true)}
        syncing={syncing}
      />

      <main className="flex-1 pb-12">
        {loadingInitial ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-600">
              Katalog yuklanmoqda...
            </span>
          </div>
        ) : (
          <>
            {(() => {
              const displayProducts = products.length > 0 ? products : DEMO_PRODUCTS;
              const displayCategories = categories.length > 0 ? categories : DEMO_CATEGORIES;
              const displayOrders = orders.length > 0 ? orders : DEMO_ORDERS;

              return (
                <>
                  {activeTab === 'director' && (
                    <DirectorDashboard
                      products={displayProducts}
                      categories={displayCategories}
                      onRefresh={() => loadCatalog(true)}
                    />
                  )}

                  {activeTab === 'ai' && (
                    <AdminAiAnalytics
                      products={displayProducts}
                      orders={displayOrders}
                      onNavigateToProducts={() => setActiveTab('products')}
                      onNavigateToPos={() => setActiveTab('pos')}
                    />
                  )}

                  {activeTab === 'pos' && (
                    <PosTerminal
                      products={displayProducts}
                      categories={displayCategories}
                      onStockUpdated={() => loadCatalog(true)}
                    />
                  )}

                  {activeTab === 'products' && (
                    <ProductManager
                      products={displayProducts}
                      categories={displayCategories}
                      onProductsUpdated={() => loadCatalog(true)}
                      readOnly={currentRole === 'kassa' || currentRole === 'director'}
                    />
                  )}

                  {activeTab === 'orders' && (
                    <OrderHistory
                      products={displayProducts}
                      readOnly={currentRole === 'kassa' || currentRole === 'director'}
                    />
                  )}

                  {activeTab === 'debts' && (
                    <DebtTracker
                      readOnly={currentRole === 'kassa'}
                    />
                  )}
                </>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
