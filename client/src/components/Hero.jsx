import React from 'react';
import { Shield, Lock, Cpu, Database, ArrowRight, Wallet, CheckCircle, Sparkles, LayoutDashboard, KeyRound, Radio } from 'lucide-react';

export const Hero = ({ onOpenAuth, isAuthenticated, user, onNavigateDashboard }) => {
  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '3.5rem 1.5rem 5.5rem', textAlign: 'center', position: 'relative' }}>
      
      {/* Background Neon Aura Bloom */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '650px',
          height: '350px',
          background: 'radial-gradient(ellipse, var(--glow-primary) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 75%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top Tag with Neon Glow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
          <span
            className="badge badge-cyan"
            style={{
              padding: '0.5rem 1.15rem',
              fontSize: '0.85rem',
              background: 'rgba(0, 242, 254, 0.12)',
              border: '1px solid var(--primary)',
              boxShadow: '0 0 15px var(--glow-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span className="pulse-dot" style={{ color: 'var(--primary)' }}></span>
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>Web3 Cryptographic Architecture</span>
          </span>
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: '3.6rem',
            lineHeight: 1.15,
            marginBottom: '1.35rem',
            letterSpacing: '-0.03em',
            fontWeight: 800,
          }}
        >
          Secure Decentralized File Sharing <br />
          <span className="gradient-text">with Blockchain & IPFS</span>
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '780px',
            margin: '0 auto 2.75rem',
            lineHeight: 1.65,
          }}
        >
          Zero-knowledge cryptographic security meets Ethereum smart contracts. Encrypt files locally with{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>AES-256-GCM</span>, distribute via{' '}
          <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>IPFS clusters</span>, and enforce immutable permissions on-chain.
        </p>

        {/* Call to Actions */}
        <div style={{ display: 'flex', gap: '1.15rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4.5rem' }}>
          {isAuthenticated ? (
            <button
              className="btn btn-primary"
              onClick={onNavigateDashboard}
              style={{
                padding: '0.95rem 2.6rem',
                fontSize: '1.12rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 8px 30px var(--glow-primary)',
              }}
            >
              <LayoutDashboard size={20} />
              <span>Open {user?.role === 'admin' ? 'Admin' : 'User'} Dashboard</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <>
              <button
                className="btn btn-primary"
                onClick={() => onOpenAuth('register')}
                style={{
                  padding: '0.95rem 2.4rem',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  boxShadow: '0 8px 30px var(--glow-primary)',
                }}
              >
                <span>Create Free Account</span>
                <ArrowRight size={18} />
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => onOpenAuth('login')}
                style={{
                  padding: '0.95rem 2.2rem',
                  fontSize: '1.1rem',
                  border: '1px solid var(--card-border)',
                }}
              >
                <span>Sign In Existing User</span>
              </button>
            </>
          )}
        </div>

        {/* 3 Core Pillar Cards with Individual Luminous Palettes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', textAlign: 'left' }}>
          
          {/* Card 1: Cyan / Blue Neon Theme */}
          <div
            className="glass-panel glow-card"
            style={{
              padding: '2rem',
              borderColor: 'rgba(0, 242, 254, 0.22)',
              background: 'linear-gradient(180deg, rgba(12, 20, 42, 0.85) 0%, rgba(8, 13, 28, 0.9) 100%)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)',
                border: '1px solid rgba(0, 242, 254, 0.45)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.35rem',
                boxShadow: '0 0 20px rgba(0, 242, 254, 0.25)',
              }}
            >
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem', color: '#ffffff' }}>
              1. User Auth & Web3 Wallet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              Dual security layer: Argon2 / <b style={{ color: '#38bdf8' }}>bcrypt (12 rounds)</b> password hashing coupled with EVM wallet cryptographic identity (ECDSA signature verification).
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 600 }}>
              <CheckCircle size={16} />
              <span>Hardened & Active</span>
            </div>
          </div>

          {/* Card 2: Violet / Magenta Theme */}
          <div
            className="glass-panel glow-card"
            style={{
              padding: '2rem',
              borderColor: 'rgba(168, 85, 247, 0.25)',
              background: 'linear-gradient(180deg, rgba(20, 14, 46, 0.85) 0%, rgba(12, 8, 30, 0.9) 100%)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.28) 0%, rgba(236, 72, 153, 0.18) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.45)',
                color: 'var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.35rem',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
              }}
            >
              <Cpu size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem', color: '#ffffff' }}>
              2. Client-Side AES-256-GCM
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              Files are encrypted client-side using authenticated <b style={{ color: '#c084fc' }}>AES-256-GCM</b> with random 96-bit IV before dispatch. Zero plaintext touches server or network.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>
              <KeyRound size={16} />
              <span>Zero-Knowledge Envelope</span>
            </div>
          </div>

          {/* Card 3: Emerald & Solar Amber Theme */}
          <div
            className="glass-panel glow-card"
            style={{
              padding: '2rem',
              borderColor: 'rgba(16, 185, 129, 0.25)',
              background: 'linear-gradient(180deg, rgba(10, 26, 22, 0.85) 0%, rgba(6, 16, 14, 0.9) 100%)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(245, 158, 11, 0.18) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.35rem',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Database size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem', color: '#ffffff' }}>
              3. Blockchain & IPFS Vault
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              Encrypted chunks are pinned to <b style={{ color: '#34d399' }}>IPFS DAG</b> and permission hashes are recorded on an immutable <b style={{ color: '#fbbf24' }}>Solidity smart contract</b>.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600 }}>
              <Radio size={16} />
              <span>Smart Contract Enforced</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
