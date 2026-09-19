import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Shield,
  Layers,
  CheckCircle2,
  Lock,
  Database,
  Share2,
  HardDrive,
  Blocks,
  Globe,
  Key,
  ArrowDown,
  ArrowRight,
  Terminal,
  ExternalLink,
  Cpu,
  Fingerprint,
} from 'lucide-react';

/**
 * 🏗️ SystemFlowModal.jsx
 * Interactive Architectural Overview & Complete System Flow Visualizer
 *
 * Flow:
 *                 USER
 *                  │
 *                  ▼
 *           ┌──────────────┐
 *           │ React Frontend│
 *           └──────┬───────┘
 *                  │
 *          Login / Wallet
 *                  │
 *                  ▼
 *           ┌──────────────┐
 *           │ Node + Express│
 *           └──────┬───────┘
 *                  │
 *          ┌───────┴────────┐
 *          │                │
 *          ▼                ▼
 *     ┌─────────┐      ┌──────────┐
 *     │ MongoDB │      │Encryption│
 *     └─────────┘      └────┬─────┘
 *                           │
 *                           ▼
 *                        ┌─────┐
 *                        │IPFS │
 *                        └──┬──┘
 *                           │
                          CID
 *                           │
 *                           ▼
 *                   ┌──────────────┐
 *                   │ Smart Contract│
 *                   └──────┬───────┘
 *                          │
 *                          ▼
 *                      Blockchain
 */

