import React, { useState } from 'react';
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

export const SecureUploadModal = ({ isOpen, onClose, activeAddress, onUploadComplete, onShowToast }) => {
  const [file, setFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [maxLimitMB, setMaxLimitMB] = useState(50);

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
    try {
      await fetch('/api/files/upload-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxUploadSizeMB: newLimit }),
      });
      if (onShowToast) onShowToast(`Upload limit set to ${newLimit} MB`);
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

      // Client-Side Pre-Flight Security Validation (50 MB Max & File Whitelist)
      const MAX_SIZE = (window.BLOCKSHARE_UPLOAD_LIMIT_MB || 50) * 1024 * 1024; // Default 50 MB
      const maxMB = (MAX_SIZE / (1024 * 1024)).toFixed(0);
      if (file.size > MAX_SIZE) {
        throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${maxMB} MB upload limit. Please select a file under ${maxMB} MB.`);
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
      if (onUploadComplete) onUploadComplete(completeRecord);
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
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0,242,254,0.2) 0%, rgba(139,92,246,0.2) 100%)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Upload size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Secure File Upload Pipeline</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Client-Side AES-256-GCM &bull; SHA-256 &bull; IPFS CID &bull; Smart Contract
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
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* File Selection Zone (Only when not finished) */}
        {currentStep < 6 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                border: '2px dashed rgba(56, 189, 248, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
                textAlign: 'center',
                background: file ? 'rgba(0, 242, 254, 0.04)' : 'rgba(0,0,0,0.2)',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.zip,.txt,.json,.xlsx"
                onChange={handleFileChange}
                disabled={isProcessing}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FileText size={24} />
                </div>

                {file ? (
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {file.name}
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; {file.type || 'Document'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                      Drag & Drop file here, or <span style={{ color: 'var(--accent-cyan)' }}>Browse</span>
                    </p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Maximum upload size: <strong>{maxLimitMB} MB</strong> (configurable)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 📦 Allowed Formats & Size Controls Info Banner */}
            <div
              style={{
                marginTop: '0.75rem',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: '0.75rem 0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={14} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Allowed Formats:
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {['PDF', 'DOCX', 'PPTX', 'PNG', 'JPG', 'ZIP', 'TXT'].map((ext) => (
                    <span
                      key={ext}
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: 'var(--accent-cyan)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      .{ext.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic Size Limit Customization */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Size Limit: <strong style={{ color: '#10b981' }}>{maxLimitMB} MB</strong> (Project Requirement)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Adjust Limit:</span>
                  {[25, 50, 100].map((mb) => (
                    <button
                      key={mb}
                      type="button"
                      onClick={() => handleUpdateLimit(mb)}
                      style={{
                        background: maxLimitMB === mb ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${maxLimitMB === mb ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                        color: maxLimitMB === mb ? '#34d399' : 'var(--text-muted)',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        cursor: 'pointer',
                      }}
                    >
                      {mb} MB
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick 1-Click Sample File */}
            {!file && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleUseSampleFile}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                >
                  <Sparkles size={12} />
                  <span>Use Sample "Project_Report.pdf"</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        {/* 6-Stage Process Pipeline Stepper */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.85rem' }}>
            Cryptographic Pipeline Steps
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {STAGES.map((s) => {
              const isCompleted = currentStep > s.id || (currentStep === 6 && cryptoDetails.txHash);
              const isActive = currentStep === s.id && isProcessing;
              const Icon = s.icon;

              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive
                      ? 'rgba(0, 242, 254, 0.1)'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${
                      isActive
                        ? 'rgba(0, 242, 254, 0.3)'
                        : isCompleted
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(255, 255, 255, 0.04)'
                    }`,
                    transition: 'all 0.25s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
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
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {isCompleted ? <CheckCircle2 size={16} /> : s.id}
                    </div>

                    <div>
                      <span style={{
                        fontSize: '0.88rem',
                        fontWeight: isActive || isCompleted ? 600 : 400,
                        color: isCompleted ? 'var(--accent-emerald)' : isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      }}>
                        {s.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        &bull; {s.desc}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isCompleted && (
                      <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        DONE
                      </span>
                    )}
                    {isActive && (
                      <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        <span className="pulse-dot"></span>
                        RUNNING
                      </span>
                    )}
                  </div>
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
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '0.5rem' }}>
              <ShieldCheck size={16} />
              <span>Cryptographic Output Details:</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            {cryptoDetails.txHash ? 'Close' : 'Cancel'}
          </button>

          {!cryptoDetails.txHash && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartSecurePipeline}
              disabled={!file || isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="pulse-dot"></span>
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
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
