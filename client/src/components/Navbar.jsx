import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { Shield, Lock, Wallet, LogOut, User, CheckCircle, AlertCircle, ExternalLink, Blocks, Search, Layers } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';

export const Navbar = ({
  onOpenAuth,
  onNavigateHome,
  onOpenSecurity,
  onShowToast,
  onOpenAdmin,
  onOpenTxDetails,
  onNavigateVerify,
  onOpenSystemFlow,
  isVerifyPage,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { account, networkName, isConnecting, connectWallet, disconnectWallet } = useWeb3();

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleBrandClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new Event('blockshare_navigate'));
    }
  };

  const isAdmin = user?.role === 'admin' || user?.email?.includes('ashutosh') || true; // Demo admin access

  return (
    <header className="glass-panel" style={{ margin: '1rem 1.5rem', padding: '0.85rem 1.75rem', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand */}
        <div
          onClick={handleBrandClick}
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
          title="Return to Dashboard / Home"
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(0,242,254,0.2) 0%, rgba(79,172,254,0.1) 100%)',
            border: '1px solid rgba(0,242,254,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            boxShadow: '0 0 15px rgba(0,242,254,0.25)'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.03em' }}>
                Block<span className="gradient-text">Share</span>
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Web3 v1.0</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Secure File Sharing with Blockchain
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Complete System Flow Architecture Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenSystemFlow}
            title="View Complete System Flow Architecture (User -> React -> Auth -> Node -> MongoDB/Crypto -> IPFS -> Contract -> Blockchain)"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.85rem',
              borderColor: 'rgba(56, 189, 248, 0.45)',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 600,
            }}
          >
            <Layers size={14} />
            <span>🏗️ System Flow</span>
          </button>

          {/* File Verification Page Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNavigateVerify}
            title="Open Dedicated File Verification Page (Hash Matching & Tamper Detection)"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.85rem',
              borderColor: isVerifyPage ? 'var(--accent-cyan)' : 'rgba(0, 242, 254, 0.35)',
              background: isVerifyPage ? 'rgba(0, 242, 254, 0.2)' : 'rgba(0, 242, 254, 0.08)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 600,
            }}
          >
            <Search size={14} />
            <span>🔎 File Verification</span>
          </button>
          
          {/* Transaction Verification Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenTxDetails}
            title="Verify Blockchain Transactions (0x82A7... Block #893721)"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.85rem',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              background: 'rgba(56, 189, 248, 0.08)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Blocks size={14} />
            <span style={{ fontWeight: 600 }}>⛓️ Verify Tx</span>
          </button>

          {/* Admin Panel Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenAdmin}
            title="Open Enterprise Admin Dashboard (Users, Suspensions, Storage, Telemetry)"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.85rem',
              borderColor: 'rgba(139, 92, 246, 0.45)',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Shield size={14} />
            <span style={{ fontWeight: 600 }}>🧑💼 Admin Panel</span>
          </button>

          {/* Security Center Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenSecurity}
            title="Open Enterprise Security Control Center (bcrypt, JWT, HTTPS, Firewall)"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.85rem',
              borderColor: 'rgba(0, 242, 254, 0.4)',
              background: 'rgba(0, 242, 254, 0.08)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Shield size={15} />
            <span style={{ fontWeight: 600 }}>Security Center</span>
          </button>

          {/* 🔔 Real-Time Notifications Center */}
          <NotificationsDropdown onShowToast={onShowToast} />

          {/* Web3 Network Badge */}
          {networkName && (
            <div className="badge badge-purple" style={{ padding: '0.35rem 0.75rem' }}>
              <span className="pulse-dot"></span>
              <span>{networkName}</span>
            </div>
          )}

          {/* Web3 Wallet Connect Button */}
          {account ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(245, 130, 32, 0.1)',
              border: '1px solid rgba(245, 130, 32, 0.3)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.85rem',
              color: '#fca34d'
            }}>
              <Wallet size={16} />
              <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {truncateAddress(account)}
              </span>
              <button
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                &times;
              </button>
            </div>
          ) : (
            <button
              className="btn btn-wallet"
              onClick={() => connectWallet(false)}
              disabled={isConnecting}
              style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
            >
              <Wallet size={16} />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}

          {/* User Authentication Status */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00f2fe, #8b5cf6)',
                  color: '#050b14',
                  fontWeight: '700',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user?.name}</span>
              </div>

              <button
                className="btn btn-secondary"
                onClick={logout}
                title="Logout"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => onOpenAuth('login')}
                style={{ fontSize: '0.88rem', padding: '0.45rem 1.1rem' }}
              >
                Sign In
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onOpenAuth('register')}
                style={{ fontSize: '0.88rem', padding: '0.45rem 1.1rem' }}
              >
                Register
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
