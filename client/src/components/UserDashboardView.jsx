import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import {
  Shield,
  Key,
  Wallet,
  CheckCircle2,
  Copy,
  Lock,
  FileCheck,
  Cpu,
  Database,
  Sparkles,
  Link2,
  Blocks,
  BarChart3,
  Upload,
  FileText,
  Activity,
  Star,
  Download,
  AlertCircle,
  Home,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FileShareManager } from './FileShareManager';
import { AnalyticsView } from './AnalyticsView';
import { contractService, getStoredLogs } from '../services/contractService';

export const UserDashboardView = ({ onShowToast, onNavigateHome }) => {
  const { user, linkWallet } = useAuth();
  const { account, networkName, balance, connectWallet, isConnecting } = useWeb3();

  const [copied, setCopied] = useState(false);
  const [linking, setLinking] = useState(false);
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'analytics' | 'wallet' | 'encryption_lab'

  // Dynamic real-time personal stats & activity logs
  const displayWallet = user?.walletAddress || account;
  const [stats, setStats] = useState({
    filesUploaded: 0,
    filesDownloaded: 0,
    filesShared: 0,
    activePermissions: 0,
    expiredPermissions: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const loadRealData = () => {
      const liveStats = contractService.getBlockchainStats(displayWallet);
      setStats(liveStats);
      const logs = getStoredLogs();
      setRecentLogs(logs.slice(0, 5));
    };
    loadRealData();
    window.addEventListener('storage', loadRealData);
    return () => window.removeEventListener('storage', loadRealData);
  }, [displayWallet]);

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
      const randomHash = 'Qm' + Array.from(crypto.getRandomValues(new Uint8Array(22))).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 44);
      setEncryptedHash(randomHash);
      try { confetti({ particleCount: 40 }); } catch {}
      onShowToast('File encrypted with AES-256-GCM and mapped to IPFS CID hash!');
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem 4rem' }}>
      
      {/* 🌟 Welcome Banner - User Workspace */}
      <div className="glass-panel" style={{ padding: '2rem 2.5rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '220px',
          height: '220px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-emerald">
                <span className="pulse-dot"></span>
                User Workspace
              </span>
              <span className="badge badge-cyan">
                Role: Verified Client
              </span>
            </div>
            <h1 style={{ fontSize: '2.1rem', marginBottom: '0.5rem' }}>
              Welcome back, <span className="gradient-text">{user?.name || 'Client'}</span>!
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Upload encrypted files, grant decentralized access with time-locks &amp; download limits, and verify cryptographic integrity on the blockchain.
            </p>
          </div>

          {/* User Workspace Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {onNavigateHome && (
              <button
                className="btn btn-secondary"
                onClick={onNavigateHome}
                title="Return to Home Page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.85rem',
                  padding: '0.45rem 0.95rem',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Home size={15} />
                <span>Home Page</span>
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('files')}
              style={{
                background: activeTab === 'files' ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'rgba(16, 185, 129, 0.12)',
                color: activeTab === 'files' ? '#050b14' : 'var(--accent-emerald)',
                border: '1px solid var(--accent-emerald)',
              }}
            >
              <FileText size={16} />
              <span>My Files &amp; Shares</span>
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
              <span>Personal Analytics</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('wallet')}
              style={{
                borderColor: activeTab === 'wallet' ? 'var(--accent-cyan)' : undefined,
                background: activeTab === 'wallet' ? 'rgba(0, 242, 254, 0.1)' : undefined,
                color: activeTab === 'wallet' ? 'var(--accent-cyan)' : undefined,
              }}
            >
              <Wallet size={16} />
              <span>Web3 Identity</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('encryption_lab')}
              style={{
                borderColor: activeTab === 'encryption_lab' ? 'var(--accent-cyan)' : undefined,
                background: activeTab === 'encryption_lab' ? 'rgba(0, 242, 254, 0.1)' : undefined,
              }}
            >
              <Lock size={16} />
              <span>Encryption Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📊 Personal KPI Headline Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>My Uploaded Files</span>
            <div style={{ background: 'rgba(0, 242, 254, 0.15)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent-cyan)' }}>
              <Upload size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.filesUploaded}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Encrypted with AES-256</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Files Shared By Me</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent-emerald)' }}>
              <Blocks size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.filesShared}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Smart Contract Permissions</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Access Grants</span>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '0.5rem', borderRadius: '8px', color: '#c084fc' }}>
              <Key size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.activePermissions}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>Time &amp; Download Protected</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>My Downloads</span>
            <div style={{ background: 'rgba(249, 115, 22, 0.15)', padding: '0.5rem', borderRadius: '8px', color: '#fb923c' }}>
              <Download size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.filesDownloaded}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#fb923c' }}>Client-Side Decrypted</span>
        </div>

      </div>

      {/* 📁 TAB 1: Files & Sharing Manager */}
      {activeTab === 'files' && (
        <FileShareManager onShowToast={onShowToast} />
      )}

      {/* 📊 TAB 2: Personal Analytics */}
      {activeTab === 'analytics' && (
        <AnalyticsView onShowToast={onShowToast} />
      )}

      {/* 💼 TAB 3: Web3 Identity & Profile */}
      {activeTab === 'wallet' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet className="text-cyan" size={22} />
              <span>Web3 Wallet &amp; Identity</span>
            </h3>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Account</label>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.name || 'User'} ({user?.email})
              </div>
              <span className="badge badge-emerald" style={{ marginTop: '0.35rem', display: 'inline-block' }}>
                Role: Verified User
              </span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Web3 Address</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontFamily: 'monospace',
                fontSize: '0.88rem',
              }}>
                <span style={{ color: displayWallet ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {displayWallet || 'No wallet linked yet'}
                </span>
                {displayWallet && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleCopy(displayWallet)}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    {copied ? <CheckCircle2 size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>

            {(!user?.walletAddress || (account && account.toLowerCase() !== user.walletAddress.toLowerCase())) && (
              <button
                className="btn btn-primary"
                onClick={handleLinkCurrentWallet}
                disabled={linking}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <Link2 size={16} />
                <span>{linking ? 'Linking Wallet...' : account ? 'Link Connected MetaMask to Profile' : 'Connect & Link MetaMask'}</span>
              </button>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity className="text-emerald" size={22} />
              <span>Recent Activity Log</span>
            </h3>

            {recentLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{log.event}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()} &bull; {log.caller ? `${log.caller.slice(0, 6)}...${log.caller.slice(-4)}` : 'System'}
                      </div>
                    </div>
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>Ledger Recorded</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <Activity size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p>No recent activity logs yet. Upload or share a file to generate tamper-proof blockchain ledger events.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 🧪 TAB 4: Encryption Sandbox Lab */}
      {activeTab === 'encryption_lab' && (
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ maxWidth: '750px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'inline-flex',
                padding: '0.85rem',
                borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.1)',
                color: 'var(--accent-cyan)',
                marginBottom: '1rem',
              }}>
                <Lock size={32} />
              </div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Client-Side Zero-Knowledge Encryption Lab</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Test how files are converted into AES-256-GCM ciphertext in your browser before ever touching IPFS storage nodes.
              </p>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}>
              <label className="form-label">Simulated File Name</label>
              <input
                type="text"
                className="form-input"
                value={demoFileName}
                onChange={(e) => setDemoFileName(e.target.value)}
                placeholder="filename.pdf"
                style={{ marginBottom: '1rem' }}
              />

              <button
                className="btn btn-primary"
                onClick={handleSimulateEncryption}
                disabled={isEncrypting}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                <Sparkles size={18} />
                <span>{isEncrypting ? 'Encrypting with AES-256-GCM...' : 'Simulate Client-Side Encryption & IPFS Pinning'}</span>
              </button>
            </div>

            {encryptedHash && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: '600', marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={18} />
                  <span>File Successfully Encrypted &amp; Pinned</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <b>Resulting IPFS Content Identifier (CID):</b>
                </div>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: 'var(--accent-cyan)',
                  wordBreak: 'break-all',
                }}>
                  {encryptedHash}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
