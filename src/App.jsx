import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ToastProvider, useToast } from './components/ui/Toast';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { PosTerminal } from './components/pos/PosTerminal';
import { ProductManager } from './components/products/ProductManager';
import { OrderHistory } from './components/orders/OrderHistory';
import { DebtTracker } from './components/debts/DebtTracker';
import { authService } from './services/authService';
import { productService } from './services/productService';
import { categoryService } from './services/categoryService';

function getInitialRole() {
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (host.startsWith('kassa') || path.includes('kassa') || hash.includes('kassa')) return 'kassa';
  return 'admin';
}

function MainApp() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [currentRole, setCurrentRole] = useState(getInitialRole);
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Listen for browser URL changes (back/forward navigation)
  useEffect(() => {
    const handleUrlChange = () => {
      const role = getInitialRole();
      setCurrentRole(role);
      setActiveTab('pos');
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
    setCurrentRole(newRole);
    window.history.pushState(null, '', `/${newRole}`);
    setActiveTab('pos');
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
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
      ]);
      setProducts(fetchedProducts || []);
      setCategories(fetchedCategories || []);
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
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
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
            {activeTab === 'pos' && (
              <PosTerminal
                products={products}
                categories={categories}
                onStockUpdated={() => loadCatalog(true)}
              />
            )}

            {activeTab === 'products' && (
              <ProductManager
                products={products}
                categories={categories}
                onProductsUpdated={() => loadCatalog(true)}
                readOnly={currentRole === 'kassa'}
              />
            )}

            {activeTab === 'orders' && (
              <OrderHistory
                products={products}
                readOnly={currentRole === 'kassa'}
              />
            )}

            {activeTab === 'debts' && (
              <DebtTracker
                readOnly={currentRole === 'kassa'}
              />
            )}
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
