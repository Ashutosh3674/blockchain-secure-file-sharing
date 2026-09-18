import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { SecureShareView } from './components/SecureShareView';
import { SecurityCenterModal } from './components/SecurityCenterModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { FileVerificationPage } from './components/FileVerificationPage';
import { SystemFlowModal } from './components/SystemFlowModal';
import { Toast } from './components/Toast';
import { Shield, Check, Lock, Database, Globe, Key } from 'lucide-react';

import { DevicePreviewBar } from './components/DevicePreviewBar';

export function App() {
  const { isAuthenticated, loading } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register');
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [txDetailsModalOpen, setTxDetailsModalOpen] = useState(false);
  const [systemFlowModalOpen, setSystemFlowModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'laptop' | 'tablet' | 'mobile'
  const [viewportWidth, setViewportWidth] = useState('100%');

  // Extract share token from URL (/share/:token, ?share=:token, or #/share/:token)
  const parseShareToken = () => {
    try {
      const pathname = window.location.pathname;
      const pathMatch = pathname.match(/\/share\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) return pathMatch[1];

      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('share')) return searchParams.get('share');

      const hashMatch = window.location.hash.match(/#\/share\/([a-zA-Z0-9_-]+)/);
      if (hashMatch) return hashMatch[1];
    } catch {}
    return null;
  };

  // Check if current URL is File Verification page (/verify, ?page=verify, #verify)
  const checkIsVerifyPage = () => {
    try {
      const pathname = window.location.pathname;
      if (pathname.includes('/verify') || pathname.includes('/verification')) return true;
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('page') === 'verify' || searchParams.get('verify') !== null) return true;
      if (window.location.hash.includes('#verify')) return true;
    } catch {}
    return false;
  };

  const [currentShareToken, setCurrentShareToken] = useState(() => parseShareToken());
  const [isVerifyPage, setIsVerifyPage] = useState(() => checkIsVerifyPage());

  // Listen to browser back/forward and navigation events
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentShareToken(parseShareToken());
      setIsVerifyPage(checkIsVerifyPage());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('blockshare_navigate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('blockshare_navigate', handleLocationChange);
    };
  }, []);

  const handleNavigateHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentShareToken(null);
    setIsVerifyPage(false);
  };

  const handleNavigateVerify = () => {
    window.history.pushState({}, '', '/verify');
    setCurrentShareToken(null);
    setIsVerifyPage(true);
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenAuth = (mode = 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{ width: '20px', height: '20px', margin: '0 auto 1rem', color: 'var(--accent-cyan)' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Initializing Web3 Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      
      {/* 📱 Interactive Responsive Form Factor Simulator (Desktop, Laptop, Tablet, Mobile) */}
      <DevicePreviewBar
        activeMode={viewportMode}
        onModeChange={(mode, width) => {
          setViewportMode(mode);
          setViewportWidth(width);
        }}
        currentWidth={viewportWidth}
      />

      {/* Responsive Viewport Frame (Simulates tablet/mobile widths seamlessly) */}
      <div
        style={{
          width: '100%',
          maxWidth: viewportWidth,
          margin: '0 auto',
          transition: 'max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: viewportWidth !== '100%' ? '0 0 50px rgba(0, 242, 254, 0.15)' : 'none',
          borderLeft: viewportWidth !== '100%' ? '1px solid rgba(56, 189, 248, 0.2)' : 'none',
          borderRight: viewportWidth !== '100%' ? '1px solid rgba(56, 189, 248, 0.2)' : 'none',
        }}
      >
        {/* Top Navigation */}
        <Navbar
          onOpenAuth={handleOpenAuth}
          onNavigateHome={handleNavigateHome}
          onOpenSecurity={() => setSecurityModalOpen(true)}
          onOpenAdmin={() => setAdminModalOpen(true)}
          onOpenTxDetails={() => setTxDetailsModalOpen(true)}
          onOpenSystemFlow={() => setSystemFlowModalOpen(true)}
          onNavigateVerify={handleNavigateVerify}
          isVerifyPage={isVerifyPage}
          onShowToast={showToast}
        />

        {/* Main View: SecureShareView if share token is present, FileVerificationPage if on /verify, Dashboard if logged in, Hero landing if guest */}
        <main style={{ flex: 1 }}>
          {currentShareToken ? (
            <SecureShareView
              shareToken={currentShareToken}
              onNavigateHome={handleNavigateHome}
              onShowToast={showToast}
              onOpenAuth={handleOpenAuth}
            />
          ) : isVerifyPage ? (
            <FileVerificationPage
              onNavigateHome={handleNavigateHome}
              onShowToast={showToast}
            />
          ) : isAuthenticated ? (
            <Dashboard onShowToast={showToast} />
          ) : (
            <Hero onOpenAuth={handleOpenAuth} />
          )}
        </main>

        {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1.5rem',
        background: 'rgba(7, 10, 18, 0.95)',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div
            onClick={() => setSystemFlowModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            title="Click to view Complete System Flow Architecture"
          >
            <Shield size={16} color="var(--accent-cyan)" />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>BlockShare &bull; Secure File Sharing with Blockchain Architecture</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>View Flow</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399' }}>
              <Lock size={13} />
              bcrypt 12 Rounds
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8' }}>
              <Key size={13} />
              JWT Auth (HS256 24h)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c084fc' }}>
              <Globe size={13} />
              HTTPS & HSTS
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fb7185' }}>
              <Shield size={13} />
              Input Firewall & 50MB Limit
            </span>
          </div>
        </div>
      </footer>
      </div>

      {/* Auth Modal (Register / Login) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      {/* Enterprise Security Control Center Modal */}
      <SecurityCenterModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Admin Panel Dashboard Modal */}
      <AdminDashboardModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Blockchain Transaction Details & Verification Modal */}
      <TransactionDetailsModal
        isOpen={txDetailsModalOpen}
        initialTxHash="0x82A7b913e8a4d70183ec9482bca84192bfa71029487cbb9281a4b92138a011"
        onClose={() => setTxDetailsModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Complete System Flow Architecture Modal */}
      <SystemFlowModal
        isOpen={systemFlowModalOpen}
        onClose={() => setSystemFlowModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

    </div>
  );
}

export default App;
