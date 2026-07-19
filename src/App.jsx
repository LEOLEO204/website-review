import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { db } from './db';

// Modular layouts
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import AffiliateModal from './components/common/AffiliateModal';

// Modular view pages
import HomePage from './components/home/HomePage';
import CategoryPage from './components/reviews/CategoryPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import DealsPage from './components/deals/DealsPage';
import AdminPanel from './components/admin/AdminPanel';
import InfoPage from './pages/InfoPage';

// Admin CMS Components
import AdminSidebar from './components/admin/AdminSidebar';
import ArticleEditor from './pages/admin/ArticleEditor';
import AdminAccounts from './components/admin/AdminAccounts';
import HomepageLayoutConfig from './components/admin/HomepageLayoutConfig';
import SupabaseSetup from './components/admin/SupabaseSetup';

import { ProductProvider } from './context/ProductContext';
import { ArticleProvider } from './context/ArticleContext';

// Clean Modal Wrapper for Admin Overlays
function AdminModalWrapper({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/80 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-sans font-extrabold text-xs text-slate-800 uppercase tracking-wider">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 text-base font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [activeMerchant, setActiveMerchant] = useState('');
  const [activeBuyUrl, setActiveBuyUrl] = useState('');

  const [isAdminActive, setIsAdminActive] = useState(() => {
    return sessionStorage.getItem('wc_admin_session') !== null;
  });

  // State to manage active overlay modals in admin mode
  const [activeAdminModal, setActiveAdminModal] = useState(null); // 'dashboard' | 'articles' | 'products' | 'write' | 'article-editor' | null
  const mainContainerRef = useRef(null);
  const [editingArticleId, setEditingArticleId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPath = location.pathname.startsWith('/admin');
  const lastPathname = useRef(location.pathname);

  // Sync session active state
  useEffect(() => {
    setIsAdminActive(sessionStorage.getItem('wc_admin_session') !== null);
    db.init();

    // Reset search query on normal page navigation and scroll to top
    if (location.pathname !== lastPathname.current) {
      window.scrollTo(0, 0);
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTo(0, 0);
      }
      if (!location.state?.isSearchAction) {
        setSearchQuery('');
      }
      lastPathname.current = location.pathname;
    }
  }, [location]);

  // Global click interceptor to stay under /admin while in admin mode
  useEffect(() => {
    const handleGlobalLinkClick = (e) => {
      // Only intercept if we are currently on an admin path
      if (!location.pathname.startsWith('/admin')) return;

      const anchor = e.target.closest('a');
      if (!anchor) return;

      // Ignore target="_blank", downloads, mailto, tel, etc.
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) return;
      if (href.startsWith('/admin')) return;

      // Handle root home link mapping
      let targetPath = href;
      if (targetPath === '/') {
        targetPath = '/admin';
      } else {
        targetPath = `/admin${targetPath}`;
      }

      // Intercept transition
      e.preventDefault();
      e.stopPropagation();
      navigate(targetPath);
    };

    document.addEventListener('click', handleGlobalLinkClick, true);
    return () => document.removeEventListener('click', handleGlobalLinkClick, true);
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('wc_admin_session');
    setIsAdminActive(false);
    setActiveAdminModal(null);
    navigate('/admin');
  };

  const triggerAffiliateRedirect = (merchant, buyUrl, e) => {
    if (e) e.preventDefault();
    setActiveMerchant(merchant);
    setActiveBuyUrl(buyUrl || 'https://www.google.com');
    setShowAffiliateModal(true);
  };

  // If trying to access admin route but not logged in, render secure login page directly
  if (isAdminPath && !isAdminActive) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center">
        <AdminPanel isAdminActive={isAdminActive} setIsAdminActive={setIsAdminActive} />
      </div>
    );
  }

  return (
    <div className={isAdminPath ? "h-screen overflow-hidden flex bg-slate-100" : "min-h-screen bg-reviewsmart-bgWhite text-reviewsmart-text font-sans flex flex-col justify-between"}>
      
      {/* Admin Sidebar on the Left */}
      {isAdminPath && (
        <AdminSidebar 
          activeTab={activeAdminModal} 
          setActiveTab={setActiveAdminModal} 
          onLogout={handleLogout}
        />
      )}

      {/* Main Workspace (Scrollable on the right for Admin, full screen for Customer) */}
      <div 
        ref={mainContainerRef}
        className={isAdminPath ? "flex-1 flex flex-col min-h-0 overflow-y-auto" : "flex-grow flex flex-col"}
      >
        
        {/* Global Navigation Header */}
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} isAdminActive={isAdminActive} />

        {/* Route Pages Content */}
        <div className="flex-grow">
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<HomePage triggerAffiliate={triggerAffiliateRedirect} searchQuery={searchQuery} />} />
            <Route path="/category/:catId" element={<CategoryPage />} />
            <Route path="/reviews/:slug" element={<ArticleDetailPage triggerAffiliate={triggerAffiliateRedirect} searchQuery={searchQuery} />} />
            <Route path="/deals" element={<DealsPage triggerAffiliate={triggerAffiliateRedirect} />} />

            {/* Info Pages */}
            <Route path="/about" element={<InfoPage />} />
            <Route path="/our-team" element={<InfoPage />} />
            <Route path="/staff-demographics" element={<InfoPage />} />
            <Route path="/how-to-pitch" element={<InfoPage />} />
            <Route path="/contact" element={<InfoPage />} />

            {/* Admin mirrored Routes */}
            <Route path="/admin" element={<HomePage triggerAffiliate={triggerAffiliateRedirect} searchQuery={searchQuery} />} />
            <Route path="/admin/category/:catId" element={<CategoryPage />} />
            <Route path="/admin/reviews/:slug" element={<ArticleDetailPage triggerAffiliate={triggerAffiliateRedirect} searchQuery={searchQuery} />} />
            <Route path="/admin/deals" element={<DealsPage triggerAffiliate={triggerAffiliateRedirect} />} />
            
            <Route path="/admin/about" element={<InfoPage />} />
            <Route path="/admin/our-team" element={<InfoPage />} />
            <Route path="/admin/staff-demographics" element={<InfoPage />} />
            <Route path="/admin/how-to-pitch" element={<InfoPage />} />
            <Route path="/admin/contact" element={<InfoPage />} />
          </Routes>
        </div>

        {/* Global Footer & Newsletter */}
        <Footer />

      </div>

      {/* Admin Overlay Modals */}
      {activeAdminModal === 'articles' && (
        <AdminModalWrapper title="Review Articles" onClose={() => setActiveAdminModal(null)}>
          <ArticleEditor 
            editingArticleId={editingArticleId} 
            setEditingArticleId={(id) => {
              setEditingArticleId(id);
              if (id !== null) {
                setActiveAdminModal('article-editor');
              }
            }}
            onCancel={() => {
              setActiveAdminModal(null);
              setEditingArticleId(null);
            }}
          />
        </AdminModalWrapper>
      )}

      {activeAdminModal === 'article-editor' && (
        <AdminModalWrapper title="Edit Article" onClose={() => setActiveAdminModal('articles')}>
          <ArticleEditor 
            editingArticleId={editingArticleId} 
            setEditingArticleId={setEditingArticleId}
            onCancel={() => {
              setActiveAdminModal('articles');
              setEditingArticleId(null);
            }}
          />
        </AdminModalWrapper>
      )}

      {activeAdminModal === 'accounts' && (
        <AdminModalWrapper title="Admin Accounts" onClose={() => setActiveAdminModal(null)}>
          <AdminAccounts />
        </AdminModalWrapper>
      )}

      {activeAdminModal === 'homepage-layout' && (
        <AdminModalWrapper title="Homepage Layout Configuration" onClose={() => setActiveAdminModal(null)}>
          <HomepageLayoutConfig onClose={() => setActiveAdminModal(null)} />
        </AdminModalWrapper>
      )}

      {activeAdminModal === 'supabase-setup' && (
        <AdminModalWrapper title="Supabase Database Configuration" onClose={() => setActiveAdminModal(null)}>
          <SupabaseSetup />
        </AdminModalWrapper>
      )}

      {/* Affiliate Link Redirection Simulator Modal */}
      <AffiliateModal 
        show={showAffiliateModal} 
        onClose={() => setShowAffiliateModal(false)} 
        merchant={activeMerchant} 
        buyUrl={activeBuyUrl} 
      />

    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ProductProvider>
        <ArticleProvider>
          <AppContent />
        </ArticleProvider>
      </ProductProvider>
    </Router>
  );
}
