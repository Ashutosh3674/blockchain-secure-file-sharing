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
  // Modes: 'active_persona' | 'stranger' | 'public_mode_stranger' | 'logged_out' | 'expired' | 'limit_reached'
  const [simulationMode, setSimulationMode] = useState('active_persona');
  const [pipelineResult, setPipelineResult] = useState(null);
  const [isPublicState, setIsPublicState] = useState(file?.isPublic || false);

  useEffect(() => {
    setIsPublicState(file?.isPublic || false);
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
      onShowToast(
        newPublic
          ? '🌐 Public Sharing enabled: Anyone with the link & verified wallet can access.'
          : '🔒 Private Sharing enabled (Default): Only authorized recipients can access.'
      );
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  useEffect(() => {
    runPipelineEvaluation();
  }, [file, activePersona, user, simulationMode, isPublicState]);

  const runPipelineEvaluation = () => {
    let testUser = user;
    let testAddress = activePersona.address;

    if (simulationMode === 'logged_out') {
      testUser = null;
    } else if (simulationMode === 'stranger' || simulationMode === 'public_mode_stranger') {
      testAddress = '0x90f79bf6eb2c4f870365e785982e1f101e93b906'; // Stranger / Amit
    }

    // Determine effective public access for this evaluation
    const effectiveIsPublic = simulationMode === 'public_mode_stranger' 
      ? true 
      : (simulationMode === 'stranger' ? false : isPublicState);

    // Clone file to simulate conditions if needed
    const simulatedFile = { ...file, isPublic: effectiveIsPublic };
    if (simulationMode === 'expired') {
      simulatedFile.permissions = {
        [testAddress.toLowerCase()]: {
          isAuthorized: true,
          expiresAt: Date.now() - 3600000, // 1 hour ago
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
          downloadCount: 3, // 3 of 3 used!
        },
      };
    }

    // Evaluate 6-Stage Gatekeeper
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
    const isRecipient = file.authorizedRecipients.some((r) => r.toLowerCase() === cleanAddr);
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
    onShowToast('Secure share link copied to clipboard!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        
        {/* Modal Header & Mode Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.15)', padding: '0.65rem', borderRadius: '12px' }}>
              <Link2 size={26} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.3rem', margin: 0 }}>🔗 Secure Sharing Link & Gatekeeper</h3>
                {isPublicState ? (
                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>🌐 Public Mode</span>
                ) : (
                  <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>🔒 Private Mode (Default)</span>
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

        {/* Golden Rule Callout with Private/Public Rule */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem 1.15rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
        }}>
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#fef3c7', lineHeight: '1.45' }}>
            <div style={{ marginBottom: '3px' }}>
              <b>Important Security Principle:</b> Sirf link mil jaana access ke liye sufficient nahi hona chahiye. Application har request par <b>Login &rarr; Wallet &rarr; Blockchain Permission &rarr; Expiry &rarr; Download Limit</b> strictly check karegi!
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              🔒 <b>Private Mode (Default):</b> Ashutosh &rarr; Rahul (Sirf Rahul access kar sakta hai, strangers block ho jate hain).
              <br />
              🌐 <b>Public Mode:</b> Owner ke allow karne par anyone with permission/link can access.
            </div>
          </div>
        </div>

        {/* Share Link Box */}
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '1.25rem',
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Generated Secure Sharing Link:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <code className="mono" style={{ fontSize: '0.88rem', color: 'var(--accent-cyan)', flex: 1, wordBreak: 'break-all' }}>
              {shareUrl}
            </code>
            <button
              className="btn btn-secondary"
              onClick={handleCopyLink}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <Copy size={13} />
              <span>Copy</span>
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

        {/* Interactive Scenario Presets */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            🧪 Test Security Gatekeeper Scenarios:
          </span>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${simulationMode === 'active_persona' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('active_persona')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              🟢 Current Persona ({activePersona.name})
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'stranger' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('stranger')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              🔴 🔒 Private (Default): Stranger (Amit Blocked)
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'public_mode_stranger' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('public_mode_stranger')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              🌐 Public Mode: Stranger (Amit Allowed)
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'logged_out' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('logged_out')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              👤 Logged Out Guest
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'expired' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('expired')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              ⏰ Past Expiry Date
            </button>
            <button
              type="button"
              className={`btn ${simulationMode === 'limit_reached' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSimulationMode('limit_reached')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
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
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
              Gatekeeper Evaluation Pipeline:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {pipelineResult.stages.map((stage, idx) => (
                <div
                  key={stage.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '6px',
                    background: stage.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.08)',
                    border: `1px solid ${stage.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.3)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {stage.passed ? (
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    ) : (
                      <XCircle size={16} color="var(--accent-rose)" />
                    )}
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.84rem', color: stage.passed ? 'var(--text-primary)' : '#fb7185', display: 'block' }}>
                        {stage.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {stage.desc}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
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

            {/* Final Verdict Banner: ALLOW / DENY */}
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: pipelineResult.isAllowed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${pipelineResult.isAllowed ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {pipelineResult.isAllowed ? (
                  <Unlock size={22} color="var(--accent-emerald)" />
                ) : (
                  <Lock size={22} color="var(--accent-rose)" />
                )}
                <div>
                  <b style={{ fontSize: '0.95rem', color: pipelineResult.isAllowed ? 'var(--accent-emerald)' : '#fb7185' }}>
                    FINAL VERDICT: {pipelineResult.isAllowed ? 'ALLOW ACCESS ✅' : 'ACCESS DENIED ❌'}
                  </b>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {pipelineResult.isAllowed
                      ? 'All 6 gatekeeper stages validated. Decryption key can be unwrapped in memory.'
                      : 'Request failed gatekeeper security checks. Access blocked!'}
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
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                >
                  <Download size={14} />
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
            style={{ fontSize: '0.85rem' }}
          >
            Close Gatekeeper
          </button>
        </div>

      </div>
    </div>
  );
};
