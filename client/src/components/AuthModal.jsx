import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import {
  X,
  User,
  Mail,
  Lock,
  Wallet,
  ShieldCheck,
  Shield,
  Key,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Blocks,
} from 'lucide-react';
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

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass)) score += 1;
    return score; // 0 to 4
  };

  const strength = calculateStrength(password);
  const strengthLabels = ['Too Weak', 'Moderate', 'Good', 'Strong', 'Military Grade (NIST Compliant)'];
  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#38bdf8', '#10b981'];

  // Password criteria helper (NIST SP 800-63B)
  const passCriteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };
  const isPassValid = Object.values(passCriteria).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match! Please check both password fields.');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long (NIST SP 800-63B standard).');
        setLoading(false);
        return;
      }
      if (!isPassValid) {
        setError('Password must contain uppercase, lowercase, number, and special character.');
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === 'register') {
        const result = await register(name, email, password, walletAddress);
        if (result.success) {
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          if (onSuccess) onSuccess('Account created & logged in successfully!');
          onClose();
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch {}
          if (onSuccess) onSuccess(`Welcome back, ${result.user?.name || 'User'}!`);
          onClose();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo 1-click test personas
  const handleAutofillDemo = (persona = 'ashutosh') => {
    if (persona === 'ashutosh') {
      setName('Ashutosh');
      setEmail('ashutosh@gmail.com');
      setPassword('Password123!');
      setConfirmPassword('Password123!');
      setWalletAddress('0x82b27f38a65d6b328ac04a045330a84d412e70bb');
    } else if (persona === 'rahul') {
      setName('Rahul');
      setEmail('rahul@gmail.com');
      setPassword('Password123!');
      setConfirmPassword('Password123!');
      setWalletAddress('0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc');
    } else if (persona === 'priya') {
      setName('Priya');
      setEmail('priya@gmail.com');
      setPassword('Password123!');
      setConfirmPassword('Password123!');
      setWalletAddress('0x15d34aaf54267db7d7c367839aaf71a00a2c6a65');
    }
    setError(null);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient luminous gradient glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'var(--gradient-main)',
            zIndex: 10,
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 20,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)';
            e.currentTarget.style.color = '#fb7185';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <X size={16} />
        </button>

        {/* 🌟 LEFT PANE: BRANDING, PILLARS & 1-CLICK DEMO PERSONAS */}
        <div className="auth-left-pane">
          <div>
            {/* Branding Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  border: '1px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  boxShadow: '0 0 20px var(--glow-primary)',
                  flexShrink: 0,
                }}
              >
                <Shield size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    Block<span className="gradient-text">Share</span>
                  </h3>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                    Web3 Vault
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Decentralized Zero-Knowledge Security
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.35rem' }}>
              Enterprise file encryption &amp; sharing architecture backed by client-side AES-256-GCM, IPFS storage, and Ethereum smart contract access control.
            </p>

            {/* Security Pillars List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(0, 242, 254, 0.15)', padding: '5px', borderRadius: '6px', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                  <Lock size={13} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', display: 'block' }}>
                    Zero-Knowledge AES-256-GCM
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Files encrypted in browser memory before IPFS upload
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '5px', borderRadius: '6px', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                  <Blocks size={13} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', display: 'block' }}>
                    Smart Contract Governance
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Granular permission whitelist, expiry &amp; download limits
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '5px', borderRadius: '6px', color: '#c084fc', marginTop: '2px' }}>
                  <Cpu size={13} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', display: 'block' }}>
                    AI Threat &amp; Malware Detector
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Real-time heuristic scanning of suspicious scripts &amp; payloads
                  </span>
                </div>
              </div>
            </div>

            {/* 1-Click Demo Personas */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.55rem' }}>
                <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                  1-Click Demo Personas:
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleAutofillDemo('ashutosh')}
                  style={{
                    background: 'rgba(0, 242, 254, 0.15)',
                    border: '1px solid rgba(0, 242, 254, 0.45)',
                    color: 'var(--accent-cyan)',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Autofill Ashutosh (Admin)"
                >
                  Ashutosh (Admin)
                </button>

                <button
                  type="button"
                  onClick={() => handleAutofillDemo('rahul')}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: 'var(--accent-emerald)',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Autofill Rahul (Recipient)"
                >
                  Rahul
                </button>

                <button
                  type="button"
                  onClick={() => handleAutofillDemo('priya')}
                  style={{
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.45)',
                    color: '#c084fc',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Autofill Priya (Collaborator)"
                >
                  Priya
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Security Trust Badge */}
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <ShieldCheck size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
            <span>NIST SP 800-63B &bull; Argon2 / bcrypt (12 rounds) &bull; JWT RS256</span>
          </div>
        </div>

        {/* 📝 RIGHT PANE: INTERACTIVE FORM & CONTROLS */}
        <div className="auth-right-pane">
          {/* Segmented Cyber Tab Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '4px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '1.35rem',
              maxWidth: '380px',
            }}
          >
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: mode === 'login' ? 'var(--gradient-main)' : 'transparent',
                color: mode === 'login' ? '#030712' : 'var(--text-secondary)',
                fontWeight: mode === 'login' ? '700' : '500',
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: mode === 'login' ? '0 4px 15px var(--glow-primary)' : 'none',
                transition: 'all 0.25s ease',
              }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: mode === 'register' ? 'var(--gradient-main)' : 'transparent',
                color: mode === 'register' ? '#030712' : 'var(--text-secondary)',
                fontWeight: mode === 'register' ? '700' : '500',
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: mode === 'register' ? '0 4px 15px var(--glow-primary)' : 'none',
                transition: 'all 0.25s ease',
              }}
            >
              <UserPlus size={14} />
              <span>Create Account</span>
            </button>
          </div>

          {/* Form Header Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.25rem' }}>
              {mode === 'register' ? (
                <>
                  Create <span className="gradient-text">Account</span>
                </>
              ) : (
                <>
                  Welcome <span className="gradient-text">Back</span>
                </>
              )}
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              {mode === 'register'
                ? 'Join the decentralized zero-knowledge vault with bcrypt & Web3 authentication.'
                : 'Sign in with your email or username to access your encrypted blockchain files.'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.14)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#fb7185',
                padding: '0.65rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(244, 63, 94, 0.15)',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Interactive Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* ROW 1: Full Name & Email Address (Side-by-Side in landscape!) */}
            {mode === 'register' ? (
              <div className="auth-form-row-2col">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="name" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Full Name
                  </label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" style={{ color: 'var(--primary)' }} />
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

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="email" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Email Address
                  </label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" style={{ color: 'var(--primary)' }} />
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="email" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Email Address or Username
                </label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" style={{ color: 'var(--primary)' }} />
                  <input
                    id="email"
                    type="text"
                    required
                    placeholder="ashutosh@gmail.com or Ashutosh"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            {/* ROW 2: Password & Confirm Password (Side-by-side in Register, single in Login) */}
            {mode === 'register' ? (
              <div className="auth-form-row-2col">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="password" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Password
                  </label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" style={{ color: 'var(--primary)' }} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      autoComplete="new-password"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '0.8rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="confirmPassword" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Confirm Password
                  </label>
                  <div className="input-wrapper">
                    <ShieldCheck size={16} className="input-icon" style={{ color: 'var(--primary)' }} />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input"
                      autoComplete="new-password"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '0.8rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="password" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Password
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Default: <code style={{ color: 'var(--primary)' }}>Password123!</code>
                  </span>
                </div>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" style={{ color: 'var(--primary)' }} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    autoComplete="current-password"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Password strength bar & NIST Criteria (Register only) */}
            {mode === 'register' && password && (
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      style={{
                        flex: 1,
                        borderRadius: '2px',
                        background:
                          strength >= seg
                            ? strengthColors[strength]
                            : 'rgba(255, 255, 255, 0.1)',
                        boxShadow:
                          strength >= seg
                            ? `0 0 8px ${strengthColors[strength]}`
                            : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.45rem',
                  }}
                >
                  <span>
                    Security Level:{' '}
                    <b style={{ color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </b>
                  </span>
                  <span>Argon2 / bcrypt 12 rounds</span>
                </div>

                {/* NIST Security Criteria Checklist in clean 2-column grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.3rem 0.6rem',
                    fontSize: '0.7rem',
                  }}
                >
                  <div style={{ color: passCriteria.length ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {passCriteria.length ? <Check size={11} /> : <span>○</span>} 8+ Characters
                  </div>
                  <div style={{ color: passCriteria.upper ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {passCriteria.upper ? <Check size={11} /> : <span>○</span>} 1 Uppercase (A-Z)
                  </div>
                  <div style={{ color: passCriteria.lower ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {passCriteria.lower ? <Check size={11} /> : <span>○</span>} 1 Lowercase (a-z)
                  </div>
                  <div style={{ color: passCriteria.number ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {passCriteria.number ? <Check size={11} /> : <span>○</span>} 1 Number (0-9)
                  </div>
                  <div style={{ color: passCriteria.special ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', gridColumn: 'span 2' }}>
                    {passCriteria.special ? <Check size={11} /> : <span>○</span>} 1 Special Symbol (!@#$%^&*)
                  </div>
                </div>
              </div>
            )}

            {/* Optional Web3 Wallet Address Linking */}
            {mode === 'register' && (
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="wallet" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Web3 Wallet Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  {account && (
                    <button
                      type="button"
                      onClick={() => setWalletAddress(account)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Use Connected MetaMask
                    </button>
                  )}
                </div>
                <div className="input-wrapper">
                  <Wallet size={16} className="input-icon" style={{ color: 'var(--accent-amber)' }} />
                  <input
                    id="wallet"
                    type="text"
                    placeholder="0x82b27f38a65d6b328ac04a045330a84d412e70bb"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="form-input mono"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.8rem',
                fontSize: '0.98rem',
                fontWeight: 700,
                boxShadow: '0 8px 25px var(--glow-primary)',
              }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : mode === 'register' ? (
                <>
                  <span>Create Decentralized Account</span>
                  <ArrowRight size={17} />
                </>
              ) : (
                <>
                  <span>Sign In to BlockShare</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

          </form>

          {/* Mode Toggle Switch Footer */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            {mode === 'register' ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Sign In here
                </button>
              </p>
            ) : (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Create Free Account
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
