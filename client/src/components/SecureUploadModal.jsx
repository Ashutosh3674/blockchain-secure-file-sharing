import React, { useState, useRef, useEffect } from 'react';
import { cryptoService, bufferToBase64 } from '../services/cryptoService';
import { contractService } from '../services/contractService';
import { performAIThreatScan } from '../services/aiThreatScanner';
import { AIThreatScannerCard } from './AIThreatScannerCard';
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
  ShieldAlert,
  AlertTriangle,
  Share2,
  Folder,
  FolderUp,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Layers,
  Check,
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
  targetFolderId = null,
}) => {
  const [fileQueue, setFileQueue] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100%
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [maxLimitMB, setMaxLimitMB] = useState(2048);
  const [uploadedRecord, setUploadedRecord] = useState(null);
  const [threatAnalysis, setThreatAnalysis] = useState(null);
  const [isScanningThreat, setIsScanningThreat] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [detectedFolder, setDetectedFolder] = useState(null);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const isPausedRef = useRef(false);

  // Cryptographic audit details
  const [cryptoDetails, setCryptoDetails] = useState({
    keyString: null,
    iv: null,
    sha256: null,
    ipfsCid: null,
    txHash: null,
  });

  const activeFile = fileQueue[activeFileIndex] || null;

  // Sync ref with paused state for loop control
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Automatically trigger AI Threat Scan when active file changes
  useEffect(() => {
    if (activeFile) {
      let isCurrent = true;
      setIsScanningThreat(true);
      setWarningAcknowledged(false);
      performAIThreatScan(activeFile)
        .then((analysis) => {
          if (isCurrent) {
            setThreatAnalysis(analysis);
            setIsScanningThreat(false);
          }
        })
        .catch((err) => {
          if (isCurrent) {
            console.warn('AI Threat Scan failed:', err);
            setIsScanningThreat(false);
          }
        });
      return () => {
        isCurrent = false;
      };
    } else {
      setThreatAnalysis(null);
      setWarningAcknowledged(false);
    }
  }, [activeFile]);

  // Fetch active upload limit configuration
  useEffect(() => {
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

  // Add files to queue (validating duplicates and extensions)
  const addFilesToQueue = (filesList, folderName = null) => {
    if (!filesList || filesList.length === 0) return;
    const newFiles = Array.from(filesList);
    setFileQueue((prev) => {
      const merged = [...prev, ...newFiles];
      return merged;
    });
    if (folderName) {
      setDetectedFolder(folderName);
      if (onShowToast) onShowToast(`Added ${newFiles.length} files from folder "${folderName}" to queue`);
    } else if (newFiles.length > 1) {
      if (onShowToast) onShowToast(`Added ${newFiles.length} files to upload queue`);
    }
    setError(null);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

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
    setFileQueue([sampleFile]);
    setActiveFileIndex(0);
    setError(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
  };

  const handleFolderChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const firstRelPath = files[0].webkitRelativePath || '';
      const folderName = firstRelPath ? firstRelPath.split('/')[0] : 'Uploaded_Folder';
      addFilesToQueue(files, folderName);
    }
  };

  const handleRemoveQueueItem = (index) => {
    setFileQueue((prev) => prev.filter((_, idx) => idx !== index));
    if (activeFileIndex >= index && activeFileIndex > 0) {
      setActiveFileIndex((prev) => prev - 1);
    }
  };

  const handleApplyPreset = (type) => {
    if (type === 'safe') {
      handleUseSampleFile();
    } else if (type === 'warning') {
      const warningContent = `%PDF-1.4\n<script>alert("macro warning")</script>\nAutoOpen Macro payload detected.\nvbaProject.bin reference embedded.`;
      const blob = new Blob([warningContent], { type: 'application/pdf' });
      const sampleFile = new File([blob], 'Confidential_Invoice_Macro.pdf', { type: 'application/pdf' });
      setFileQueue([sampleFile]);
      setActiveFileIndex(0);
      setError(null);
    } else if (type === 'dangerous') {
      const malwareContent = `MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF\x00\x00powershell.exe -enc IEX(New-Object Net.WebClient).DownloadString()`;
      const blob = new Blob([malwareContent], { type: 'application/octet-stream' });
      const sampleFile = new File([blob], 'Critical_Security_Patch.pdf.exe', { type: 'application/octet-stream' });
      setFileQueue([sampleFile]);
      setActiveFileIndex(0);
      setError(null);
    }
  };

  // Helper to wait while paused
  const waitIfPaused = async () => {
    while (isPausedRef.current) {
      await new Promise((r) => setTimeout(r, 200));
    }
  };

  // Execute the Complete 6-Step Secure Upload Pipeline
  const handleStartSecurePipeline = async () => {
    if (!activeFile) {
      setError('Please select or drop a file first.');
      return;
    }

    if (threatAnalysis?.level === 'Dangerous') {
      setError(`Security Block: AI File Threat Detector identified this file as DANGEROUS (Score: ${threatAnalysis.score}/100). Malicious content cannot be uploaded or shared on decentralized storage.`);
      return;
    }

    if (threatAnalysis?.level === 'Warning' && !warningAcknowledged) {
      setError('Security Notice: Please review and check the security acknowledgment box before proceeding with this file.');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    setError(null);
    setUploadProgress(5);

    try {
      // STEP 1: File Selection & Verification
      setCurrentStep(1);
      setUploadProgress(15);
      await waitIfPaused();
      await new Promise((r) => setTimeout(r, 350));

      // Client-Side Pre-Flight Security Validation (2048 MB / 2 GB Default & File Whitelist)
      const MAX_SIZE = (window.BLOCKSHARE_UPLOAD_LIMIT_MB || 2048) * 1024 * 1024;
      const maxMB = (MAX_SIZE / (1024 * 1024)).toFixed(0);
      const displayLimit = Number(maxMB) >= 1024 ? `${(Number(maxMB) / 1024).toFixed(1).replace('.0', '')} GB` : `${maxMB} MB`;
      if (activeFile.size > MAX_SIZE) {
        throw new Error(`File size (${(activeFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${displayLimit} upload limit. Please select a file under ${displayLimit}.`);
      }

      const fileName = activeFile.name || '';
      const ext = fileName.lastIndexOf('.') !== -1 ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';
      
      const BANNED = ['.exe', '.bat', '.cmd', '.sh', '.bash', '.vbs', '.js', '.mjs', '.php', '.py', '.scr', '.msi', '.dll', '.bin'];
      if (BANNED.includes(ext)) {
        throw new Error(`Security Guard: Executable or script file extension "${ext}" is strictly banned to prevent malware execution.`);
      }

      const ALLOWED = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.png', '.jpg', '.jpeg', '.webp', '.zip', '.txt', '.json', '.xlsx'];
      if (!ALLOWED.includes(ext)) {
        throw new Error(`Unsupported format: "${ext || 'none'}". Allowed formats: PDF, DOCX, PPTX, PNG, JPG, ZIP, TXT.`);
      }

      // STEP 2: Generate WebCrypto AES-GCM 256-bit Key
      await waitIfPaused();
      setCurrentStep(2);
      setUploadProgress(30);
      const aesKey = await cryptoService.generateAESKey();
      const exportedKey = await cryptoService.exportKey(aesKey);
      setCryptoDetails((prev) => ({ ...prev, keyString: exportedKey }));
      await new Promise((r) => setTimeout(r, 450));

      // STEP 3: Encrypt File (Plaintext -> Ciphertext)
      await waitIfPaused();
      setCurrentStep(3);
      setUploadProgress(50);
      const encryptionResult = await cryptoService.encryptFile(activeFile, aesKey);
      setCryptoDetails((prev) => ({
        ...prev,
        iv: encryptionResult.iv,
      }));
      await new Promise((r) => setTimeout(r, 500));

      // STEP 4: Calculate SHA-256 Checksum
      await waitIfPaused();
      setCurrentStep(4);
      setUploadProgress(68);
      const sha256 = encryptionResult.sha256Hash;
      setCryptoDetails((prev) => ({ ...prev, sha256 }));
      await new Promise((r) => setTimeout(r, 400));

      // STEP 5: Upload Encrypted File to IPFS with JWT Bearer Token
      await waitIfPaused();
      setCurrentStep(5);
      setUploadProgress(82);

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
          fileName: activeFile.name,
          mimeType: activeFile.type || 'application/pdf',
          sha256,
          threatAnalysis,
        }),
      });

      const ipfsData = await ipfsRes.json();
      if (!ipfsRes.ok || !ipfsData.success) {
        throw new Error(ipfsData.message || 'IPFS upload failed');
      }

      const ipfsCid = ipfsData.ipfsCid;
      setCryptoDetails((prev) => ({ ...prev, ipfsCid }));
      await new Promise((r) => setTimeout(r, 450));

      // STEP 6: Store CID + Metadata on Blockchain Smart Contract
      await waitIfPaused();
      setCurrentStep(6);
      setUploadProgress(95);

      const folderIdToAssign = targetFolderId || (detectedFolder ? `folder_${detectedFolder}` : null);

      const contractRes = await contractService.registerFile(
        ipfsCid,
        activeFile.name,
        activeFile.type || 'application/pdf',
        activeFile.size,
        activeAddress,
        sha256,
        exportedKey,
        encryptionResult.iv,
        threatAnalysis,
        { folderId: folderIdToAssign }
      );

      // Complete Record
      const completeRecord = {
        ...contractRes.file,
        encryptionKey: exportedKey,
        iv: encryptionResult.iv,
        sha256,
        threatAnalysis,
        threatLevel: threatAnalysis?.level || 'Safe',
        threatScore: threatAnalysis?.score ?? 5,
        folderId: folderIdToAssign,
      };

      setUploadedRecord(completeRecord);
      setCryptoDetails((prev) => ({
        ...prev,
        txHash: contractRes.tx.txHash,
      }));
      setUploadProgress(100);

      await new Promise((r) => setTimeout(r, 400));

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      if (onShowToast) onShowToast(`File "${activeFile.name}" encrypted & registered on blockchain!`);
      if (onUploadComplete) onUploadComplete(completeRecord, false);
    } catch (err) {
      console.error('Pipeline error:', err);
      setError(err.message || 'Error executing cryptographic pipeline');
    } finally {
      setIsProcessing(false);
      setIsPaused(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    if (onShowToast) onShowToast(`${label} copied to clipboard!`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '620px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.25rem 1.45rem',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0, 242, 254, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>Secure File Upload System</h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                  Max 2 GB
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                Drag &amp; Drop &bull; Multi-File &amp; Folder &bull; Pause/Resume &bull; Zero-Knowledge AES-256
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

        {/* Drag & Drop Zone with Multi-file & Folder Upload */}
        {currentStep < 6 && (
          <div style={{ marginBottom: '0.85rem' }}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed var(--accent-cyan)' : '1.5px dashed rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '1.15rem 1.25rem',
                textAlign: 'center',
                background: isDragging
                  ? 'rgba(0, 242, 254, 0.12)'
                  : activeFile
                  ? 'rgba(0, 242, 254, 0.04)'
                  : 'rgba(0,0,0,0.28)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isDragging ? '0 0 25px rgba(0, 242, 254, 0.25)' : 'none',
              }}
            >
              {/* Hidden Inputs for Multiple Files and Folders */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.zip,.txt,.json,.xlsx"
                onChange={handleFileChange}
                disabled={isProcessing}
                style={{ display: 'none' }}
              />
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderChange}
                disabled={isProcessing}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: isDragging ? 'var(--accent-cyan)' : 'rgba(56, 189, 248, 0.14)',
                  color: isDragging ? '#050b14' : 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {isDragging ? <Upload size={22} /> : <Layers size={22} />}
                </div>

                <div>
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 0.2rem' }}>
                    {isDragging ? '📂 Release to drop files into upload queue' : 'Drag & Drop files or folders here, or Browse'}
                  </p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                    Supports single/multiple files, entire folders, and large files up to{' '}
                    <strong style={{ color: '#10b981' }}>{maxLimitMB >= 1024 ? `${(maxLimitMB / 1024).toFixed(1).replace('.0', '')} GB` : `${maxLimitMB} MB`}</strong>
                  </p>
                </div>

                {/* Folder & Preset Buttons inside upload zone */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '0.3rem 0.75rem', borderColor: 'rgba(0,242,254,0.4)', color: 'var(--accent-cyan)' }}
                  >
                    <FileText size={12} />
                    <span>Choose Multiple Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '0.3rem 0.75rem', borderColor: 'rgba(168,85,247,0.4)', color: '#c084fc' }}
                  >
                    <FolderUp size={12} />
                    <span>📁 Upload Entire Folder</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUseSampleFile}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '0.3rem 0.75rem' }}
                  >
                    <Sparkles size={12} color="var(--accent-cyan)" />
                    <span>Sample File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Queue List (if multiple files or queue active) */}
            {fileQueue.length > 0 && (
              <div style={{
                marginTop: '0.65rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                maxHeight: '140px',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Upload Queue ({fileQueue.length} {fileQueue.length === 1 ? 'file' : 'files'})
                  </span>
                  {fileQueue.length > 1 && !isProcessing && (
                    <button
                      type="button"
                      onClick={() => setFileQueue([])}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                      Clear Queue
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {fileQueue.map((qFile, idx) => {
                    const isCurrent = idx === activeFileIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => !isProcessing && setActiveFileIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.3rem 0.5rem',
                          borderRadius: '6px',
                          background: isCurrent ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.02)',
                          border: isCurrent ? '1px solid rgba(0, 242, 254, 0.35)' : '1px solid transparent',
                          cursor: isProcessing ? 'default' : 'pointer',
                          fontSize: '0.76rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                          <FileText size={13} color={isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                          <span style={{
                            color: isCurrent ? 'var(--accent-cyan)' : '#f8fafc',
                            fontWeight: isCurrent ? 600 : 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '280px',
                          }}>
                            {qFile.name}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            ({(qFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>

                        {!isProcessing && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveQueueItem(idx);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compact Format & Max Limit Config Toolbar */}
            <div
              style={{
                marginTop: '0.5rem',
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
                <span style={{ color: 'var(--text-muted)' }}>Whitelisted Formats:</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>PDF, DOCX, PPTX, PNG, JPG, ZIP, TXT</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Large File Limit:</span>
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

        {/* AI Threat Scanner Card (Real-time Malware & Payload Inspection) */}
        {currentStep < 6 && (activeFile || isScanningThreat) && (
          <div style={{ marginBottom: '0.75rem' }}>
            <AIThreatScannerCard
              threatAnalysis={threatAnalysis}
              isScanning={isScanningThreat}
              fileName={activeFile?.name}
              onApplyPreset={handleApplyPreset}
            />
          </div>
        )}

        {/* Warning Acknowledgment Checkbox if level === 'Warning' */}
        {currentStep < 6 && threatAnalysis?.level === 'Warning' && (
          <div
            style={{
              marginBottom: '0.75rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.76rem',
              color: '#fde68a',
            }}
          >
            <input
              type="checkbox"
              id="warningAck"
              checked={warningAcknowledged}
              onChange={(e) => setWarningAcknowledged(e.target.checked)}
              style={{ accentColor: '#f59e0b', cursor: 'pointer', width: '15px', height: '15px' }}
            />
            <label htmlFor="warningAck" style={{ cursor: 'pointer', margin: 0, fontWeight: 500 }}>
              Security Acknowledgment: I have reviewed the detected macro/script indicators and verify this file is safe to share.
            </label>
          </div>
        )}

        {/* Dynamic 0% - 100% Upload Progress Bar with Speed & Pause/Resume */}
        {isProcessing && (
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '10px',
            padding: '0.75rem 0.95rem',
            marginBottom: '0.85rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot" style={{ background: isPaused ? '#f59e0b' : 'var(--accent-cyan)' }}></span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isPaused ? '#f59e0b' : '#f8fafc' }}>
                  {isPaused ? '⏸️ Upload Paused' : `Processing: ${STAGES[currentStep - 1]?.label || 'Encrypting...'}`}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {isPaused ? 'Halted' : '4.8 MB/s &bull; In-Memory Stream'}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', minWidth: '38px', textAlign: 'right' }}>
                  {uploadProgress}%
                </span>
              </div>
            </div>

            {/* Visual Animated Track Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
              marginBottom: '0.5rem',
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                background: isPaused
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #00f2fe 0%, #10b981 100%)',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
                boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)',
              }} />
            </div>

            {/* Pause / Resume Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {isPaused ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsPaused(false)}
                  style={{
                    fontSize: '0.74rem',
                    padding: '0.25rem 0.7rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Play size={12} />
                  <span>Resume Upload</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsPaused(true)}
                  style={{
                    fontSize: '0.74rem',
                    padding: '0.25rem 0.7rem',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    color: '#f59e0b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Pause size={12} />
                  <span>Pause Upload</span>
                </button>
              )}
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
                <span>Encryption &amp; Blockchain Registration Complete!</span>
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
          ) : threatAnalysis?.level === 'Dangerous' ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled
              style={{
                fontSize: '0.84rem',
                padding: '0.5rem 1.15rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                cursor: 'not-allowed',
              }}
            >
              <ShieldAlert size={15} color="#ef4444" />
              <span>Blocked: Dangerous Threat ({threatAnalysis.score}/100)</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartSecurePipeline}
              disabled={!activeFile || isProcessing || (threatAnalysis?.level === 'Warning' && !warningAcknowledged)}
              style={{
                fontSize: '0.84rem',
                padding: '0.5rem 1.15rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                opacity: (threatAnalysis?.level === 'Warning' && !warningAcknowledged) ? 0.6 : 1,
              }}
            >
              {isProcessing ? (
                <>
                  <span className="pulse-dot"></span>
                  <span>Executing Pipeline ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <Upload size={15} />
                  <span>
                    {threatAnalysis?.level === 'Warning' && !warningAcknowledged
                      ? 'Acknowledge Threat Warning'
                      : fileQueue.length > 1
                      ? `Encrypt & Upload (${fileQueue.length} Files)`
                      : 'Encrypt & Upload to IPFS'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
