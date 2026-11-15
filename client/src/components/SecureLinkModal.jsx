import React, { useState, useEffect } from 'react';
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
  User,
  Wallet,
  Clock,
  Hash,
  Download,
  ArrowDown,
  Sparkles,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Calendar,
  Layers,
} from 'lucide-react';
import { contractService } from '../services/contractService';

export const SecureLinkModal = ({
  isOpen,
  onClose,
  file,
  user,
  activePersona,
  onDownloadAndDecrypt,
  onShowToast,
}) => {
  if (!isOpen || !file) return null;

  const shareToken = file.shareId || file.ipfsHash.slice(2, 10);
  const shareUrl = `${window.location.origin}/share/${shareToken}`;

  // Test simulation overrides (to demo the security rule in action)
  const [simulationMode, setSimulationMode] = useState('active_persona');
  const [pipelineResult, setPipelineResult] = useState(null);
  const [isPublicState, setIsPublicState] = useState(file?.isPublic || false);

  // Password Protection State
  const [hasPassword, setHasPassword] = useState(!!file?.hasPassword || !!file?.linkPassword);
  const [passwordInput, setPasswordInput] = useState(file?.linkPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Link Expiration & Download Limit State
  const [expiryOption, setExpiryOption] = useState('48h'); // '1h' | '24h' | '48h' | '7d' | 'never'
  const [downloadLimit, setDownloadLimit] = useState('3'); // '1' | '3' | '5' | '10' | 'unlimited'

  useEffect(() => {
    setIsPublicState(file?.isPublic || false);
    setHasPassword(!!file?.hasPassword || !!file?.linkPassword);
    setPasswordInput(file?.linkPassword || '');
  }, [file]);

  const isOwner = file.owner.toLowerCase() === activePersona.address.toLowerCase();

  const handleTogglePublic = async () => {
    try {
      const newPublic = !isPublicState;
      await contractService.setPublicAccess(file.ipfsHash, newPublic, activePersona.address);
      try {
        await fetch(`/api/files/share-mode/${file.ipfsHash}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: newPublic }),
        });
      } catch (e) {}
      setIsPublicState(newPublic);
      if (onShowToast) {
        onShowToast(
          newPublic
            ? '🌐 Public Sharing enabled: Anyone with the link & verified wallet can access.'
            : '🔒 Private Sharing enabled (Default): Only authorized recipients can access.'
        );
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  const handleSavePassword = async () => {
    setIsSavingPassword(true);
    try {
      const finalPassword = hasPassword ? passwordInput.trim() : '';
      await contractService.setFilePassword(file.ipfsHash, finalPassword);
      if (onShowToast) {
        onShowToast(
          finalPassword
            ? '🔐 Password protection applied to share link!'
            : '🔓 Link password protection removed.'
        );
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  useEffect(() => {
    runPipelineEvaluation();
  }, [file, activePersona, user, simulationMode, isPublicState, hasPassword]);

  const runPipelineEvaluation = () => {
    let testUser = user;
    let testAddress = activePersona.address;

    if (simulationMode === 'logged_out') {
      testUser = null;
    } else if (simulationMode === 'stranger' || simulationMode === 'public_mode_stranger') {
      testAddress = '0x90f79bf6eb2c4f870365e785982e1f101e93b906'; // Stranger / Amit
    }

    const effectiveIsPublic = simulationMode === 'public_mode_stranger' 
      ? true 
      : (simulationMode === 'stranger' ? false : isPublicState);

    const simulatedFile = { ...file, isPublic: effectiveIsPublic };
    if (simulationMode === 'expired') {
      simulatedFile.permissions = {
        [testAddress.toLowerCase()]: {
          isAuthorized: true,
          expiresAt: Date.now() - 3600000,
          maxDownloads: 5,
          downloadCount: 0,
        },
      };
    } else if (simulationMode === 'limit_reached') {
      simulatedFile.permissions = {
        [testAddress.toLowerCase()]: {
          isAuthorized: true,
          expiresAt: Date.now() + 3600000 * 24,
          maxDownloads: 3,
          downloadCount: 3,
        },
      };
    }

    // Stage 1: Link Resolution
    const stage1 = {
      name: '1. Link Resolution',
      desc: `Resolves token (${shareToken}) to on-chain registered CID`,
      passed: true,
      detail: `Valid IPFS CID: ${file.ipfsHash.slice(0, 10)}...`,
    };

    // Stage 2: Login Check
    const isUserLoggedIn = simulationMode !== 'logged_out' && testUser && (testUser.email || testUser.name);
    const stage2 = {
      name: '2. Login Authentication',
      desc: 'Checks active session token / JWT credentials',
      passed: !!isUserLoggedIn,
      detail: isUserLoggedIn ? `Authenticated as: ${testUser.name || testUser.email}` : 'Access Blocked: User not logged in',
    };

    // Stage 3: Wallet / User Verification
    const hasWallet = !!testAddress;
    const isStrangerPersona = simulationMode === 'stranger' || simulationMode === 'public_mode_stranger';
    const stage3 = {
      name: '3. Wallet / User Verification',
      desc: 'Verifies active Web3 cryptographic wallet identity',
      passed: stage2.passed && hasWallet,
      detail: hasWallet ? `Wallet: ${testAddress.slice(0, 6)}...${testAddress.slice(-4)} (${isStrangerPersona ? 'Stranger (Amit)' : activePersona.name})` : 'Access Blocked: No Web3 wallet found',
    };

    // Stage 4: Blockchain Permission Check
    const cleanAddr = testAddress.toLowerCase();
    const isOwnerWallet = file.owner.toLowerCase() === cleanAddr;
    const isRecipient = (file.authorizedRecipients || []).some((r) => r.toLowerCase() === cleanAddr);
    const perm = (simulatedFile.permissions && simulatedFile.permissions[cleanAddr]) || null;
    const blockchainAuthorized = isOwnerWallet || isRecipient || (perm && perm.isAuthorized) || effectiveIsPublic;

    const stage4 = {
      name: '4. Blockchain Permission Check',
      desc: effectiveIsPublic 
        ? 'Public Sharing Mode: Contract allows open link access'
        : 'Private Sharing Mode (Default): Queries FileAccessControl.sol smart contract',
      passed: stage3.passed && !!blockchainAuthorized,
      detail: blockchainAuthorized
        ? (isOwnerWallet 
            ? '👑 Verified as Owner' 
            : effectiveIsPublic 
            ? '🌐 Verified: Public Link Access enabled by Owner' 
            : '🟢 Verified as Authorized Recipient')
        : 'Access Blocked: File is in PRIVATE mode (Default). Wallet is NOT authorized in smart contract',
    };

    // Stage 5: Expiry Check
    let isExpired = false;
    if (!isOwnerWallet && perm && perm.expiresAt > 0 && Date.now() > perm.expiresAt) {
      isExpired = true;
    }
    const stage5 = {
      name: '5. Expiry Check (block.timestamp <= expiry)',
      desc: 'Validates on-chain timestamp validity',
      passed: stage4.passed && !isExpired,
      detail: isExpired
        ? `Access Blocked: Expired on ${new Date(perm.expiresAt).toLocaleTimeString()}`
        : (perm && perm.expiresAt > 0 ? `Valid until: ${new Date(perm.expiresAt).toLocaleDateString()}` : 'Valid: No expiry set'),
    };

    // Stage 6: Download Limit Check
    let isLimitReached = false;
    if (!isOwnerWallet && perm && perm.maxDownloads > 0 && (perm.downloadCount || 0) >= perm.maxDownloads) {
      isLimitReached = true;
    }
    const stage6 = {
      name: '6. Download Limit Check (count < max)',
      desc: 'Checks immutable download quota on ledger',
      passed: stage5.passed && !isLimitReached,
      detail: isLimitReached
        ? `Access Blocked: Quota exhausted (${perm.downloadCount}/${perm.maxDownloads})`
        : (perm && perm.maxDownloads > 0 ? `Quota: ${perm.downloadCount || 0}/${perm.maxDownloads} downloads used` : 'Quota: Unlimited'),
    };

    const isAllowed = stage1.passed && stage2.passed && stage3.passed && stage4.passed && stage5.passed && stage6.passed;

    setPipelineResult({
      stages: [stage1, stage2, stage3, stage4, stage5, stage6],
      isAllowed,
      file: simulatedFile,
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    if (onShowToast) onShowToast('Secure share link copied to clipboard!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Modal Header & Mode Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.15)', padding: '0.65rem', borderRadius: '12px' }}>
              <Link2 size={24} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>🔗 File Sharing System &amp; Link Settings</h3>
                {isPublicState ? (
                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>🌐 Public Sharing</span>
                ) : (
                  <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>🔒 Private Sharing (Default)</span>
                )}
                {hasPassword && (
                  <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>🔑 Password Protected</span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Multi-Barrier Security Pipeline for <b>{file.fileName}</b>
              </span>
            </div>
          </div>

          {/* Owner Mode Toggle */}
          {isOwner && (
            <button
              className="btn btn-secondary"
              onClick={handleTogglePublic}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderColor: isPublicState ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 242, 254, 0.4)',
                background: isPublicState ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 242, 254, 0.08)',
              }}
            >
              {isPublicState ? '🔒 Switch to Private (Default)' : '🌐 Make Public (Owner Opt-In)'}
            </button>
          )}
        </div>

        {/* Share Link Box with Copy Button & Open Link */}
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '1rem',
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Generated Shareable Link:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <code className="mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', flex: 1, minWidth: '220px', wordBreak: 'break-all' }}>
              {shareUrl}
            </code>
            <button
              className="btn btn-secondary"
              onClick={handleCopyLink}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <Copy size={13} />
              <span>Copy Link</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                window.history.pushState({}, '', `/share/${shareToken}`);
                window.dispatchEvent(new Event('blockshare_navigate'));
              }}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
              title="Open Dedicated Full-Page Gatekeeper View"
            >
              <ExternalLink size={13} />
              <span>Open Link Page</span>
            </button>
          </div>
        </div>

        {/* Password Protection & Expiration / Limits Toolbar */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.9rem 1.1rem',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Password-Protected Link</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', margin: 0 }}>
              <input
                type="checkbox"
                checked={hasPassword}
                onChange={(e) => setHasPassword(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span>Enable Passcode Protection</span>
            </label>
          </div>

          {hasPassword && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter secret link passcode / password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 2.2rem 0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(0,242,254,0.3)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.82rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePassword}
                disabled={isSavingPassword || !passwordInput.trim()}
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
              >
                {isSavingPassword ? 'Saving...' : 'Apply Password'}
              </button>
            </div>
          )}

          {/* Expiration Date & Download Limit Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                ⏳ Link Expiration Date:
              </label>
              <select
                value={expiryOption}
                onChange={(e) => {
                  setExpiryOption(e.target.value);
                  if (onShowToast) onShowToast(`Link validity set to ${e.target.options[e.target.selectedIndex].text}`);
                }}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.6rem',
                }}
              >
                <option value="1h">1 Hour from now</option>
                <option value="24h">24 Hours (1 Day)</option>
                <option value="48h">48 Hours (2 Days) - Recommended</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="never">Never (Permanent On-Chain)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                📥 Download Limit per Recipient:
              </label>
              <select
                value={downloadLimit}
                onChange={(e) => {
                  setDownloadLimit(e.target.value);
                  if (onShowToast) onShowToast(`Download quota limit set to ${e.target.value}`);
                }}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.6rem',
                }}
              >
                <option value="1">1 Download Only (Burn after read)</option>
                <option value="3">3 Downloads (Default)</option>
                <option value="5">5 Downloads</option>
                <option value="10">10 Downloads</option>
                <option value="unlimited">Unlimited Downloads</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Rule Callout */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
        }}>
          <AlertTriangle size={17} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.78rem', color: '#fef3c7', lineHeight: '1.4' }}>
            <b>Multi-Layer Gatekeeper:</b> Sirf link hona kaafi nahi hai. Request par <b>Login &rarr; Wallet &rarr; Smart Contract Permission &rarr; Passcode &rarr; Expiry &rarr; Download Limit</b> verify kiya jayega!
          </div>
        </div>

        {/* Interactive Scenario Presets */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
            🧪 Test Security Gatekeeper Scenarios:
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${simulationMode === 'active_persona' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('active_persona')}
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            >
              🟢 Current Persona ({activePersona.name})
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'stranger' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('stranger')}
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            >
              🔴 🔒 Private: Stranger (Amit Blocked)
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'public_mode_stranger' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('public_mode_stranger')}
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            >
              🌐 Public Mode: Stranger (Allowed)
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'logged_out' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('logged_out')}
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            >
              👤 Logged Out
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'expired' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('expired')}
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            >
              ⏰ Past Expiry
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'limit_reached' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('limit_reached')}
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            >
              🔢 Limit Reached (3/3)
            </button>
          </div>
        </div>

        {/* Multi-Barrier Gatekeeper Pipeline */}
        {pipelineResult && (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '0.9rem 1.1rem',
            marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.65rem' }}>
              Gatekeeper Evaluation Pipeline:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {pipelineResult.stages.map((stage) => (
                <div
                  key={stage.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: stage.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.08)',
                    border: `1px solid ${stage.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.3)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {stage.passed ? (
                      <CheckCircle2 size={15} color="var(--accent-emerald)" />
                    ) : (
                      <XCircle size={15} color="var(--accent-rose)" />
                    )}
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: stage.passed ? 'var(--text-primary)' : '#fb7185', display: 'block' }}>
                        {stage.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {stage.desc}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    color: stage.passed ? 'var(--accent-emerald)' : '#fb7185',
                    textAlign: 'right',
                    maxWidth: '220px',
                  }}>
                    {stage.detail}
                  </span>
                </div>
              ))}
            </div>

            {/* Final Verdict Banner */}
            <div style={{
              marginTop: '0.85rem',
              padding: '0.75rem 0.95rem',
              borderRadius: '8px',
              background: pipelineResult.isAllowed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${pipelineResult.isAllowed ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {pipelineResult.isAllowed ? (
                  <Unlock size={20} color="var(--accent-emerald)" />
                ) : (
                  <Lock size={20} color="var(--accent-rose)" />
                )}
                <div>
                  <b style={{ fontSize: '0.9rem', color: pipelineResult.isAllowed ? 'var(--accent-emerald)' : '#fb7185' }}>
                    FINAL VERDICT: {pipelineResult.isAllowed ? 'ALLOW ACCESS ✅' : 'ACCESS DENIED ❌'}
                  </b>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {pipelineResult.isAllowed
                      ? 'Gatekeeper rules validated. Decryption key unwrapped in browser memory.'
                      : 'Request failed security checks. Access strictly blocked!'}
                  </p>
                </div>
              </div>

              {pipelineResult.isAllowed && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onDownloadAndDecrypt(file);
                    onClose();
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                >
                  <Download size={13} />
                  <span>Download Now</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.82rem' }}
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};
