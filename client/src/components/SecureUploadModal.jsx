import React, { useState, useRef } from 'react';
import { cryptoService, bufferToBase64 } from '../services/cryptoService';
import { contractService } from '../services/contractService';
import {
  X,
  Upload,
  Key,
  Lock,
  Hash,
  Database,
  Blocks,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STAGES = [
  { id: 1, label: 'Select File', icon: FileText, desc: 'Selected local plaintext file' },
  { id: 2, label: 'Generate Key', icon: Key, desc: 'WebCrypto AES-GCM 256-bit key' },
  { id: 3, label: 'Encrypt File', icon: Lock, desc: 'Zero-knowledge browser encryption' },
  { id: 4, label: 'Calculate Hash', icon: Hash, desc: 'SHA-256 ciphertext checksum' },
  { id: 5, label: 'Upload to IPFS', icon: Database, desc: 'Decentralized storage CID' },
  { id: 6, label: 'Store on Blockchain', icon: Blocks, desc: 'Smart contract registry TX' },
];

export const SecureUploadModal = ({
  isOpen,
  onClose,
  activeAddress,
  onUploadComplete,
  onShareNow,
  onShowToast,
}) => {
  const [file, setFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [maxLimitMB, setMaxLimitMB] = useState(2048);
  const [uploadedRecord, setUploadedRecord] = useState(null);
  const fileInputRef = useRef(null);

  // Cryptographic audit details
  const [cryptoDetails, setCryptoDetails] = useState({
    keyString: null,
    iv: null,
    sha256: null,
    ipfsCid: null,
    txHash: null,
  });

  // Fetch active upload limit configuration
  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/files/upload-limits')
        .then((res) => res.json())
        .then((data) => {
          if (data.limits?.maxUploadSizeMB) {
            setMaxLimitMB(data.limits.maxUploadSizeMB);
            window.BLOCKSHARE_UPLOAD_LIMIT_MB = data.limits.maxUploadSizeMB;
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleUpdateLimit = async (newLimit) => {
    setMaxLimitMB(newLimit);
    window.BLOCKSHARE_UPLOAD_LIMIT_MB = newLimit;
    const label = newLimit >= 1024 ? `${(newLimit / 1024).toFixed(1).replace('.0', '')} GB` : `${newLimit} MB`;
    try {
      await fetch('/api/files/upload-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxUploadSizeMB: newLimit }),
      });
      if (onShowToast) onShowToast(`Upload limit set to ${label}`);
    } catch (e) {
      console.warn('Limit sync notice:', e);
    }
  };

  if (!isOpen) return null;

  // Quick Preset Sample File
  const handleUseSampleFile = () => {
    const sampleContent = `
===================================================================
CONFIDENTIAL PROJECT REPORT: DECENTRALIZED BLOCKCHAIN FILE SHARING
===================================================================
Project: BlockShare Enterprise Web3 Architecture
Lead Author: Ashutosh
Recipient: Rahul Sharma
Date: ${new Date().toLocaleDateString()}
Classification: TOP SECRET // AES-256-GCM ENCRYPTED

1. EXECUTIVE SUMMARY:
Decentralized file sharing solves central point of failure risks 
by combining client-side AES-GCM (256-bit) encryption with 
distributed IPFS storage and Ethereum smart contract access control.

2. CRYPTOGRAPHIC VERIFICATION:
- Key Algorithm: AES-GCM (256 bits)
- Authentication Tag: 128 bits
- Storage: IPFS Content Addressed Storage
- Permission Layer: Solidity Smart Contract (FileAccessControl.sol)
===================================================================
    `.trim();

    const blob = new Blob([sampleContent], { type: 'application/pdf' });
    const sampleFile = new File([blob], 'Project_Report.pdf', { type: 'application/pdf' });
    setFile(sampleFile);
    setError(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Execute the Complete 6-Step Secure Upload Pipeline
  const handleStartSecurePipeline = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // STEP 1: File is already selected
      setCurrentStep(1);
      await new Promise((r) => setTimeout(r, 400));

      // STEP 2: Generate Encryption Key
      setCurrentStep(2);
      const aesKey = await cryptoService.generateAESKey();
      const exportedKey = await cryptoService.exportKey(aesKey);
      setCryptoDetails((prev) => ({ ...prev, keyString: exportedKey }));
      await new Promise((r) => setTimeout(r, 600));

      // STEP 3: Encrypt File (Plaintext -> Ciphertext)
      setCurrentStep(3);
      const encryptionResult = await cryptoService.encryptFile(file, aesKey);
      setCryptoDetails((prev) => ({
        ...prev,
        iv: encryptionResult.iv,
      }));
      await new Promise((r) => setTimeout(r, 700));

      // STEP 4: Calculate SHA-256 Checksum
      setCurrentStep(4);
      const sha256 = encryptionResult.sha256Hash;
      setCryptoDetails((prev) => ({ ...prev, sha256 }));
      await new Promise((r) => setTimeout(r, 500));

      // Client-Side Pre-Flight Security Validation (2048 MB / 2 GB Default & File Whitelist)
      const MAX_SIZE = (window.BLOCKSHARE_UPLOAD_LIMIT_MB || 2048) * 1024 * 1024; // Default 2048 MB (2 GB)
      const maxMB = (MAX_SIZE / (1024 * 1024)).toFixed(0);
      const displayLimit = Number(maxMB) >= 1024 ? `${(Number(maxMB) / 1024).toFixed(1).replace('.0', '')} GB` : `${maxMB} MB`;
      if (file.size > MAX_SIZE) {
        throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${displayLimit} upload limit. Please select a file under ${displayLimit}.`);
      }

      const fileName = file.name || '';
      const ext = fileName.lastIndexOf('.') !== -1 ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';
      
      const BANNED = ['.exe', '.bat', '.cmd', '.sh', '.bash', '.vbs', '.js', '.mjs', '.php', '.py', '.scr', '.msi', '.dll', '.bin'];
      if (BANNED.includes(ext)) {
        throw new Error(`Security Guard: Executable or script file extension "${ext}" is strictly banned to prevent malware execution.`);
      }

      const ALLOWED = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.png', '.jpg', '.jpeg', '.webp', '.zip', '.txt', '.json', '.xlsx'];
      if (!ALLOWED.includes(ext)) {
        throw new Error(`Unsupported format: "${ext || 'none'}". Allowed formats: PDF, DOCX, PPTX, PNG, JPG, ZIP, TXT.`);
      }

      // STEP 5: Upload Encrypted File to IPFS with JWT Bearer Token
      setCurrentStep(5);
      const base64Ciphertext = bufferToBase64(encryptionResult.ciphertextBuffer);
      const token = localStorage.getItem('blockshare_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const ipfsRes = await fetch('/api/files/ipfs-upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ciphertextBase64: base64Ciphertext,
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          sha256,
        }),
      });

      const ipfsData = await ipfsRes.json();
      if (!ipfsRes.ok || !ipfsData.success) {
        throw new Error(ipfsData.message || 'IPFS upload failed');
      }

      const ipfsCid = ipfsData.ipfsCid;
      setCryptoDetails((prev) => ({ ...prev, ipfsCid }));
      await new Promise((r) => setTimeout(r, 700));

      // STEP 6: Store CID + Metadata on Blockchain Smart Contract
      setCurrentStep(6);
      const contractRes = await contractService.registerFile(
        ipfsCid,
        file.name,
        file.type || 'application/pdf',
        file.size,
        activeAddress,
        sha256,
        exportedKey,
        encryptionResult.iv
      );

      // Also attach secret key to local cache so owner/authorized users can decrypt it
      const completeRecord = {
        ...contractRes.file,
        encryptionKey: exportedKey,
        iv: encryptionResult.iv,
        sha256,
      };

      setUploadedRecord(completeRecord);
      setCryptoDetails((prev) => ({
        ...prev,
        txHash: contractRes.tx.txHash,
      }));

      await new Promise((r) => setTimeout(r, 600));

      // All 6 steps complete!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      onShowToast(`File "${file.name}" encrypted & registered on blockchain!`);
      if (onUploadComplete) onUploadComplete(completeRecord, false);
    } catch (err) {
      console.error('Pipeline error:', err);
      setError(err.message || 'Error executing cryptographic pipeline');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    onShowToast(`${label} copied to clipboard!`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.15rem 1.35rem',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0, 242, 254, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0,242,254,0.2) 0%, rgba(139,92,246,0.2) 100%)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Upload size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Secure File Upload Pipeline</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                Client-Side AES-256-GCM &bull; IPFS CID &bull; Smart Contract Access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* File Selection Zone (Only when not finished) */}
        {currentStep < 6 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '1.5px dashed rgba(56, 189, 248, 0.35)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                textAlign: 'center',
                background: file ? 'rgba(0, 242, 254, 0.05)' : 'rgba(0,0,0,0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.zip,.txt,.json,.xlsx"
                onChange={handleFileChange}
                disabled={isProcessing}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FileText size={18} />
                </div>

                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  {file ? (
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </p>
                      <span style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; {file.type || 'Document'} &bull; Click to change
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>
                        Click to select or drop file here &bull; <span style={{ color: 'var(--accent-cyan)' }}>Browse</span>
                      </p>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Default Limit: <strong style={{ color: '#10b981' }}>{maxLimitMB >= 1024 ? `${(maxLimitMB / 1024).toFixed(1).replace('.0', '')} GB` : `${maxLimitMB} MB`}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {!file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseSampleFile();
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', flexShrink: 0 }}
                  >
                    <Sparkles size={11} color="var(--accent-cyan)" />
                    <span>Sample File</span>
                  </button>
                )}
              </div>
            </div>

            {/* Compact Format & Presets Toolbar */}
            <div
              style={{
                marginTop: '0.45rem',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.4rem',
                fontSize: '0.72rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={12} color="var(--accent-cyan)" />
                <span style={{ color: 'var(--text-muted)' }}>Formats:</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>PDF, DOCX, PPTX, PNG, JPG, ZIP, TXT</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Limit:</span>
                {[50, 500, 1024, 2048].map((mb) => (
                  <button
                    key={mb}
                    type="button"
                    onClick={() => handleUpdateLimit(mb)}
                    style={{
                      background: maxLimitMB === mb ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${maxLimitMB === mb ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                      color: maxLimitMB === mb ? '#34d399' : 'var(--text-muted)',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.1rem 0.35rem',
                      cursor: 'pointer',
                    }}
                  >
                    {mb >= 1024 ? `${(mb / 1024).toFixed(1).replace('.0', '')} GB` : `${mb} MB`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '0.55rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            marginBottom: '0.75rem',
          }}>
            {error}
          </div>
        )}

        {/* 6-Stage Process Pipeline Stepper (Compact 2-Column Grid) */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '10px',
          padding: '0.7rem 0.85rem',
          marginBottom: '0.75rem',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Cryptographic Pipeline Stages
            </span>
            <span style={{ fontSize: '0.7rem', color: isProcessing ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
              {isProcessing ? '⚡ Executing on blockchain...' : 'Zero-Knowledge Client Encryption'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
            {STAGES.map((s) => {
              const isCompleted = currentStep > s.id || (currentStep === 6 && cryptoDetails.txHash);
              const isActive = currentStep === s.id && isProcessing;

              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.55rem',
                    borderRadius: '6px',
                    background: isActive
                      ? 'rgba(0, 242, 254, 0.12)'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${
                      isActive
                        ? 'rgba(0, 242, 254, 0.35)'
                        : isCompleted
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(255, 255, 255, 0.04)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: isCompleted
                        ? 'var(--accent-emerald)'
                        : isActive
                        ? 'var(--accent-cyan)'
                        : 'rgba(255,255,255,0.1)',
                      color: '#050b14',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {isCompleted ? <CheckCircle2 size={12} /> : s.id}
                    </div>

                    <span style={{
                      fontSize: '0.76rem',
                      fontWeight: isActive || isCompleted ? 600 : 400,
                      color: isCompleted ? 'var(--accent-emerald)' : isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {s.label}
                    </span>
                  </div>

                  {isCompleted && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                      ✓
                    </span>
                  )}
                  {isActive && (
                    <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Cryptographic Result Preview (When steps finish) */}
        {cryptoDetails.ipfsCid && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 0.9rem',
            marginBottom: '0.75rem',
            fontSize: '0.78rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '0.4rem' }}>
              <ShieldCheck size={14} />
              <span>Cryptographic Output Details:</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>IPFS CID:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <code className="mono" style={{ color: 'var(--accent-cyan)' }}>
                    {cryptoDetails.ipfsCid}
                  </code>
                  <button onClick={() => copyToClipboard(cryptoDetails.ipfsCid, 'IPFS CID')} className="btn btn-secondary" style={{ padding: '2px 5px', fontSize: '0.7rem' }}>
                    <Copy size={10} />
                  </button>
                </div>
              </div>

              {cryptoDetails.keyString && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>AES-256-GCM Key:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <code className="mono" style={{ color: '#fca34d' }}>
                      {cryptoDetails.keyString.slice(0, 16)}...
                    </code>
                    <button onClick={() => copyToClipboard(cryptoDetails.keyString, 'Secret Key')} className="btn btn-secondary" style={{ padding: '2px 5px', fontSize: '0.7rem' }}>
                      <Copy size={10} />
                    </button>
                  </div>
                </div>
              )}

              {cryptoDetails.sha256 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SHA-256 Checksum:</span>
                  <code className="mono" style={{ color: 'var(--text-secondary)' }}>
                    {cryptoDetails.sha256.slice(0, 18)}...
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🎉 File Ready to Share Callout Banner */}
        {cryptoDetails.txHash && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 0.9rem',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.86rem' }}>
                <Sparkles size={14} />
                <span>Encryption & Blockchain Registration Complete!</span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                You can now share this encrypted file directly with team members (Rahul, Priya, Amit).
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                if (onShareNow && uploadedRecord) {
                  onShareNow(uploadedRecord);
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #00f2fe 0%, #10b981 100%)',
                color: '#050b14',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '0.45rem 0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)',
                cursor: 'pointer',
              }}
            >
              <Share2 size={14} />
              <span>Share File Now</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', alignItems: 'center', marginTop: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
          >
            {cryptoDetails.txHash ? 'Done / Go to Vault' : 'Cancel'}
          </button>

          {cryptoDetails.txHash ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                if (onShareNow && uploadedRecord) {
                  onShareNow(uploadedRecord);
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #00f2fe 0%, #10b981 100%)',
                color: '#050b14',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.15rem',
                fontSize: '0.84rem',
                boxShadow: '0 0 20px rgba(0, 242, 254, 0.45)',
                cursor: 'pointer',
              }}
            >
              <Share2 size={15} />
              <span>Share File (Grant Access) 🚀</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartSecurePipeline}
              disabled={!file || isProcessing}
              style={{
                fontSize: '0.84rem',
                padding: '0.5rem 1.15rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              {isProcessing ? (
                <>
                  <span className="pulse-dot"></span>
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Upload size={15} />
                  <span>Encrypt & Upload to IPFS</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
