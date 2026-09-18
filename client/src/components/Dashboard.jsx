import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import {
  Shield,
  Key,
  Wallet,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Layers,
  FileCheck,
  Cpu,
  ArrowUpRight,
  Database,
  Sparkles,
  Link2,
  Blocks,
  BarChart3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FileShareManager } from './FileShareManager';
import { AnalyticsView } from './AnalyticsView';

export const Dashboard = ({ onShowToast }) => {
  const { user, linkWallet } = useAuth();
  const { account, networkName, balance, connectWallet, isConnecting } = useWeb3();

  const [copied, setCopied] = useState(false);
  const [linking, setLinking] = useState(false);
  const [activeTab, setActiveTab] = useState('sharing');

  // Interactive mock encryption demo state
  const [demoFileName, setDemoFileName] = useState('My_Confidential_Document.pdf');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedHash, setEncryptedHash] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkCurrentWallet = async () => {
    if (!account) {
      const res = await connectWallet(true);
      if (res.success && res.address) {
        setLinking(true);
        const linkRes = await linkWallet(res.address);
        setLinking(false);
        if (linkRes.success) {
          try { confetti({ particleCount: 60 }); } catch {}
          onShowToast('Web3 Wallet successfully linked to your account!');
        }
      }
      return;
    }

    setLinking(true);
    const res = await linkWallet(account);
    setLinking(false);
    if (res.success) {
      try { confetti({ particleCount: 60 }); } catch {}
      onShowToast('Web3 Wallet linked to account profile!');
    } else {
      onShowToast(res.error || 'Failed to link wallet', 'error');
    }
  };

  const handleSimulateEncryption = () => {
    setIsEncrypting(true);
    setEncryptedHash(null);
    setTimeout(() => {
      setIsEncrypting(false);
      setEncryptedHash('QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco');
      try { confetti({ particleCount: 40 }); } catch {}
      onShowToast('Sample file encrypted with AES-256 and mapped to IPFS CID hash!');
    }, 1200);
  };

  const displayWallet = user?.walletAddress || account;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem 4rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: '2rem 2.5rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '220px',
          height: '220px',
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-emerald">
                <span className="pulse-dot"></span>
                Session Active (JWT Protected)
              </span>
              <span className="badge badge-cyan">Feature 1 & 2 Active</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
              Welcome back, <span className="gradient-text">{user?.name || 'Ashutosh'}</span>!
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '1rem' }}>
              Your account is cryptographically secured with <b>bcrypt (10 salt rounds)</b> and linked to Ethereum EVM Smart Contract Access Control.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('sharing')}
              style={{
                background: activeTab === 'sharing' ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : 'rgba(0, 242, 254, 0.12)',
                color: activeTab === 'sharing' ? '#050b14' : 'var(--accent-cyan)',
                border: '1px solid var(--accent-cyan)',
              }}
            >
              <Blocks size={16} />
              <span>Smart Contract Access Control</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('analytics')}
              style={{
                borderColor: activeTab === 'analytics' ? 'var(--accent-cyan)' : undefined,
                background: activeTab === 'analytics' ? 'rgba(0, 242, 254, 0.15)' : undefined,
                color: activeTab === 'analytics' ? 'var(--accent-cyan)' : undefined,
              }}
            >
              <BarChart3 size={16} />
              <span>Analytics & Graphs</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('overview')}
              style={{
                borderColor: activeTab === 'overview' ? 'var(--accent-cyan)' : undefined,
                background: activeTab === 'overview' ? 'rgba(0, 242, 254, 0.1)' : undefined,
              }}
            >
              Profile & Wallet
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('roadmap')}
              style={{
                borderColor: activeTab === 'roadmap' ? 'var(--accent-cyan)' : undefined,
                background: activeTab === 'roadmap' ? 'rgba(0, 242, 254, 0.1)' : undefined,
              }}
            >
              Architecture
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('simulator')}
              style={{
                borderColor: activeTab === 'simulator' ? 'var(--accent-cyan)' : undefined,
                background: activeTab === 'simulator' ? 'rgba(0, 242, 254, 0.1)' : undefined,
              }}
            >
              <Sparkles size={16} />
              <span>Encryption Lab</span>
            </button>
          </div>
        </div>

        {/* Quick Statistics Snapshot Bar */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Files uploaded:</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.75rem', fontWeight: 700 }}>28</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Files downloaded:</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.75rem', fontWeight: 700 }}>142</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Files shared:</span>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem', fontWeight: 700 }}>47</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active permissions:</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.75rem', fontWeight: 700 }}>34</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expired permissions:</span>
              <span className="badge badge-amber" style={{ fontSize: '0.75rem', fontWeight: 700 }}>13</span>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('analytics')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <BarChart3 size={13} />
            <span>View Full Graphs &rarr;</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.75rem' }}>
          
          {/* Card 1: User Profile & Security Details */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(79, 172, 254, 0.15)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Key size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>User Profile & Auth</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mongoose Schema & MongoDB Storage</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</span>
                <p style={{ fontSize: '1.05rem', fontWeight: '600', marginTop: '2px' }}>{user?.name}</p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
                <p style={{ fontSize: '1.05rem', fontWeight: '500', marginTop: '2px' }}>{user?.email}</p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Role & Security</span>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-cyan">Role: {user?.role || 'User'}</span>
                  <span className="badge badge-emerald">
                    <CheckCircle2 size={12} />
                    bcrypt 10-Salt
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Since</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Today'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Linked Web3 Blockchain Wallet */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(245, 130, 32, 0.15)',
                  color: '#fca34d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Web3 Wallet Address</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ethereum / Polygon EVM Identity</p>
                </div>
              </div>

              {displayWallet ? (
                <span className="badge badge-emerald">
                  <CheckCircle2 size={12} />
                  Linked
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                  Unlinked
                </span>
              )}
            </div>

            {displayWallet ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Linked Public Key:</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', gap: '0.5rem' }}>
                    <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                      {displayWallet}
                    </span>
                    <button
                      onClick={() => handleCopy(displayWallet)}
                      title="Copy Address"
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.5rem', borderRadius: '6px' }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Network</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px', color: '#a78bfa' }}>
                      {networkName || 'Sepolia Testnet'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Balance</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px', color: 'var(--accent-emerald)' }}>
                      {balance ? `${balance} ETH` : '0.00 ETH'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <a
                    href={`https://sepolia.etherscan.io/address/${displayWallet}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.82rem', padding: '0.55rem' }}
                  >
                    <ExternalLink size={14} />
                    <span>View on Etherscan</span>
                  </a>

                  {account && account.toLowerCase() !== user?.walletAddress?.toLowerCase() && (
                    <button
                      className="btn btn-primary"
                      onClick={handleLinkCurrentWallet}
                      disabled={linking}
                      style={{ flex: 1, fontSize: '0.82rem', padding: '0.55rem' }}
                    >
                      <Link2 size={14} />
                      <span>{linking ? 'Linking...' : 'Update Wallet'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  No Web3 wallet is currently linked to your user profile. Link your MetaMask wallet to enable smart-contract access control.
                </p>
                <button
                  className="btn btn-wallet"
                  onClick={handleLinkCurrentWallet}
                  disabled={linking || isConnecting}
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  <Wallet size={18} />
                  <span>{isConnecting ? 'Connecting...' : 'Connect & Link MetaMask'}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab: Architecture & Complete Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Decentralized Architecture & Feature Roadmap
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Overview of the full 5-stage architecture of <b>Secure File Sharing with Blockchain</b>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Step 1 */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}>
              <div style={{
                background: 'var(--accent-emerald)',
                color: '#050b14',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                flexShrink: 0,
              }}>1</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>User Registration & Login (Current Stage)</h4>
                  <span className="badge badge-emerald">Live & Operational</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                  User account registration with <code>bcrypt</code> password hashing, signed JWT authentication, and Web3 wallet address linking (<code>0x...</code>).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{
              background: 'rgba(0, 242, 254, 0.05)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}>
              <div style={{
                background: 'rgba(0, 242, 254, 0.2)',
                color: 'var(--accent-cyan)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                flexShrink: 0,
              }}>2</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>Client-Side File Encryption (AES-GCM 256)</h4>
                  <span className="badge badge-cyan">Next Feature</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                  Files are encrypted locally on the user's browser before transmission using symmetric key AES-GCM 256-bit. Even servers or network sniffers can never view the plain contents.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                flexShrink: 0,
              }}>3</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.1rem' }}>IPFS Distributed Storage</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                  Encrypted ciphertext chunks are uploaded to IPFS (InterPlanetary File System), returning an immutable content identifier (CID hash like <code>Qm...</code>).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                flexShrink: 0,
              }}>4</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.1rem' }}>Solidity Smart Contract (Access Control on Blockchain)</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                  Smart contract records file metadata, owner wallet, and allowed recipient addresses. Only authorized addresses can decrypt or access the file.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab: Encryption Simulator */}
      {activeTab === 'simulator' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0,242,254,0.2) 0%, rgba(139,92,246,0.2) 100%)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>Feature Preview: File Encryption & IPFS Mapping Lab</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Test the cryptographic workflow that binds your identity (<b>{user?.name}</b>) and linked wallet to an encrypted file.
              </p>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Simulate Sample File Name</label>
              <input
                type="text"
                value={demoFileName}
                onChange={(e) => setDemoFileName(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={handleSimulateEncryption}
                disabled={isEncrypting}
              >
                {isEncrypting ? 'Encrypting with AES-256...' : 'Run Client-Side Encryption'}
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Target Wallet: <code className="mono" style={{ color: 'var(--accent-cyan)' }}>{displayWallet || '0x71c...92a'}</code>
              </span>
            </div>

            {encryptedHash && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={18} />
                  <span>Encryption & CID Generated Successfully!</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  File: <b>{demoFileName}</b> &bull; Encrypted using AES-GCM (256-bit key) &bull; Signer: <b>{user?.name}</b>
                </p>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ color: 'var(--accent-cyan)' }}>IPFS CID: {encryptedHash}</span>
                  <button onClick={() => handleCopy(encryptedHash)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    Copy CID
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Smart Contract File Sharing & Access Control */}
      {activeTab === 'sharing' && (
        <FileShareManager onShowToast={onShowToast} />
      )}

      {/* Tab: Real-Time Analytics & Dashboard Graphs */}
      {activeTab === 'analytics' && (
        <AnalyticsView onShowToast={onShowToast} />
      )}

    </div>
  );
};