const FLOW_STEPS = [
  {
    id: 'user',
    number: '1',
    title: 'USER',
    subtitle: 'Client / Document Owner',
    icon: Fingerprint,
    color: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(14,165,233,0.05) 100%)',
    description: 'User accesses the web platform, selects files for upload (up to 50MB: PDF, DOCX, PNG, ZIP, etc.), defines access permissions, or requests access to a shared document token.',
    tech: ['Browser Client', 'HTML5 File API', 'Web Crypto API'],
    telemetry: 'Action: [UPLOAD_INITIATED] Payload: "Project.pdf" (4.8 MB) Owner: 0x71c6...292a',
  },
  {
    id: 'frontend',
    number: '2',
    title: 'React Frontend',
    subtitle: 'Vite + React SPA UI',
    icon: Globe,
    color: '#00f2fe',
    borderColor: 'rgba(0, 242, 254, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(0,242,254,0.15) 0%, rgba(79,172,254,0.05) 100%)',
    description: 'Modern glassmorphic single-page application. Handles client-side state, multi-barrier gatekeeper checks, responsive viewports (Desktop/Laptop/Tablet/Mobile), and instant hash calculation.',
    tech: ['React 18', 'Vite', 'Vanilla CSS Tokens', 'Lucide Icons'],
    telemetry: 'UI State: Hash computed: A91F8C... Validation: Size & MIME verified. Ready for Auth dispatch.',
  },
  {
    id: 'auth',
    number: '3',
    title: 'Login / Wallet',
    subtitle: 'Web3 MetaMask + JWT Auth',
    icon: Key,
    color: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.05) 100%)',
    description: 'Hybrid authentication tier: Argon2/bcrypt (12 rounds) verifies user credentials and issues a signed HS256 24h JWT. MetaMask (Ethers.js) links EVM wallet addresses via ECDSA personal sign.',
    tech: ['MetaMask / Ethers.js', 'JWT (HS256)', 'bcryptjs (12 rounds)'],
    telemetry: 'Auth verified: JWT Bearer issued. Wallet 0x71c6...292a signature validated on Sepolia network.',
  },
  {
    id: 'backend',
    number: '4',
    title: 'Node + Express',
    subtitle: 'Secure API Gateway',
    icon: Cpu,
    color: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)',
    description: 'Central REST orchestration gateway protected by strict rate limiting, XSS sanitation, TLS 1.3 HTTPS with HSTS, and 50MB file size firewalls. Branches requests to MongoDB and Storage/IPFS.',
    tech: ['Node.js', 'Express.js', 'Helmet & CORS', 'HTTPS / TLS 1.3'],
    telemetry: 'POST /api/files/upload [200 OK] Rate limit 1/60. Security headers active: HSTS, CSP, XSS-Protect.',
  },
  {
    id: 'database',
    number: '5A',
    title: 'MongoDB',
    subtitle: 'Metadata & Audit Store',
    icon: Database,
    color: '#34d399',
    borderColor: 'rgba(52, 211, 153, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(16,185,129,0.05) 100%)',
    description: 'Stores indexed user profiles, access control lists, telemetry logs, share tokens, and encryption metadata (salt, IV, mode). Note: Decryption keys are NEVER stored in MongoDB in plaintext.',
    tech: ['MongoDB Mongoose', 'BSON Serialization', 'JSON Fallback Engine'],
    telemetry: 'db.files.insertOne({ fileId: "101", name: "Project.pdf", owner: "0x71c6...", status: "Active" })',
  },
  {
    id: 'encryption',
    number: '5B',
    title: 'Encryption',
    subtitle: 'AES-256-GCM + ECDH',
    icon: Lock,
    color: '#ec4899',
    borderColor: 'rgba(236, 72, 153, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.05) 100%)',
    description: 'Zero-Knowledge Client-Side Encryption. Files are encrypted with AES-GCM (256-bit key, 96-bit random IV, PBKDF2 100k iterations). Recipient public keys wrap the secret key using ECDH asymmetric envelopes.',
    tech: ['AES-256-GCM', 'PBKDF2', 'ECDH Key Wrapping', 'Crypto-Shredding'],
    telemetry: 'Ciphertext generated: 5,033,164 bytes. Auth Tag: 16 bytes. Secret key shredded on revocation.',
  },
  {
    id: 'ipfs',
    number: '6',
    title: 'IPFS',
    subtitle: 'Decentralized P2P Storage',
    icon: HardDrive,
    color: '#06b6d4',
    borderColor: 'rgba(6, 182, 212, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(8,145,178,0.05) 100%)',
    description: 'Encrypted ciphertext is split into Merkle DAG blocks and pinned to the InterPlanetary File System (IPFS) cluster. Content is addressable only by content hash, ensuring tamper-proof distribution.',
    tech: ['IPFS Protocol', 'Pinata Cloud SDK', 'Merkle DAG', 'P2P Bitswap'],
    telemetry: 'Block chunks pinned: 19 blocks. Multiaddr: /ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
  },
  {
    id: 'cid',
    number: '7',
    title: 'CID',
    subtitle: 'Content Identifier Hash',
    icon: Fingerprint,
    color: '#a855f7',
    borderColor: 'rgba(168, 85, 247, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.05) 100%)',
    description: 'Deterministic Content Identifier (CID v0 / v1) generated from cryptographic hash of encrypted bytes. Any modification of a single byte alters the CID completely (Avalanche effect).',
    tech: ['SHA-256 Multihash', 'CIDv0 (Qm...) / CIDv1 (bafy...)', 'Base58 / Base32'],
    telemetry: 'CID Output: bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi (SHA-256: 93FA...)',
  },
  {
    id: 'contract',
    number: '8',
    title: 'Smart Contract',
    subtitle: 'FileShareRegistry.sol',
    icon: Share2,
    color: '#f43f5e',
    borderColor: 'rgba(244, 63, 94, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(225,29,72,0.05) 100%)',
    description: 'EVM Solidity contract deployed on Ethereum Sepolia / Polygon. Enforces on-chain access controls: recordFile(), grantAccess(), revokeAccess(), time-based expiration timestamps, and audit event logs.',
    tech: ['Solidity 0.8.20', 'OpenZeppelin', 'EVM Bytecode', 'AccessControl'],
    telemetry: 'contract.recordFile("101", "bafy...", "A91F8C...", 1758201600) -> Gas Used: 124,530 Gwei',
  },
  {
    id: 'blockchain',
    number: '9',
    title: 'Blockchain',
    subtitle: 'Immutable Distributed Ledger',
    icon: Blocks,
    color: '#8b5cf6',
    borderColor: 'rgba(139, 92, 246, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.05) 100%)',
    description: 'The immutable, tamper-proof blockchain network (Sepolia/Ethereum). Mined transactions form an auditable consensus history that guarantees proof-of-ownership and access integrity globally.',
    tech: ['Ethereum Sepolia', 'Proof-of-Stake Consensus', 'Etherscan Explorer'],
    telemetry: 'Consensus: Proof-of-Stake. State: Immutable. Verified on EVM Block Explorer.',
  },
];

