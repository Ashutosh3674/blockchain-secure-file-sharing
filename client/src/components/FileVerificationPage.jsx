import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Lock,
  ExternalLink,
  ArrowLeft,
  UploadCloud,
  FileCheck,
  Cpu,
  Sparkles,
  Layers,
} from 'lucide-react';

/**
 * 🔎 FileVerificationPage.jsx
 * Dedicated File Integrity Verification Page
 *
 * Requirements:
 * Ek separate page:
 *         FILE VERIFICATION
 *
 * Enter File ID:
 * [ 101 ]
 *
 * Blockchain Hash:
 * A91F8C...
 *
 * Current File Hash:
 * A91F8C...
 *
 * Result:
 *        ✅ FILE VERIFIED
 *
 * Agar hash mismatch:
 *        ❌ FILE MODIFIED
 */
export const FileVerificationPage = ({ onNavigateHome, onShowToast }) => {
  const [fileIdInput, setFileIdInput] = useState('101');
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [simulateTamper, setSimulateTamper] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  // File integrity state
  const [verificationData, setVerificationData] = useState({
    fileId: '101',
    fileName: 'Project.pdf',
    blockchainHash: 'A91F8C28D73E1054FA6B7E129038475610293847561029384756102938475610',
    blockchainHashShort: 'A91F8C...',
    currentFileHash: 'A91F8C28D73E1054FA6B7E129038475610293847561029384756102938475610',
    currentFileHashShort: 'A91F8C...',
    isVerified: true,
    result: 'FILE VERIFIED',
    statusText: '✅ FILE VERIFIED',
    blockNumber: '#893721',
    timestamp: '18 Sept 2026',
    tamperDetails: null,
  });

  const SAMPLE_PRESETS = [
    {
      id: '101',
      label: '101 (Project.pdf - Authentic)',
      desc: 'Matches blockchain hash perfectly',
    },
    {
      id: '102',
      label: '102 (Modified / Tampered)',
      desc: 'Simulates modified content & hash mismatch',
    },
    {
      id: '103',
      label: '103 (Architecture Diagram)',
      desc: 'Authentic diagram asset',
    },
  ];

  const fetchVerification = async (targetId = fileIdInput, forceTamper = simulateTamper) => {
    setLoading(true);
    try {
      const res = await fetch('/api/files/verify-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: targetId,
          simulateTamper: forceTamper,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVerificationData({
          fileId: data.fileId,
          fileName: data.fileName,
          blockchainHash: data.blockchainHash,
          blockchainHashShort: data.blockchainHashShort || data.blockchainHash.slice(0, 6) + '...',
          currentFileHash: data.currentFileHash,
          currentFileHashShort: data.currentFileHashShort || data.currentFileHash.slice(0, 6) + '...',
          isVerified: data.isVerified,
          result: data.result,
          statusText: data.statusText,
          blockNumber: '#893721',
          timestamp: data.timestamp || '18 Sept 2026',
          tamperDetails: !data.isVerified
            ? 'Cryptographic hash mismatch: Current file byte stream does not match the immutable blockchain SHA-256 digest.'
            : null,
        });

        if (onShowToast) {
          if (data.isVerified) {
            onShowToast(`File ${data.fileId} verified: SHA-256 hash matches blockchain!`, 'success');
          } else {
            onShowToast(`Warning: File ${data.fileId} hash mismatch! File has been modified.`, 'error');
          }
        }
      }
    } catch (err) {
      console.log('Verification fetch fallback:', err);
    } finally {
      setTimeout(() => setLoading(false), 250);
    }
  };

  useEffect(() => {
    fetchVerification('101', false);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!fileIdInput.trim()) return;
    fetchVerification(fileIdInput.trim(), simulateTamper);
  };

  const handleToggleTamper = () => {
    const nextTamper = !simulateTamper;
    setSimulateTamper(nextTamper);
    fetchVerification(fileIdInput.trim(), nextTamper);
  };

  const handleSelectPreset = (id) => {
    setFileIdInput(id);
    const isTamperDefault = id === '102';
    setSimulateTamper(isTamperDefault);
    fetchVerification(id, isTamperDefault);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setLoading(true);

    try {
      // Calculate real SHA-256 hash in browser
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(digest));
      const computedHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      const isMatch = computedHex === verificationData.blockchainHash.toUpperCase();

      setVerificationData((prev) => ({
        ...prev,
        fileName: file.name,
        currentFileHash: computedHex,
        currentFileHashShort: computedHex.slice(0, 6) + '...',
        isVerified: isMatch,
        result: isMatch ? 'FILE VERIFIED' : 'FILE MODIFIED',
        statusText: isMatch ? '✅ FILE VERIFIED' : '❌ FILE MODIFIED',
        tamperDetails: !isMatch ? `Local file "${file.name}" hash does not match registered blockchain digest.` : null,
      }));

      if (onShowToast) {
        if (isMatch) {
          onShowToast(`File "${file.name}" verified successfully!`, 'success');
        } else {
          onShowToast(`Tamper detected in "${file.name}"! Hash mismatch.`, 'error');
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast('Failed to hash uploaded file: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    if (onShowToast) onShowToast(`Copied ${fieldName} to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isVerified = verificationData.isVerified;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1.5rem 5rem' }}>
      
      {/* Back to Home / Navigation */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={onNavigateHome}
          style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
            Ethereum Sepolia (EVM)
          </span>
          <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
            SHA-256 Proofs
          </span>
        </div>
      </div>

      {/* Hero Title Section */}
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem 2rem',
          textAlign: 'center',
          borderRadius: '20px',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            height: '240px',
            background: isVerified
              ? 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(244, 63, 94, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        ></div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '20px', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)', color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.85rem' }}>
          <ShieldCheck size={15} />
          <span>CRYPTOGRAPHIC INTEGRITY VERIFIER</span>
        </div>

        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            letterSpacing: '0.05em',
            margin: '0 0 0.5rem',
            textTransform: 'uppercase',
          }}
        >
          FILE <span className="gradient-text">VERIFICATION</span>
        </h1>

        <p style={{ color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Verify the cryptographic authenticity of any document against its immutable blockchain hash. Detect even a single byte modification instantly.
        </p>
      </div>

      {/* Main Verification Card */}
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem',
          borderRadius: '20px',
          border: isVerified
            ? '1px solid rgba(16, 185, 129, 0.35)'
            : '1px solid rgba(244, 63, 94, 0.45)',
          background: isVerified
            ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.04) 0%, rgba(5, 11, 20, 0.8) 100%)'
            : 'linear-gradient(145deg, rgba(244, 63, 94, 0.05) 0%, rgba(5, 11, 20, 0.8) 100%)',
          boxShadow: isVerified
            ? '0 0 40px rgba(16, 185, 129, 0.15)'
            : '0 0 40px rgba(244, 63, 94, 0.2)',
          position: 'relative',
        }}
      >
        
        {/* Form: Enter File ID */}
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: '2rem' }}>
          <label
            htmlFor="fileIdInput"
            style={{
              display: 'block',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: '0.5rem',
              letterSpacing: '0.5px',
            }}
          >
            Enter File ID:
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <input
                id="fileIdInput"
                type="text"
                value={fileIdInput}
                onChange={(e) => setFileIdInput(e.target.value)}
                placeholder="101"
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem 0.85rem 2.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
              <Search
                size={18}
                color="var(--accent-cyan)"
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                padding: '0.85rem 1.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                minWidth: '140px',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={16} className="animate-spin" /> Verifying...
                </span>
              ) : (
                <span>Verify File</span>
              )}
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Quick Presets:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                style={{
                  background: fileIdInput === preset.id ? 'rgba(0, 242, 254, 0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${fileIdInput === preset.id ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
                  color: fileIdInput === preset.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '0.3rem 0.65rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </form>

        {/* 2 Comparison Blocks: Blockchain Hash vs Current File Hash */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.25rem' }}>
          
          {/* Card A: Blockchain Hash */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '14px',
              padding: '1.5rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                Blockchain Hash:
              </span>
              <button
                onClick={() => handleCopy(verificationData.blockchainHash, 'Blockchain Hash')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem' }}
              >
                {copiedField === 'Blockchain Hash' ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedField === 'Blockchain Hash' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Short Canonical Hash as required in prompt: A91F8C... */}
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: 'var(--accent-cyan)',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
              }}
            >
              {verificationData.blockchainHashShort}
            </div>

            {/* Full 64-char Hash */}
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {verificationData.blockchainHash}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Lock size={12} color="var(--accent-cyan)" />
              <span>Immutable EVM Digest &bull; Block #{verificationData.blockNumber}</span>
            </div>
          </div>

          {/* Card B: Current File Hash */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: isVerified
                ? '1px solid rgba(16, 185, 129, 0.25)'
                : '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: '14px',
              padding: '1.5rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                Current File Hash:
              </span>
              <button
                onClick={() => handleCopy(verificationData.currentFileHash, 'Current File Hash')}
                style={{ background: 'none', border: 'none', color: isVerified ? '#10b981' : '#fb7185', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem' }}
              >
                {copiedField === 'Current File Hash' ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedField === 'Current File Hash' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Short Canonical Hash as required in prompt: A91F8C... or F44B2E... */}
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: isVerified ? '#10b981' : '#fb7185',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
              }}
            >
              {verificationData.currentFileHashShort}
            </div>

            {/* Full 64-char Hash */}
            <div
              style={{
                fontSize: '0.75rem',
                color: isVerified ? 'var(--text-secondary)' : '#fda4af',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                border: isVerified ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(244, 63, 94, 0.25)',
              }}
            >
              {verificationData.currentFileHash}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <FileCheck size={12} color={isVerified ? '#10b981' : '#fb7185'} />
              <span>
                {uploadedFileName ? `Hashed from "${uploadedFileName}"` : 'Computed from current IPFS payload'}
              </span>
            </div>
          </div>

        </div>

        {/* 3. RESULT DISPLAY BANNER (Canonical Output) */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
            Result:
          </span>

          {/* Clean Matching Result */}
          {isVerified ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                padding: '1.25rem 3rem',
                borderRadius: '16px',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.4), inset 0 0 15px rgba(16, 185, 129, 0.2)',
                animation: 'pulse 2s infinite',
              }}
            >
              <CheckCircle2 size={32} color="#10b981" />
              <span
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  color: '#10b981',
                  fontFamily: 'monospace',
                }}
              >
                ✅ FILE VERIFIED
              </span>
            </div>
          ) : (
            /* Hash Mismatch Result */
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '2px solid #f43f5e',
                padding: '1.25rem 3rem',
                borderRadius: '16px',
                boxShadow: '0 0 30px rgba(244, 63, 94, 0.45), inset 0 0 15px rgba(244, 63, 94, 0.2)',
              }}
            >
              <XCircle size={32} color="#f43f5e" />
              <span
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  color: '#fb7185',
                  fontFamily: 'monospace',
                }}
              >
                ❌ FILE MODIFIED
              </span>
            </div>
          )}

          {/* Technical Explanatory Note */}
          <p
            style={{
              fontSize: '0.88rem',
              color: isVerified ? '#34d399' : '#fda4af',
              marginTop: '1rem',
              maxWidth: '600px',
              margin: '1rem auto 0',
            }}
          >
            {isVerified
              ? 'Cryptographic integrity confirmed. The file bits are identical to the timestamped on-chain transaction hash.'
              : 'Tampering detected! The file has been modified after on-chain registration or the digest has been altered in transit.'}
          </p>
        </div>

        {/* 4. Interactive Simulation & Verification Tools */}
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <b style={{ color: '#f8fafc', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--accent-cyan)" />
              Demonstration & Tamper Simulation
            </b>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Toggle simulated tamper to flip 1 byte and demonstrate the <code>❌ FILE MODIFIED</code> guard.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Toggle Tamper Simulation Button */}
            <button
              className="btn btn-secondary"
              onClick={handleToggleTamper}
              style={{
                borderColor: simulateTamper ? '#f43f5e' : 'var(--accent-cyan)',
                background: simulateTamper ? 'rgba(244, 63, 94, 0.2)' : 'rgba(0, 242, 254, 0.1)',
                color: simulateTamper ? '#fb7185' : 'var(--accent-cyan)',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
              }}
            >
              {simulateTamper ? 'Reset to Authentic (Clean)' : '⚠️ Simulate Tamper (Change 1 Byte)'}
            </button>

            {/* Test Custom Local File Button */}
            <label
              className="btn btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <UploadCloud size={14} />
              <span>Verify Local File</span>
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

      </div>

      {/* Cryptographic Architecture Summary Footer */}
      <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
          <b style={{ color: 'var(--accent-cyan)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={16} /> Deterministic SHA-256 Digest
          </b>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0', lineHeight: 1.5 }}>
            Even altering a single character, whitespace, or bit changes 100% of the SHA-256 hash (Avalanche Effect), instantly triggering verification failure.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
          <b style={{ color: '#10b981', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} /> EVM Immutable Storage
          </b>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0', lineHeight: 1.5 }}>
            The Blockchain Hash is committed to the Ethereum Smart Contract <code>FileAccessControl.sol</code> at block mining time and can never be rewritten.
          </p>
        </div>

      </div>

    </div>
  );
};
