import React from 'react';
import { Shield, Lock, Cpu, Database, ArrowRight, Wallet, CheckCircle, Sparkles } from 'lucide-react';

export const Hero = ({ onOpenAuth }) => {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem 5rem', textAlign: 'center' }}>
      
      {/* Top Tag */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span className="badge badge-cyan" style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}>
          <Sparkles size={14} />
          Web3 Decentralized Architecture
        </span>
      </div>

      {/* Main Title */}
      <h1 style={{ fontSize: '3.4rem', lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
        Web App for Secure File Sharing <br />
        <span className="gradient-text">with Blockchain & IPFS</span>
      </h1>

      <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '750px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
        Zero-knowledge file encryption meets Ethereum smart contract access control. Protect sensitive files with client-side <b>AES-256</b> encryption, decentralized <b>IPFS storage</b>, and tamper-proof blockchain permissions.
      </p>

      {/* Call to Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
        <button
          className="btn btn-primary"
          onClick={() => onOpenAuth('register')}
          style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}
        >
          <span>Create Free Account</span>
          <ArrowRight size={18} />
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => onOpenAuth('login')}
          style={{ padding: '0.85rem 1.8rem', fontSize: '1.05rem' }}
        >
          <span>Sign In Existing User</span>
        </button>
      </div>

      {/* 3 Core Pillar Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
        
        {/* Card 1 */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(0, 242, 254, 0.15)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <Lock size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>1. User Auth & Wallet Linking</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Users sign up with hashed credentials using <b>bcrypt (10 salt rounds)</b> and link their EVM wallet (MetaMask) to bridge Web2 login with Web3 cryptographic identity.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckCircle size={14} />
            <span>Completed & Ready</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.15)',
            color: 'var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <Cpu size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>2. Client-Side Encryption</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Every file is encrypted in the browser using symmetric <b>AES-GCM 256-bit</b> encryption before being transferred. Plaintext data never leaves your device.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Next Feature</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(245, 130, 32, 0.15)',
            color: '#fca34d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <Database size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>3. Blockchain & IPFS Vault</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Encrypted files are pinned on <b>IPFS</b> and access permissions are committed into an immutable <b>Solidity Smart Contract</b> for decentralized verification.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Smart Contract Pipeline</span>
          </div>
        </div>

      </div>

    </div>
  );
};