export const SystemFlowModal = ({ isOpen, onClose, onShowToast }) => {
  const [activeStepId, setActiveStepId] = useState('user');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(null);
  const [activeViewTab, setActiveViewTab] = useState('diagram'); // 'diagram' | 'ascii' | 'specs'

  // Handle Simulation playback
  useEffect(() => {
    let timer;
    if (isSimulating) {
      const stepIds = ['user', 'frontend', 'auth', 'backend', 'database', 'encryption', 'ipfs', 'cid', 'contract', 'blockchain'];
      
      let curr = 0;
      setSimulationIndex(0);
      setActiveStepId(stepIds[0]);

      timer = setInterval(() => {
        curr += 1;
        if (curr >= stepIds.length) {
          setIsSimulating(false);
          setSimulationIndex(null);
          if (onShowToast) onShowToast('🎉 Full System Flow Simulation Completed Successfully!', 'success');
          clearInterval(timer);
        } else {
          setSimulationIndex(curr);
          setActiveStepId(stepIds[curr]);
        }
      }, 1400);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulating]);

  if (!isOpen) return null;

  const activeStep = FLOW_STEPS.find((s) => s.id === activeStepId) || FLOW_STEPS[0];

  const handleStartSimulation = () => {
    setIsSimulating(true);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setSimulationIndex(null);
    setActiveStepId('user');
  };

  const rawAsciiDiagram = `
                 USER
                  │
                  ▼
           ┌──────────────┐
           │ React Frontend│
           └──────┬───────┘
                  │
          Login / Wallet
                  │
                  ▼
           ┌──────────────┐
           │ Node + Express│
           └──────┬───────┘
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
     ┌─────────┐      ┌──────────┐
     │ MongoDB │      │Encryption│
     └─────────┘      └────┬─────┘
                           │
                           ▼
                        ┌─────┐
                        │IPFS │
                        └──┬──┘
                           │
                          CID
                           │
                           ▼
                   ┌──────────────┐
                   │ Smart Contract│
                   └──────┬───────┘
                          │
                          ▼
                      Blockchain
`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1120px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          boxShadow: '0 25px 65px -10px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 242, 254, 0.15)',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 15, 30, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(0,242,254,0.2) 0%, rgba(139,92,246,0.15) 100%)',
                border: '1px solid rgba(0,242,254,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
                boxShadow: '0 0 15px rgba(0,242,254,0.25)',
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Complete System Flow Architecture
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  End-to-End Pipeline
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                User ➔ React ➔ Login/Wallet ➔ Node/Express ➔ MongoDB & Encryption ➔ IPFS ➔ CID ➔ Smart Contract ➔ Blockchain
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* View Mode Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.25rem' }}>
              <button
                type="button"
                className={`btn ${activeViewTab === 'diagram' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setActiveViewTab('diagram')}
              >
                Interactive Flow
              </button>
              <button
                type="button"
                className={`btn ${activeViewTab === 'ascii' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setActiveViewTab('ascii')}
              >
                ASCII Diagram
              </button>
              <button
                type="button"
                className={`btn ${activeViewTab === 'specs' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setActiveViewTab('specs')}
              >
                Tier Specs
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: '0.5rem', borderRadius: '10px' }}
              title="Close Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div
          style={{
            padding: '0.75rem 1.75rem',
            background: 'rgba(0, 242, 254, 0.04)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Interactive Simulator:
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartSimulation}
              disabled={isSimulating}
              style={{
                fontSize: '0.8rem',
                padding: '0.4rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Play size={14} fill="currentColor" />
              <span>{isSimulating ? 'Simulating Pipeline...' : '▶ Run Live Flow Simulation'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              style={{
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Active Tier: <strong style={{ color: activeStep.color }}>{activeStep.title}</strong></span>
            {isSimulating && (
              <span className="badge badge-cyan" style={{ animation: 'pulse 1.2s infinite' }}>
                ⚡ Step {simulationIndex + 1} of 10
              </span>
            )}
          </div>
        </div>

        {/* Body Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TAB 1: Interactive Diagram */}
          {activeViewTab === 'diagram' && (
            <div>
              {/* Visual Flow Tree */}
              <div
                style={{
                  background: 'rgba(8, 12, 24, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '2rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.85rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Visual Grid pattern */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'radial-gradient(rgba(0, 242, 254, 0.08) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    pointerEvents: 'none',
                  }}
                />

                {/* Level 1: USER */}
                <div
                  onClick={() => setActiveStepId('user')}
                  style={{
                    cursor: 'pointer',
                    minWidth: '220px',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '14px',
                    textAlign: 'center',
                    background: activeStepId === 'user' ? 'linear-gradient(135deg, rgba(56,189,248,0.25) 0%, rgba(14,165,233,0.1) 100%)' : 'rgba(20, 28, 48, 0.6)',
                    border: `1.5px solid ${activeStepId === 'user' ? '#38bdf8' : 'rgba(56, 189, 248, 0.2)'}`,
                    boxShadow: activeStepId === 'user' ? '0 0 20px rgba(56, 189, 248, 0.35)' : 'none',
                    transition: 'all 0.25s ease',
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8', fontWeight: 700 }}>
                    Step 1
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>USER</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload / Request / Access</div>
                </div>

                <ArrowDown size={20} color={activeStepId === 'user' || activeStepId === 'frontend' ? '#00f2fe' : 'var(--text-muted)'} style={{ margin: '-0.25rem 0' }} />

                {/* Level 2: React Frontend */}
                <div
                  onClick={() => setActiveStepId('frontend')}
                  style={{
                    cursor: 'pointer',
                    minWidth: '260px',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '14px',
                    textAlign: 'center',
                    background: activeStepId === 'frontend' ? 'linear-gradient(135deg, rgba(0,242,254,0.25) 0%, rgba(79,172,254,0.1) 100%)' : 'rgba(20, 28, 48, 0.6)',
                    border: `1.5px solid ${activeStepId === 'frontend' ? 'var(--accent-cyan)' : 'rgba(0, 242, 254, 0.2)'}`,
                    boxShadow: activeStepId === 'frontend' ? '0 0 20px rgba(0, 242, 254, 0.35)' : 'none',
                    transition: 'all 0.25s ease',
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    Step 2
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>React Frontend</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vite SPA &bull; Glassmorphic UI &bull; SHA-256</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '-0.25rem 0' }}>
                  <ArrowDown size={20} color={activeStepId === 'auth' ? '#f59e0b' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.15rem 0.65rem', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.3)' }}>
                    Login / Wallet
                  </span>
                  <ArrowDown size={20} color={activeStepId === 'backend' ? '#10b981' : 'var(--text-muted)'} />
                </div>

                {/* Level 3: Node + Express */}
                <div
                  onClick={() => setActiveStepId('backend')}
                  style={{
                    cursor: 'pointer',
                    minWidth: '260px',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '14px',
                    textAlign: 'center',
                    background: activeStepId === 'backend' ? 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(5,150,105,0.1) 100%)' : 'rgba(20, 28, 48, 0.6)',
                    border: `1.5px solid ${activeStepId === 'backend' ? '#10b981' : 'rgba(16, 185, 129, 0.2)'}`,
                    boxShadow: activeStepId === 'backend' ? '0 0 20px rgba(16, 185, 129, 0.35)' : 'none',
                    transition: 'all 0.25s ease',
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981', fontWeight: 700 }}>
                    Step 4
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Node + Express</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REST API &bull; Input Firewall &bull; HTTPS TLS 1.3</div>
                </div>

                {/* Level 4: Branch to MongoDB & Encryption */}
                <div style={{ width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'center', position: 'relative', margin: '0.25rem 0' }}>
                  {/* Visual Branch connector */}
                  <div style={{
                    width: '320px',
                    height: '24px',
                    borderLeft: '2px solid rgba(52, 211, 153, 0.4)',
                    borderRight: '2px solid rgba(236, 72, 153, 0.4)',
                    borderTop: '2px solid rgba(255, 255, 255, 0.2)',
                    margin: '0 auto',
                  }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%', maxWidth: '680px' }}>
                  {/* Branch A: MongoDB */}
                  <div
                    onClick={() => setActiveStepId('database')}
                    style={{
                      cursor: 'pointer',
                      padding: '1rem',
                      borderRadius: '14px',
                      textAlign: 'center',
                      background: activeStepId === 'database' ? 'linear-gradient(135deg, rgba(52,211,153,0.25) 0%, rgba(16,185,129,0.1) 100%)' : 'rgba(20, 28, 48, 0.6)',
                      border: `1.5px solid ${activeStepId === 'database' ? '#34d399' : 'rgba(52, 211, 153, 0.2)'}`,
                      boxShadow: activeStepId === 'database' ? '0 0 20px rgba(52, 211, 153, 0.35)' : 'none',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', fontWeight: 700 }}>
                      Step 5A
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>MongoDB</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Metadata &bull; Users &bull; Logs</div>
                  </div>

                  {/* Branch B: Encryption */}
                  <div
                    onClick={() => setActiveStepId('encryption')}
                    style={{
                      cursor: 'pointer',
                      padding: '1rem',
                      borderRadius: '14px',
                      textAlign: 'center',
                      background: activeStepId === 'encryption' ? 'linear-gradient(135deg, rgba(236,72,153,0.25) 0%, rgba(219,39,119,0.1) 100%)' : 'rgba(20, 28, 48, 0.6)',
                      border: `1.5px solid ${activeStepId === 'encryption' ? '#ec4899' : 'rgba(236, 72, 153, 0.2)'}`,
                      boxShadow: activeStepId === 'encryption' ? '0 0 20px rgba(236, 72, 153, 0.35)' : 'none',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ec4899', fontWeight: 700 }}>
                      Step 5B
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Encryption</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AES-256-GCM &bull; ECDH Envelopes</div>
                  </div>
                </div>

                {/* Level 5: IPFS */}
                <ArrowDown size={20} color={activeStepId === 'encryption' || activeStepId === 'ipfs' ? '#06b6d4' : 'var(--text-muted)'} style={{ margin: '0.25rem 0' }} />

                <div
                  onClick={() => setActiveStepId('ipfs')}
                  style={{
                    cursor: 'pointer',
                    minWidth: '220px',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '14px',
                    textAlign: 'center',
                    background: activeStepId === 'ipfs' ? 'linear-gradient(135deg, rgba(6,182,212,0.25) 0%, rgba(8,145,178,0.1) 100%)' : 'rgba(20, 28, 48, 0.6)',
                    border: `1.5px solid ${activeStepId === 'ipfs' ? '#06b6d4' : 'rgba(6, 182, 212, 0.2)'}`,
                    boxShadow: activeStepId === 'ipfs' ? '0 0 20px rgba(6, 182, 212, 0.35)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#06b6d4', fontWeight: 700 }}>
                    Step 6
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>IPFS</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Decentralized Storage &bull; Pinata Pinning</div>
                </div>

                {/* Level 6: CID */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '-0.25rem 0' }}>
                  <ArrowDown size={20} color={activeStepId === 'cid' ? '#a855f7' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '0.15rem 0.65rem', borderRadius: '20px', border: '1px solid rgba(168,85,247,0.3)' }}>
                    CID (Content Hash)
                  </span>
                  <ArrowDown size={20} color={activeStepId === 'contract' ? '#f43f5e' : 'var(--text-muted)'} />
                </div>

                {/* Level 7: Smart Contract */}
                <div
                  onClick={() => setActiveStepId('contract')}
                  style={{
                    cursor: 'pointer',
                    minWidth: '260px',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '14px',
                    textAlign: 'center',
                    background: activeStepId === 'contract' ? 'linear-gradient(135deg, rgba(244,63,94,0.25) 0%, rgba(225,29,72,0.1) 100%)' : 'rgba(20, 28, 48, 0.6)',
                    border: `1.5px solid ${activeStepId === 'contract' ? '#f43f5e' : 'rgba(244, 63, 94, 0.2)'}`,
                    boxShadow: activeStepId === 'contract' ? '0 0 20px rgba(244, 63, 94, 0.35)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f43f5e', fontWeight: 700 }}>
                    Step 8
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Smart Contract</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FileShareRegistry.sol &bull; Access & Expiry</div>
                </div>

                <ArrowDown size={20} color={activeStepId === 'blockchain' ? '#8b5cf6' : 'var(--text-muted)'} style={{ margin: '-0.25rem 0' }} />

                {/* Level 8: Blockchain */}
                <div
                  onClick={() => setActiveStepId('blockchain')}
                  style={{
                    cursor: 'pointer',
                    minWidth: '260px',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '14px',
                    textAlign: 'center',
                    background: activeStepId === 'blockchain' ? 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(109,40,217,0.1) 100%)' : 'rgba(20, 28, 48, 0.6)',
                    border: `1.5px solid ${activeStepId === 'blockchain' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)'}`,
                    boxShadow: activeStepId === 'blockchain' ? '0 0 20px rgba(139, 92, 246, 0.35)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b5cf6', fontWeight: 700 }}>
                    Step 9
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Blockchain</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ethereum Sepolia &bull; On-Chain Ledger</div>
                </div>
              </div>

              {/* Selected Tier Deep-Dive Details */}
              <div
                style={{
                  marginTop: '1.5rem',
                  background: activeStep.bgGradient,
                  borderRadius: '16px',
                  border: `1px solid ${activeStep.borderColor}`,
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: activeStep.color,
                      }}
                    >
                      <activeStep.icon size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: activeStep.color }}>
                        {activeStep.title} &bull; {activeStep.subtitle}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Architecture Tier #{activeStep.number}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {activeStep.tech.map((t, idx) => (
                      <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  {activeStep.description}
                </p>

                {/* Telemetry snippet */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                  }}
                >
                  <Terminal size={14} />
                  <span>{activeStep.telemetry}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Clean ASCII Diagram */}
          {activeViewTab === 'ascii' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  Canonical ASCII System Flow Diagram
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(rawAsciiDiagram);
                    if (onShowToast) onShowToast('ASCII diagram copied to clipboard!', 'success');
                  }}
                >
                  Copy ASCII
                </button>
              </div>

              <pre
                style={{
                  background: 'rgba(5, 7, 15, 0.95)',
                  padding: '1.5rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.9rem',
                  fontFamily: 'Courier New, Courier, monospace',
                  overflowX: 'auto',
                  lineHeight: '1.4',
                  boxShadow: 'inset 0 0 20px rgba(0, 242, 254, 0.05)',
                }}
              >
                {rawAsciiDiagram}
              </pre>

              <div className="alert-card alert-info">
                <strong>Why this Architecture is Superior:</strong>
                <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, fontSize: '0.85rem' }}>
                  <li><strong>Zero Knowledge:</strong> Decryption keys stay with users; server & database only ever see ciphertext.</li>
                  <li><strong>Tamper-Proofing:</strong> File modification invalidates the IPFS CID and fails smart contract verification immediately.</li>
                  <li><strong>Instant Revocation (Crypto-Shredding):</strong> Deleting cryptographic envelopes renders pinned IPFS bytes irreversibly unreadable.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: Tier Specs */}
          {activeViewTab === 'specs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {FLOW_STEPS.map((step) => (
                <div
                  key={step.id}
                  style={{
                    background: 'rgba(15, 22, 38, 0.6)',
                    borderRadius: '14px',
                    border: `1px solid ${step.borderColor}`,
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: step.color }}>
                        STAGE {step.number}
                      </span>
                      <step.icon size={18} color={step.color} />
                    </div>
                    <h5 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                      {step.title}
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {step.description}
                    </p>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {step.tech.map((t, idx) => (
                      <span key={idx} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px', color: 'var(--text-muted)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            background: 'rgba(10, 15, 30, 0.8)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Shield size={14} color="var(--accent-cyan)" />
            <span>Cryptographically Verified Flow &bull; 9 Interconnected Stages</span>
          </div>

          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
            Close Architecture
          </button>
        </div>
      </div>
    </div>
  );
};
