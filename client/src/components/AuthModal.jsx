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
  HelpCircle,
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
        setError('Password must contain uppercase (A-Z), lowercase (a-z), a number (0-9), and a symbol (!@#$%^&*).');
        setLoading(false);
        return;
      }
      if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
        setError('Invalid Ethereum Web3 wallet address. Must start with 0x followed by 40 hex characters.');
        setLoading(false);
        return;
      }

      const res = await register(
        name,
        email,
        password,
        walletAddress ? walletAddress.trim() : null
      );

      if (res.success) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        if (onSuccess) onSuccess('Account created & cryptographic identity registered!');
        onClose();
      } else {
        setError(res.error || 'Registration failed. Please try a different email.');
      }
    } else {
      // Login
      const res = await login(email, password);
      if (res.success) {
        try {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.6 },
          });
        } catch {}
        if (onSuccess) onSuccess('Signed in successfully!');
        onClose();
      } else {
        setError(res.error || 'Invalid email or password. Please verify your credentials.');
      }
    }
    setLoading(false);
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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          padding: '2.25rem',
          borderRadius: '24px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border-hover)',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.9), 0 0 45px var(--glow-primary)',
          backdropFilter: 'blur(24px)',
          position: 'relative',
          overflow: 'hidden',
        }}
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

        {/* Modal Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
              border: '1px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              boxShadow: '0 0 25px var(--glow-primary)',
            }}
          >
            {mode === 'register' ? <UserPlus size={28} /> : <LogIn size={28} />}
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
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

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
            {mode === 'register'
              ? 'Join the decentralized zero-knowledge file vault with bcrypt & Web3 authentication.'
              : 'Sign in with your email or username to access your encrypted blockchain files.'}
          </p>
        </div>

        {/* Segmented Cyber Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: mode === 'login' ? 'var(--gradient-main)' : 'transparent',
              color: mode === 'login' ? '#030712' : 'var(--text-secondary)',
              fontWeight: mode === 'login' ? '700' : '500',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: mode === 'login' ? '0 4px 15px var(--glow-primary)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: mode === 'register' ? 'var(--gradient-main)' : 'transparent',
              color: mode === 'register' ? '#030712' : 'var(--text-secondary)',
              fontWeight: mode === 'register' ? '700' : '500',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: mode === 'register' ? '0 4px 15px var(--glow-primary)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <UserPlus size={15} />
            <span>Create Account</span>
          </button>
        </div>

        {/* 1-Click Test Persona Fillers */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600 }}>1-Click Demo Personas:</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleAutofillDemo('ashutosh')}
              style={{
                background: 'rgba(0, 242, 254, 0.15)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                color: 'var(--accent-cyan)',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
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
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--accent-emerald)',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Autofill Rahul (Authorized Recipient)"
            >
              Rahul
            </button>

            <button
              type="button"
              onClick={() => handleAutofillDemo('priya')}
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#c084fc',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Autofill Priya (Collaborator)"
            >
              Priya
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.14)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fb7185',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(244, 63, 94, 0.15)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Full Name (Register only) */}
          {mode === 'register' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="name" style={{ fontWeight: 600 }}>
                Full Name
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" style={{ color: 'var(--primary)' }} />
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

          {/* Email / Username Field */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="email" style={{ fontWeight: 600 }}>
              {mode === 'login' ? 'Email Address or Username' : 'Email Address'}
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" style={{ color: 'var(--primary)' }} />
              <input
                id="email"
                type={mode === 'login' ? 'text' : 'email'}
                required
                placeholder={mode === 'login' ? 'ashutosh@gmail.com or Ashutosh' : 'you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                autoComplete={mode === 'login' ? 'username' : 'email'}
              />
            </div>
          </div>

          {/* Password Field with Show/Hide toggle */}
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password" style={{ fontWeight: 600 }}>
                Password
              </label>
              {mode === 'login' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Default: <code style={{ color: 'var(--primary)' }}>Password123!</code>
                </span>
              )}
            </div>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" style={{ color: 'var(--primary)' }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                style={{ paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.9rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength bar for registration */}
            {mode === 'register' && password && (
              <div style={{ marginTop: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '4px', height: '5px' }}>
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      style={{
                        flex: 1,
                        borderRadius: '3px',
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
                    fontSize: '0.72rem',
                    marginTop: '4px',
                    color: 'var(--text-muted)',
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

                {/* NIST Security Criteria Checklist */}
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.4rem',
                    fontSize: '0.72rem',
                  }}
                >
                  <div
                    style={{
                      color: passCriteria.length ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {passCriteria.length ? <Check size={12} /> : <span>○</span>} 8+ Characters
                  </div>
                  <div
                    style={{
                      color: passCriteria.upper ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {passCriteria.upper ? <Check size={12} /> : <span>○</span>} 1 Uppercase (A-Z)
                  </div>
                  <div
                    style={{
                      color: passCriteria.lower ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {passCriteria.lower ? <Check size={12} /> : <span>○</span>} 1 Lowercase (a-z)
                  </div>
                  <div
                    style={{
                      color: passCriteria.number ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {passCriteria.number ? <Check size={12} /> : <span>○</span>} 1 Number (0-9)
                  </div>
                  <div
                    style={{
                      color: passCriteria.special ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      gridColumn: 'span 2',
                    }}
                  >
                    {passCriteria.special ? <Check size={12} /> : <span>○</span>} 1 Special Symbol (!@#$%^&*)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="confirmPassword" style={{ fontWeight: 600 }}>
                Confirm Password
              </label>
              <div className="input-wrapper">
                <ShieldCheck size={18} className="input-icon" style={{ color: 'var(--primary)' }} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  autoComplete="new-password"
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.9rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Optional Web3 Wallet Address Linking */}
          {mode === 'register' && (
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="wallet" style={{ fontWeight: 600 }}>
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
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Use Connected MetaMask
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <Wallet size={18} className="input-icon" style={{ color: 'var(--accent-amber)' }} />
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

          {/* Submit Action Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.85rem',
              fontSize: '1.05rem',
              fontWeight: 700,
              boxShadow: '0 8px 25px var(--glow-primary)',
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'register' ? (
              <>
                <span>Create Decentralized Account</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>Sign In to BlockShare</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

        </form>

        {/* Mode Toggle Switch Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          {mode === 'register' ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
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
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
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

        {/* Security & Cryptographic Guarantee Notice */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Key size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
          <span>Zero-Knowledge: Passwords hashed with bcrypt (12 rounds) & tokens verified with RS256/HS256 JWT.</span>
        </div>

      </div>
    </div>
  );
};
