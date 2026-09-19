import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { X, User, Mail, Lock, Wallet, ShieldCheck, Key, ArrowRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AuthModal = ({ isOpen, initialMode = 'register', onClose, onSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const { register, login } = useAuth();
  const { account, connectWallet } = useWeb3();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [useConnectedWallet, setUseConnectedWallet] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (account && useConnectedWallet) {
      setWalletAddress(account);
    }
  }, [account, useConnectedWallet]);

  if (!isOpen) return null;

  // Password strength calculation
  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score; // 0 to 4
  };

  const strength = calculateStrength(password);
  const strengthLabels = ['Too weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match!');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }

      const res = await register(
        name,
        email,
        password,
        walletAddress || null
      );

      if (res.success) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
        if (onSuccess) onSuccess('Account created & credentials hashed with bcrypt!');
        onClose();
      } else {
        setError(res.error || 'Registration failed');
      }
    } else {
      // Login
      const res = await login(email, password);
      if (res.success) {
        if (onSuccess) onSuccess('Logged in successfully!');
        onClose();
      } else {
        setError(res.error || 'Invalid email or password');
      }
    }
    setLoading(false);
  };

  // Demo autofill for Ashutosh
  const handleAutofillDemo = () => {
    setName('Ashutosh');
    setEmail('ashutosh@gmail.com');
    setPassword('Password123!');
    setConfirmPassword('Password123!');
    setWalletAddress('0x71c67ed3e80435a55611f476c66337051b7b292a');
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Tab Header */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: mode === 'register' ? '700' : '500',
              color: mode === 'register' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              position: 'relative',
              paddingBottom: '0.25rem',
              borderBottom: mode === 'register' ? '2px solid var(--accent-cyan)' : 'none',
            }}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: mode === 'login' ? '700' : '500',
              color: mode === 'login' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              position: 'relative',
              paddingBottom: '0.25rem',
              borderBottom: mode === 'login' ? '2px solid var(--accent-cyan)' : 'none',
            }}
          >
            Sign In
          </button>
        </div>

        {/* Quick Demo Pre-fill Banner */}
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px dashed rgba(56, 189, 248, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.6rem 0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            🧪 Quick test with example credentials?
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAutofillDemo}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}
          >
            Fill "Ashutosh"
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Name Field (Register only) */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Ashutosh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                required
                placeholder="ashutosh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            {/* Password strength bar for registration */}
            {mode === 'register' && password && (
              <div style={{ marginTop: '0.25rem' }}>
                <div className={`strength-bar strength-${strength}`}>
                  <div className="strength-segment"></div>
                  <div className="strength-segment"></div>
                  <div className="strength-segment"></div>
                  <div className="strength-segment"></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                  <span>Strength: <b style={{ color: strength > 2 ? 'var(--accent-emerald)' : '#f97316' }}>{strengthLabels[strength]}</b></span>
                  <span>Hashed with bcrypt (12 rounds)</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <ShieldCheck size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {/* Wallet Address Linking (Optional at registration) */}
          {mode === 'register' && (
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="wallet">
                  Web3 Wallet Address <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                {account && (
                  <button
                    type="button"
                    onClick={() => setWalletAddress(account)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Use Connected Wallet
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <Wallet size={18} className="input-icon" />
                <input
                  id="wallet"
                  type="text"
                  placeholder="0x71C67Ed3E80435a55611f476C66337051b7B292A"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="form-input mono"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.8rem' }}
          >
            {loading ? (
              <span>Processing...</span>
            ) : mode === 'register' ? (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

        </form>

        {/* Footer Security Notice */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'center',
        }}>
          <Key size={14} color="var(--accent-emerald)" />
          <span>Passwords are irreversibly salted & hashed with bcrypt. Never stored in plain text.</span>
        </div>

      </div>
    </div>
  );
};
