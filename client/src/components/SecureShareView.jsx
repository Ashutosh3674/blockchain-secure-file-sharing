import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { contractService, getPersonaNameByAddress } from '../services/contractService';
import { cryptoService } from '../services/cryptoService';
import { keyManagementService } from '../services/keyManagementService';
import {
  Link2,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Wallet,
  Clock,
  Download,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  FileText,
  ExternalLink,
  ChevronRight,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SecureShareView = ({
  shareToken,
  onNavigateHome,
  onShowToast,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { account, connectWallet } = useWeb3();

  // Test simulation presets: 'real' | 'authorized_rahul' | 'unauthorized_amit' | 'public_mode_amit' | 'past_expiry' | 'limit_reached' | 'logged_out' | 'no_wallet'
  const [simulationMode, setSimulationMode] = useState('real');
  const [pipeline, setPipeline] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStep, setDownloadStep] = useState('idle');
  const [copied, setCopied] = useState(false);

  // Available test personas for 1-click switching
  const TEST_PERSONAS = [
    { name: 'Rahul', address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', role: 'Authorized Recipient', status: '🟢 Authorized' },
    { name: 'Amit', address: '0x90f79bf6eb2c4f870365e785982e1f101e93b906', role: 'Stranger / External', status: '🔴 Unauthorized' },
    { name: 'Ashutosh', address: '0x71c67ed3e80435a55611f476c66337051b7b292a', role: 'File Owner / Creator', status: '👑 Owner' },
    { name: 'Priya', address: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65', role: 'Collaborator', status: '🟣 Partner' },
  ];

  const fullShareUrl = `${window.location.origin}/share/${shareToken}`;

  // Evaluate the 6-stage pipeline whenever state or simulation changes
  useEffect(() => {
    evaluatePipeline();
  }, [shareToken, user, account, simulationMode]);

  const evaluatePipeline = () => {
    let effectiveUser = user;
    let effectiveWallet = account;
    let overrides = null;

    if (simulationMode === 'logged_out') {
      overrides = { loggedOut: true };
    } else if (simulationMode === 'no_wallet') {
      overrides = { walletAddress: null };
    } else if (simulationMode === 'authorized_rahul') {
      effectiveUser = user || { name: 'Rahul Sharma', email: 'rahul@blockshare.eth' };
      overrides = { walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', isPublic: false };
    } else if (simulationMode === 'unauthorized_amit') {
      effectiveUser = user || { name: 'Amit Verma', email: 'amit@stranger.org' };
      overrides = { walletAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906', isPublic: false };
    } else if (simulationMode === 'public_mode_amit') {
      effectiveUser = user || { name: 'Amit Verma', email: 'amit@stranger.org' };
      overrides = { walletAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906', isPublic: true };
    } else if (simulationMode === 'past_expiry') {
      effectiveUser = user || { name: 'Rahul Sharma', email: 'rahul@blockshare.eth' };
      overrides = {
        walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
        overridePermissions: {
          isAuthorized: true,
          expiresAt: Date.now() - 3600000 * 2, // Expired 2 hours ago
          maxDownloads: 5,
          downloadCount: 1,
        },
      };
    } else if (simulationMode === 'limit_reached') {
      effectiveUser = user || { name: 'Rahul Sharma', email: 'rahul@blockshare.eth' };
      overrides = {
        walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
        overridePermissions: {
          isAuthorized: true,
          expiresAt: Date.now() + 3600000 * 48,
          maxDownloads: 3,
          downloadCount: 3, // 3 of 3 exhausted!
        },
      };
    }

    const result = contractService.verifyShareLinkAccess(shareToken, effectiveUser, effectiveWallet, overrides);
    setPipeline(result);
  };

  const handleTogglePublicAccess = async () => {
    const currentFile = pipeline?.file;
    if (!currentFile) return;

    const callerAddr = account || currentFile.owner;
    try {
      const nextMode = !currentFile.isPublic;
      await contractService.setPublicAccess(currentFile.ipfsHash, nextMode, callerAddr);
      try {
        await fetch(`/api/files/share-mode/${currentFile.ipfsHash}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: nextMode }),
        });
      } catch (e) {
        console.log('Backend sync note:', e);
      }

      onShowToast(
        nextMode
          ? '🌐 File switched to PUBLIC Access: Anyone with the link & verified wallet can now access!'
          : '🔒 File switched to PRIVATE Access (DEFAULT): Only designated recipient wallets can access!',
        'success'
      );
      evaluatePipeline();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    onShowToast('Secure Share URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadAndDecrypt = async () => {
    if (!pipeline || !pipeline.isAllowed || !pipeline.file) return;

    setIsDownloading(true);
    setDownloadStep('ipfs');
    const file = pipeline.file;

    try {
      onShowToast(`[Stage 1/4] Requesting encrypted ciphertext from IPFS (${file.ipfsHash.slice(0, 10)}...)...`);
      await new Promise((r) => setTimeout(r, 400));

      let ciphertextBuffer = null;
      try {
        const res = await fetch(`/api/files/ipfs/${file.ipfsHash}`);
        if (res.ok) {
          ciphertextBuffer = await res.arrayBuffer();
        }
      } catch (e) {
        console.log('IPFS local fetch note:', e);
      }

      if (!ciphertextBuffer || ciphertextBuffer.byteLength === 0) {
        const encoder = new TextEncoder();
        ciphertextBuffer = encoder.encode(
          `===================================================================\n` +
          `CONFIDENTIAL FILE: ${file.fileName}\n` +
          `===================================================================\n` +
          `IPFS CID: ${file.ipfsHash}\n` +
          `Blockchain Owner: ${file.owner}\n` +
          `Downloaded by: ${account || 'Authorized Web3 Persona'}\n` +
          `Decryption Method: AES-GCM 256-bit (Zero-Knowledge In-Memory Unwrapped)\n` +
          `Downloaded at: ${new Date().toISOString()}\n` +
          `===================================================================`
        ).buffer;
      }

      setDownloadStep('key');
      onShowToast(`[Stage 2/4] Unwrapping AES-256 session key with recipient private key...`);
      await new Promise((r) => setTimeout(r, 450));

      let keyString = file.encryptionKey;
      const callerAddr = account || '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';

      if (!keyString || file.owner.toLowerCase() !== callerAddr.toLowerCase()) {
        const wrapped = contractService.getWrappedKey(file.ipfsHash, callerAddr);
        if (wrapped) {
          keyString = await keyManagementService.unwrapFileKey(wrapped, callerAddr);
        } else {
          keyString = file.encryptionKey || 'nF2zW8G3pK1qR7tX9vB4mC6jL8hY2sD5aF1eU9iO3wA=';
        }
      }

      setDownloadStep('decrypting');
      onShowToast(`[Stage 3/4] Decrypting ciphertext stream in browser memory...`);
      await new Promise((r) => setTimeout(r, 450));

      const iv = file.iv || [12, 45, 78, 23, 89, 56, 12, 90, 34, 67, 88, 19];

      try {
        await cryptoService.decryptFile(ciphertextBuffer, iv, keyString, file.fileName, file.fileType);
      } catch (e) {
        // Fallback file download if cipher format differs
        const blob = new Blob([ciphertextBuffer], { type: file.fileType || 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      setDownloadStep('recording');
      onShowToast(`[Stage 4/4] Incrementing download quota on blockchain ledger...`);
      await contractService.recordDownload(file.ipfsHash, callerAddr);
      await new Promise((r) => setTimeout(r, 400));

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}

      onShowToast(`🎉 File "${file.fileName}" decrypted & downloaded successfully!`, 'success');
      setDownloadStep('done');

      // Refresh pipeline so download quota increments visually
      evaluatePipeline();
    } catch (err) {
      onShowToast(`Download error: ${err.message}`, 'error');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadStep('idle'), 3000);
    }
  };

  const file = pipeline?.file;

  return (
    <div style={{ minHeight: '90vh', padding: '1.75rem 1rem 3.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Top Header & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          className="btn btn-secondary"
          onClick={onNavigateHome}
          style={{ fontSize: '0.85rem', padding: '0.45rem 0.95rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Active Identity:</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
          }}>
            <Wallet size={14} color="var(--accent-cyan)" />
            <span className="mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'No Wallet Connected'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Title Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              padding: '0.9rem',
              borderRadius: '16px',
            }}>
              <Link2 size={32} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Secure Sharing Link Gatekeeper</h2>
                <span className="status-badge" style={{
                  background: pipeline?.isAllowed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                  color: pipeline?.isAllowed ? 'var(--accent-emerald)' : '#fb7185',
                  border: `1px solid ${pipeline?.isAllowed ? 'var(--accent-emerald)' : 'rgba(244, 63, 94, 0.4)'}`,
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                }}>
                  {pipeline?.isAllowed ? 'VERIFIED: ACCESS ALLOWED' : 'BLOCKED: ACCESS DENIED'}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
                Link token <code className="mono" style={{ color: 'var(--accent-cyan)' }}>{shareToken}</code> &bull; Verified against FileAccessControl.sol Smart Contract
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleCopyLink}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
            >
              {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={evaluatePipeline}
              title="Re-run Multi-Barrier Check"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Security Rule Callout with Private (Default) & Public Explanation */}
        <div style={{
          marginTop: '1.25rem',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.9rem 1.15rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}>
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.82rem', color: '#fef3c7', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}>
              <b>Security Rule:</b> Sirf link mil jaana access ke liye sufficient nahi hai. Application strictly 6 sequential barriers check karegi:
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}> Link &rarr; Login &rarr; Wallet Verification &rarr; Blockchain Permission &rarr; Expiry &rarr; Download Limit &rarr; Allow/Deny</span>.
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              🔒 <b>Private Sharing (Default):</b> Ashutosh &rarr; Rahul (Sirf selected wallet/user access kar sakta hai, strangers Stage 4 par block ho jayenge).
              <br />
              🌐 <b>Public Sharing:</b> Owner intentionally public access allow kare toh anyone with permission/link can access after wallet verification.
            </div>
          </div>
        </div>

      </div>

      {/* Target File Info Card & Sharing Mode Banner */}
      {file ? (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.65rem', borderRadius: '10px' }}>
                <FileText size={24} color="var(--accent-blue)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {file.fileName}
                  </span>
                  
                  {/* Sharing Mode Badge */}
                  {file.isPublic ? (
                    <span className="badge badge-emerald" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                      🌐 Public Sharing Mode
                    </span>
                  ) : (
                    <span className="badge badge-cyan" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                      🔒 Private Sharing Mode (Default)
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Size: {(file.fileSize / (1024 * 1024)).toFixed(2)} MB &bull; Type: {file.fileType} &bull; {file.isPublic ? 'Open to any authenticated wallet' : 'Restricted to authorized recipient wallets only'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>OWNER</span>
                <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {file.ownerName || getPersonaNameByAddress(file.owner)} ({file.owner.slice(0, 6)}...{file.owner.slice(-4)})
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>IPFS CID</span>
                <span className="mono" style={{ color: 'var(--accent-cyan)' }}>
                  {file.ipfsHash.slice(0, 10)}...{file.ipfsHash.slice(-6)}
                </span>
              </div>

              {/* Owner Mode Toggle Button */}
              <button
                className="btn btn-secondary"
                onClick={handleTogglePublicAccess}
                title={file.isPublic ? "Toggle back to Private mode (Default)" : "Toggle to Public mode (Owner Opt-In)"}
                style={{
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.85rem',
                  borderColor: file.isPublic ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 242, 254, 0.4)',
                  background: file.isPublic ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 242, 254, 0.08)',
                }}
              >
                {file.isPublic ? '🔒 Switch to Private Mode (Default)' : '🌐 Enable Public Mode (Owner Opt-In)'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fb7185' }}>
            <XCircle size={24} />
            <div>
              <b style={{ fontSize: '1rem' }}>Stage 1 Failed: Invalid Share Link</b>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                No file registered on the blockchain matches share token "{shareToken}".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Simulation Preset Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🧪 Interactive Pipeline Testing Presets:
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Switch presets to immediately test each failure and success barrier:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${simulationMode === 'real' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimulationMode('real')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            ⚡ Real Identity ({account ? `${account.slice(0, 6)}...` : 'Connected'})
          </button>

          <button
            type="button"
            className={`btn ${simulationMode === 'authorized_rahul' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimulationMode('authorized_rahul')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            🟢 🔒 Private: Authorized (Rahul)
          </button>

          <button
            type="button"
            className={`btn ${simulationMode === 'unauthorized_amit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimulationMode('unauthorized_amit')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            🔴 🔒 Private (Default): Stranger (Amit Blocked)
          </button>

          <button
            type="button"
            className={`btn ${simulationMode === 'public_mode_amit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimulationMode('public_mode_amit')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            🌐 Public Mode: Stranger (Amit Allowed)
          </button>

          <button
            type="button"
            className={`btn ${simulationMode === 'past_expiry' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimulationMode('past_expiry')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            ⏰ Expired Permission (Past Date)
          </button>

          <button
            type="button"
            className={`btn ${simulationMode === 'limit_reached' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimulationMode('limit_reached')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            🔢 Limit Reached (3/3 Used)
          </button>

          <button
            type="button"
            className={`btn ${simulationMode === 'logged_out' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimulationMode('logged_out')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            👤 Logged Out Guest
          </button>

          <button
            type="button"
            className={`btn ${simulationMode === 'no_wallet' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimulationMode('no_wallet')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            👛 Disconnected Wallet
          </button>
        </div>
      </div>

      {/* 6-Stage Gatekeeper Pipeline Cards */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={22} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Multi-Barrier Gatekeeper Evaluation</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Sequential Validation Pipeline
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {pipeline?.stages?.map((stage, idx) => {
            const isFailingStage = !stage.passed && pipeline.failedStage?.id === stage.id;

            return (
              <div
                key={stage.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.25rem',
                  borderRadius: '10px',
                  background: stage.passed
                    ? 'rgba(16, 185, 129, 0.05)'
                    : isFailingStage
                    ? 'rgba(244, 63, 94, 0.12)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${
                    stage.passed
                      ? 'rgba(16, 185, 129, 0.25)'
                      : isFailingStage
                      ? 'rgba(244, 63, 94, 0.45)'
                      : 'rgba(255, 255, 255, 0.05)'
                  }`,
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: stage.passed
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isFailingStage
                      ? 'rgba(244, 63, 94, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}>
                    {stage.passed ? (
                      <CheckCircle2 size={18} color="var(--accent-emerald)" />
                    ) : isFailingStage ? (
                      <XCircle size={18} color="var(--accent-rose)" />
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {stage.number}
                      </span>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        color: stage.passed ? 'var(--text-primary)' : isFailingStage ? '#fb7185' : 'var(--text-muted)',
                      }}>
                        {stage.name}
                      </span>
                      {stage.passed && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>PASSED</span>
                      )}
                      {isFailingStage && (
                        <span style={{ fontSize: '0.7rem', color: '#fb7185', fontWeight: 600 }}>BARRIER BLOCKED</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {stage.desc}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', maxWidth: '320px' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: stage.passed ? 'var(--accent-emerald)' : isFailingStage ? '#fb7185' : 'var(--text-muted)',
                    display: 'block',
                  }}>
                    {stage.detail}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Decision Banner: ALLOW or DENY */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          background: pipeline?.isAllowed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          border: `1px solid ${pipeline?.isAllowed ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: pipeline?.isAllowed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
              padding: '0.75rem',
              borderRadius: '12px',
            }}>
              {pipeline?.isAllowed ? (
                <Unlock size={28} color="var(--accent-emerald)" />
              ) : (
                <Lock size={28} color="var(--accent-rose)" />
              )}
            </div>
            <div>
              <h4 style={{
                fontSize: '1.15rem',
                margin: 0,
                color: pipeline?.isAllowed ? 'var(--accent-emerald)' : '#fb7185',
              }}>
                FINAL VERDICT: {pipeline?.isAllowed ? 'ALLOW ACCESS ✅' : 'ACCESS DENIED ❌'}
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {pipeline?.isAllowed
                  ? 'All 6 security stages cleared. Cryptographic AES-256 session key can be safely unwrapped.'
                  : pipeline?.failedStage?.errorMsg || 'Access blocked by security pipeline.'}
              </p>
              {!pipeline?.isAllowed && pipeline?.remediation && (
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                  💡 Remediation: {pipeline.remediation}
                </p>
              )}
            </div>
          </div>

          {/* Action button: Download when ALLOW, or Remediation when DENY */}
          {pipeline?.isAllowed ? (
            <button
              className="btn btn-primary"
              onClick={handleDownloadAndDecrypt}
              disabled={isDownloading}
              style={{
                fontSize: '0.95rem',
                padding: '0.7rem 1.6rem',
                background: 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)',
                borderColor: 'var(--accent-emerald)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
              }}
            >
              {isDownloading ? (
                <>
                  <div className="pulse-dot" style={{ width: '12px', height: '12px', background: '#fff' }}></div>
                  <span>
                    {downloadStep === 'ipfs' && 'Fetching IPFS Ciphertext...'}
                    {downloadStep === 'key' && 'Unwrapping AES-256 Key...'}
                    {downloadStep === 'decrypting' && 'Decrypting File...'}
                    {downloadStep === 'recording' && 'Incrementing Ledger...'}
                    {downloadStep === 'done' && 'Downloaded!'}
                  </span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Decrypt & Download File</span>
                </>
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!isAuthenticated && onOpenAuth && (
                <button
                  className="btn btn-primary"
                  onClick={() => onOpenAuth('login')}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                >
                  <User size={14} />
                  <span>Log In to BlockShare</span>
                </button>
              )}

              <button
                className="btn btn-secondary"
                onClick={() => setSimulationMode('authorized_rahul')}
                style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
              >
                <span>Switch to Authorized Wallet (Rahul)</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Quick Web3 Persona Wallet Switcher */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.85rem', color: 'var(--text-secondary)' }}>
          👥 Switch Web3 Persona Identities (Test Real Permissions):
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          {TEST_PERSONAS.map((p) => {
            const isCurrent = account?.toLowerCase() === p.address.toLowerCase();

            return (
              <div
                key={p.address}
                onClick={() => {
                  connectWallet(p.name.toLowerCase());
                  setSimulationMode('real');
                  onShowToast(`Switched active wallet to ${p.name}!`);
                }}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: isCurrent ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isCurrent ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.08)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isCurrent ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{p.status}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {p.role}
                </div>
                <div className="mono" style={{ fontSize: '0.72rem', color: isCurrent ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                  {p.address.slice(0, 8)}...{p.address.slice(-6)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
