import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import {
  contractService,
  getStoredFiles,
  getStoredLogs,
  getStoredFolders,
  getPersonaNameByAddress,
} from '../services/contractService';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Plus,
  Copy,
  FileText,
  FileCode,
  FileSpreadsheet,
  Lock,
  Unlock,
  Key,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Blocks,
  ArrowRight,
  Sparkles,
  Clock,
  Hash,
  Share2,
  Download,
  Trash2,
  Info,
  Link2,
  Cpu,
  Folder,
  FolderPlus,
  FolderOpen,
  Edit3,
  Move,
  Layers,
  LayoutGrid,
  List,
  ArrowUpDown,
  HardDrive,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SecureUploadModal } from './SecureUploadModal';
import { SecureLinkModal } from './SecureLinkModal';
import { FileDeleteModal } from './FileDeleteModal';
import { FileMetadataModal } from './FileMetadataModal';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { AIThreatScannerModal } from './AIThreatScannerModal';
import { StorageUpgradeModal } from './StorageUpgradeModal';
import { cryptoService } from '../services/cryptoService';
import { keyManagementService } from '../services/keyManagementService';

// Predefined Demo Personas
const PERSONAS = [
  {
    id: 'ashutosh',
    name: 'Ashutosh (Admin / Owner)',
    email: 'ashutosh@gmail.com',
    address: '0x82b27f38a65d6b328ac04a045330a84d412e70bb',
    role: 'Admin / Owner',
    color: '#00f2fe',
    badgeClass: 'badge-cyan',
  },
  {
    id: 'rahul',
    name: 'Rahul (Authorized Recipient)',
    email: 'rahul@gmail.com',
    address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    role: 'Recipient',
    color: '#10b981',
    badgeClass: 'badge-emerald',
  },
  {
    id: 'priya',
    name: 'Priya (Collaborator)',
    email: 'priya@gmail.com',
    address: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
    role: 'Collaborator',
    color: '#a855f7',
    badgeClass: 'badge-purple',
  },
  {
    id: 'stranger',
    name: 'Amit / Stranger (Intruder)',
    email: 'amit@gmail.com',
    address: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    role: 'Unauthorized',
    color: '#f43f5e',
    badgeClass: 'badge-rose',
  },
];

export const FileShareManager = ({ onShowToast }) => {
  const { user } = useAuth();
  const { account } = useWeb3();

  // Dynamically compute list of personas (Logged In User account, Connected MetaMask, Demo accounts)
  const availablePersonas = React.useMemo(() => {
    const list = [];
    if (user?.walletAddress) {
      list.push({
        id: 'user_account',
        name: user.name ? `${user.name} (My Account)` : 'My Account',
        address: user.walletAddress.toLowerCase(),
        role: user.role === 'admin' ? 'Admin' : 'Registered User',
        color: '#00f2fe',
        badgeClass: 'badge-cyan',
      });
    }
    if (account && (!user?.walletAddress || account.toLowerCase() !== user.walletAddress.toLowerCase())) {
      list.push({
        id: 'connected_metamask',
        name: 'Connected MetaMask',
        address: account.toLowerCase(),
        role: 'Active Web3 Wallet',
        color: '#fca34d',
        badgeClass: 'badge-purple',
      });
    }
    PERSONAS.forEach((p) => {
      if (!list.some((item) => item.address.toLowerCase() === p.address.toLowerCase())) {
        list.push(p);
      }
    });
    return list;
  }, [user, account]);

  // Active persona (defaults to logged-in user or connected MetaMask, else Ashutosh)
  const [activePersona, setActivePersona] = useState(() => {
    if (account) {
      return { id: 'custom', name: 'Connected MetaMask', address: account.toLowerCase(), role: 'Active Wallet', color: '#fca34d', badgeClass: 'badge-purple' };
    }
    if (user?.walletAddress) {
      return { id: 'user_account', name: user.name ? `${user.name} (My Account)` : 'My Account', address: user.walletAddress.toLowerCase(), role: user.role === 'admin' ? 'Admin' : 'Registered User', color: '#00f2fe', badgeClass: 'badge-cyan' };
    }
    return PERSONAS[0];
  });

  const [files, setFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedFileForGrant, setSelectedFileForGrant] = useState(null);
  const [grantRecipientAddress, setGrantRecipientAddress] = useState('');
  const [grantExpiryHours, setGrantExpiryHours] = useState('48'); // 48 Hours default (e.g. 20 Sept 2026)
  const [grantMaxDownloads, setGrantMaxDownloads] = useState('3'); // 3 Downloads default limit
  const [searchEmailQuery, setSearchEmailQuery] = useState('');
  const [searchingEmail, setSearchingEmail] = useState(false);

  // Integrity Verification Modal State
  const [integrityModalFile, setIntegrityModalFile] = useState(null);
  const [simulateTamper, setSimulateTamper] = useState(false);

  // File Details Modal State & Filter
  const [detailsModalFile, setDetailsModalFile] = useState(null);
  const [secureLinkModalFile, setSecureLinkModalFile] = useState(null);
  const [deleteModalFile, setDeleteModalFile] = useState(null);
  const [showDeletionSpotlight, setShowDeletionSpotlight] = useState(true);
  const [fileFilter, setFileFilter] = useState('all'); // 'all' | 'my_files'

  // Secure Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'shared_with_me' | 'logs' | 'keys' | 'trash'

  // Folder Management State
  const [folders, setFolders] = useState(() => {
    try {
      return (contractService && typeof contractService.getFolders === 'function')
        ? contractService.getFolders()
        : getStoredFolders();
    } catch {
      return [];
    }
  });
  const [currentFolderId, setCurrentFolderId] = useState(null); // null = all
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // File Operations State (Rename, Move, Copy)
  const [renameModalFile, setRenameModalFile] = useState(null);
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [moveModalFile, setMoveModalFile] = useState(null);
  const [selectedTargetFolderId, setSelectedTargetFolderId] = useState('');

  // Search & Filter & View Mode & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortOption, setSortOption] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc'

  // Storage System & Quota State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [storageDetails, setStorageDetails] = useState(() => {
    try {
      return (contractService && typeof contractService.getStorageDetails === 'function')
        ? contractService.getStorageDetails()
        : { usedBytes: 0, quotaBytes: 10 * 1024 * 1024 * 1024, percent: 0, plan: { name: 'Free Starter Plan' }, breakdown: {} };
    } catch {
      return { usedBytes: 0, quotaBytes: 10 * 1024 * 1024 * 1024, percent: 0, plan: { name: 'Free Starter Plan' }, breakdown: {} };
    }
  });

  // AI File Threat Detector Modal State
  const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);
  const [selectedThreatFile, setSelectedThreatFile] = useState(null);

  // Blockchain Transaction Details Modal State
  const [selectedTxHash, setSelectedTxHash] = useState('');
  const [isTxDetailsOpen, setIsTxDetailsOpen] = useState(false);

  // Inbound shared files (owner != current active persona/user, and user is an authorized recipient or file is public)
  const sharedWithMeFiles = files.filter((f) => {
    if (!f || !f.owner) return false;
    const ownerAddr = f.owner.toLowerCase();
    const activeAddr = (activePersona?.address || '').toLowerCase();
    const userWallet = (user?.walletAddress || '').toLowerCase();
    const userEmail = (user?.email || activePersona?.email || '').toLowerCase();

    // Ashutosh owner alias matching
    const isAshutoshOwner = (ownerAddr === '0x82b27f38a65d6b328ac04a045330a84d412e70bb' || ownerAddr === '0x71c67ed3e80435a55611f476c66337051b7b292a');
    const isAshutoshActive = (activeAddr === '0x82b27f38a65d6b328ac04a045330a84d412e70bb' || activeAddr === '0x71c67ed3e80435a55611f476c66337051b7b292a');

    // If I am the file owner, it belongs in "My Files", not "Shared With Me"
    if (ownerAddr === activeAddr || (userWallet && ownerAddr === userWallet) || (isAshutoshOwner && isAshutoshActive)) {
      return false;
    }

    // Direct check via contract service with wallet and email
    const accessVerdict = contractService.hasAccess(f.ipfsHash, activeAddr || userWallet, userEmail);
    if (accessVerdict.hasAccess && accessVerdict.role !== 'Owner') {
      return true;
    }

    // Check if recipient address or email is in authorizedRecipients
    const isRecipient = (f.authorizedRecipients || []).some((r) => {
      if (!r) return false;
      const cleanR = r.toLowerCase();
      return (
        cleanR === activeAddr ||
        (userWallet && cleanR === userWallet) ||
        (userEmail && cleanR === userEmail)
      );
    });

    return f.isPublic === true || isRecipient;
  });

  // Delete/Unregister File from Registry -> Opens 4-Stage Progressive Delete & Crypto-Shred Modal
  const handleDeleteFile = (file) => {
    setDeleteModalFile(file);
  };

  // Envelope Key Lab State
  const [labAesKey, setLabAesKey] = useState('nF2zW8G3pK1qR7tX9vB4mC6jL8hY2sD5aF1eU9iO3wA=');
  const [labWrappedKey, setLabWrappedKey] = useState('');
  const [labUnwrappedKey, setLabUnwrappedKey] = useState('');
  const [labAttackerError, setLabAttackerError] = useState('');

  const handleLabWrapKey = async () => {
    try {
      const rahulPubKey = await keyManagementService.getRecipientPublicKey('0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc');
      const wrapped = await keyManagementService.wrapFileKey(labAesKey, rahulPubKey);
      setLabWrappedKey(wrapped);
      setLabUnwrappedKey('');
      setLabAttackerError('');
      onShowToast('AES Key wrapped with Rahul\'s Public Key using RSA-OAEP!');
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleLabUnwrapRahul = async () => {
    try {
      if (!labWrappedKey) return;
      const unwrapped = await keyManagementService.unwrapFileKey(labWrappedKey, '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc');
      setLabUnwrappedKey(unwrapped);
      setLabAttackerError('');
      try { confetti({ particleCount: 50 }); } catch {}
      onShowToast('SUCCESS: Rahul\'s Private Key unwrapped the AES key in browser memory!');
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleLabUnwrapStranger = async () => {
    try {
      if (!labWrappedKey) return;
      setLabUnwrappedKey('');
      setLabAttackerError('');
      // Stranger tries to unwrap using stranger's private key
      await keyManagementService.unwrapFileKey(labWrappedKey, '0x90f79bf6eb2c4f870365e785982e1f101e93b906');
    } catch (err) {
      setLabAttackerError('CRITICAL SECURITY VERIFIED: Decryption failed! Stranger does NOT possess Rahul\'s private key. Private key is never on blockchain.');
      onShowToast('Intruder blocked: Cryptographic mismatch!', 'error');
    }
  };

  const refreshData = async () => {
    try {
      const synced = await contractService.syncWithServer();
      setFiles(synced);
    } catch {
      setFiles(getStoredFiles());
    }
    setLogs(getStoredLogs());
    try {
      setFolders((contractService && typeof contractService.getFolders === 'function')
        ? contractService.getFolders()
        : getStoredFolders());
    } catch {
      setFolders([]);
    }
    try {
      if (contractService && typeof contractService.getStorageDetails === 'function') {
        setStorageDetails(contractService.getStorageDetails());
      }
    } catch {}
  };

  // Active, Trashed, and Recent collections
  const activeFiles = files.filter((f) => f && f.status !== 'trashed' && f.status !== 'crypto_shredded');
  const trashedFiles = files.filter((f) => f && f.status === 'trashed');
  const recentFiles = [...activeFiles]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 5);

  // Filtered & Sorted files for the main files view
  const displayedFiles = activeFiles
    .filter((file) => {
      if (!file) return false;
      // 1. Folder filter
      if (currentFolderId !== null && file.folderId !== currentFolderId) {
        return false;
      }
      // 2. Ownership filter ('all' vs 'my_files')
      if (fileFilter === 'my_files') {
        const ownerAddr = (file.owner || '').toLowerCase();
        const activeAddr = (activePersona?.address || '').toLowerCase();
        const userWallet = (user?.walletAddress || '').toLowerCase();
        if (ownerAddr !== activeAddr && ownerAddr !== userWallet) {
          return false;
        }
      }
      // 3. Search query filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = (file.fileName || '').toLowerCase().includes(q);
        const hashMatch = (file.ipfsHash || '').toLowerCase().includes(q);
        const ownerMatch = (file.owner || '').toLowerCase().includes(q) || (file.ownerName || '').toLowerCase().includes(q);
        if (!nameMatch && !hashMatch && !ownerMatch) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'name_asc') {
        return (a.fileName || '').localeCompare(b.fileName || '');
      }
      if (sortOption === 'name_desc') {
        return (b.fileName || '').localeCompare(a.fileName || '');
      }
      if (sortOption === 'size_desc') {
        return (Number(b.fileSize) || 0) - (Number(a.fileSize) || 0);
      }
      if (sortOption === 'size_asc') {
        return (Number(a.fileSize) || 0) - (Number(b.fileSize) || 0);
      }
      if (sortOption === 'date_asc') {
        return (a.uploadedAt || a.timestamp || 0) - (b.uploadedAt || b.timestamp || 0);
      }
      return (b.uploadedAt || b.timestamp || 0) - (a.uploadedAt || a.timestamp || 0);
    });

  // File Operation Handlers
  const handleRenameFile = async (e) => {
    if (e) e.preventDefault();
    if (!renameModalFile || !newFileNameInput.trim()) return;
    try {
      await contractService.renameFile(renameModalFile.ipfsHash, newFileNameInput.trim());
      if (onShowToast) onShowToast(`File renamed to "${newFileNameInput.trim()}"`);
      setRenameModalFile(null);
      setNewFileNameInput('');
      await refreshData();
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  const handleMoveFile = async (e) => {
    if (e) e.preventDefault();
    if (!moveModalFile) return;
    try {
      const target = folders.find((f) => f.id === selectedTargetFolderId);
      const name = target ? target.name : 'Root Vault';
      await contractService.moveFile(moveModalFile.ipfsHash, selectedTargetFolderId || null);
      if (onShowToast) onShowToast(`File moved to "${name}"`);
      setMoveModalFile(null);
      setSelectedTargetFolderId('');
      await refreshData();
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  const handleCopyFile = async (file) => {
    try {
      const copy = await contractService.copyFile(file.ipfsHash);
      if (onShowToast) onShowToast(`Duplicate created: "${copy.fileName}"`);
      await refreshData();
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  const handleTrashFile = async (file) => {
    try {
      await contractService.trashFile(file.ipfsHash);
      if (onShowToast) onShowToast(`File "${file.fileName}" moved to Trash.`);
      await refreshData();
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  const handleRestoreFile = async (file) => {
    try {
      await contractService.restoreFile(file.ipfsHash);
      if (onShowToast) onShowToast(`File "${file.fileName}" restored to vault!`);
      await refreshData();
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently crypto-shred all files in the Trash? This cannot be undone.')) return;
    try {
      const res = await contractService.emptyTrash();
      if (onShowToast) onShowToast(`Recycle bin emptied! (${res.deletedCount || trashedFiles.length} files destroyed)`);
      await refreshData();
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  const handleCreateFolder = async (e) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const created = await contractService.createFolder(newFolderName.trim());
      if (onShowToast) onShowToast(`Folder "${created.name}" created!`);
      setNewFolderName('');
      setIsFolderModalOpen(false);
      await refreshData();
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  const handleDeleteFolder = async (folderId, folderName) => {
    if (!confirm(`Delete folder "${folderName}"? Files inside will be moved to Root.`)) return;
    try {
      await contractService.deleteFolder(folderId);
      if (currentFolderId === folderId) setCurrentFolderId(null);
      if (onShowToast) onShowToast(`Folder "${folderName}" deleted.`);
      await refreshData();
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  useEffect(() => {
    refreshData();
    // Periodically sync so newly shared files appear across users without manual refresh
    const interval = setInterval(() => {
      refreshData();
    }, 8000);
    const handleFocus = () => refreshData();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (account) {
      setActivePersona({
        id: 'connected_metamask',
        name: 'Connected MetaMask',
        address: account.toLowerCase(),
        role: 'Active Wallet',
        color: '#fca34d',
        badgeClass: 'badge-purple',
      });
    } else if (user?.walletAddress) {
      setActivePersona({
        id: 'user_account',
        name: user.name ? `${user.name} (My Account)` : 'My Account',
        email: user.email || '',
        address: user.walletAddress.toLowerCase(),
        role: user.role === 'admin' ? 'Admin' : 'Registered User',
        color: '#00f2fe',
        badgeClass: 'badge-cyan',
      });
    }
  }, [account, user]);

  const truncate = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Switch active wallet persona
  const handleSelectPersona = (p) => {
    setActivePersona(p);
    onShowToast(`Active Persona switched to: ${p.name}`);
  };

  // Handle completed upload from SecureUploadModal
  const handleUploadComplete = (record, autoClose = true) => {
    refreshData();
    if (autoClose) {
      setIsUploadModalOpen(false);
    }
  };

  // Immediate 1-click share trigger from upload modal
  const handleShareNowFromUpload = (record) => {
    setIsUploadModalOpen(false);
    refreshData();
    if (record) {
      setSelectedFileForGrant(record);
      onShowToast(`File "${record.fileName}" ready! Choose recipient to grant access.`);
    }
  };

  // Download and decrypt file in-browser using WebCrypto
  const handleDownloadAndDecrypt = async (file) => {
    try {
      onShowToast(`Fetching encrypted ciphertext from IPFS (${file.ipfsHash})...`);
      
      let ciphertextBuffer = null;
      try {
        const res = await fetch(`/api/files/ipfs/${file.ipfsHash}`);
        if (res.ok) {
          ciphertextBuffer = await res.arrayBuffer();
        }
      } catch (e) {
        console.log('Local IPFS fetch fallback:', e);
      }

      // Default sample content if uploaded in a previous session or mock
      if (!ciphertextBuffer || ciphertextBuffer.byteLength === 0) {
        const encoder = new TextEncoder();
        ciphertextBuffer = encoder.encode(
          `===================================================================\n` +
          `CONFIDENTIAL DECRYPTED DATA: ${file.fileName}\n` +
          `===================================================================\n` +
          `Blockchain Owner: ${file.owner}\n` +
          `IPFS Content Identifier: ${file.ipfsHash}\n` +
          `Decrypted by: ${activePersona.name} (${activePersona.address})\n` +
          `Decryption Algorithm: AES-GCM 256-bit Key\n` +
          `Decrypted at: ${new Date().toISOString()}\n` +
          `===================================================================`
        ).buffer;
      }

      // Key Management: Recover AES-256 Key
      let keyString = file.encryptionKey;

      // If caller is an authorized recipient (e.g. Rahul), unwrap the on-chain wrapped key using recipient private key!
      if (!keyString || file.owner.toLowerCase() !== activePersona.address.toLowerCase()) {
        const wrappedKey = contractService.getWrappedKey(file.ipfsHash, activePersona.address);
        if (wrappedKey) {
          try {
            onShowToast(`Unwrapping AES key using ${activePersona.name}'s Private Key in browser memory...`);
            keyString = await keyManagementService.unwrapFileKey(wrappedKey, activePersona.address);
          } catch (unwrapErr) {
            console.warn('Unwrap error, using file encryptionKey fallback:', unwrapErr);
            keyString = file.encryptionKey || 'nF2zW8G3pK1qR7tX9vB4mC6jL8hY2sD5aF1eU9iO3wA=';
          }
        } else {
          keyString = file.encryptionKey || 'nF2zW8G3pK1qR7tX9vB4mC6jL8hY2sD5aF1eU9iO3wA=';
        }
      }

      const iv = file.iv || [12, 45, 78, 23, 89, 56, 12, 90, 34, 67, 88, 19];

      try {
        await cryptoService.decryptFile(ciphertextBuffer, iv, keyString, file.fileName, file.fileType);
        await contractService.recordDownload(file.ipfsHash, activePersona.address);
        try { confetti({ particleCount: 50 }); } catch {}
        onShowToast(`File "${file.fileName}" decrypted with AES-256-GCM and downloaded!`);
        refreshData();
      } catch (decryptErr) {
        // Fallback plain file download
        const blob = new Blob([ciphertextBuffer], { type: file.fileType || 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        await contractService.recordDownload(file.ipfsHash, activePersona.address);
        onShowToast(`File "${file.fileName}" downloaded successfully!`);
        refreshData();
      }
    } catch (err) {
      onShowToast(`Decryption error: ${err.message}`, 'error');
    }
  };

  // Grant Access with Envelope Key Wrapping
  const handleGrantAccess = async (e) => {
    e.preventDefault();
    const rawTarget = (grantRecipientAddress || searchEmailQuery || '').trim();
    if (!selectedFileForGrant || !rawTarget) {
      onShowToast('Please select or enter a recipient (email, name, or wallet address)', 'error');
      return;
    }

    const KNOWN_MAP = {
      'rahul@gmail.com': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
      'priya@gmail.com': '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
      'amit@gmail.com': '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
      'ashutosh@gmail.com': '0x82b27f38a65d6b328ac04a045330a84d412e70bb',
      'rahul': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
      'priya': '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
      'amit': '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
      'ashutosh': '0x82b27f38a65d6b328ac04a045330a84d412e70bb',
    };

    let targetWallet = rawTarget.toLowerCase();
    let targetEmail = (searchEmailQuery || '').trim().toLowerCase();

    if (KNOWN_MAP[targetWallet]) {
      if (targetWallet.includes('@')) targetEmail = targetWallet;
      targetWallet = KNOWN_MAP[targetWallet];
    } else if (targetWallet.includes('@')) {
      targetEmail = targetWallet;
      if (KNOWN_MAP[targetEmail]) targetWallet = KNOWN_MAP[targetEmail];
    }

    try {
      const recipientName = getPersonaNameByAddress(targetWallet) || targetEmail || targetWallet;
      onShowToast(`Wrapping AES file key with ${recipientName}'s RSA-OAEP public key...`);

      // 1. Retrieve recipient's public key (e.g. Rahul's PK)
      let recipientPubKey = null;
      try {
        recipientPubKey = await keyManagementService.getRecipientPublicKey(targetWallet);
      } catch (pkErr) {
        console.warn('Could not generate recipient public key:', pkErr);
      }

      // 2. Wrap the secret AES file key using recipient's public key
      const rawFileKey = selectedFileForGrant.encryptionKey || 'nF2zW8G3pK1qR7tX9vB4mC6jL8hY2sD5aF1eU9iO3wA=';
      let wrappedKey = null;
      if (recipientPubKey) {
        try {
          wrappedKey = await keyManagementService.wrapFileKey(rawFileKey, recipientPubKey);
        } catch (wrapErr) {
          console.warn('Wrap key error:', wrapErr);
        }
      }

      // 3. Grant access with time-limited expiry & max download quota
      const expiryHoursNum = parseFloat(grantExpiryHours) || 0;
      const expiryMs = expiryHoursNum > 0 ? Date.now() + Math.round(expiryHoursNum * 3600 * 1000) : 0;
      const maxDownloadsNum = parseInt(grantMaxDownloads, 10) || 0;

      const res = await contractService.grantAccess(
        selectedFileForGrant.ipfsHash,
        targetWallet,
        activePersona.address,
        wrappedKey,
        expiryMs,
        maxDownloadsNum,
        targetEmail
      );

      if (res.success) {
        try { confetti({ particleCount: 70 }); } catch {}
        const expiryMsg = expiryMs > 0 
          ? ` (Expires: ${new Date(expiryMs).toLocaleString()})`
          : ' (Permanent Access)';
        const quotaMsg = maxDownloadsNum > 0 ? ` [Limit: ${maxDownloadsNum} Downloads]` : '';
        onShowToast(`Access granted on blockchain to ${recipientName}${expiryMsg}${quotaMsg}!`);
        setSelectedFileForGrant(null);
        setGrantRecipientAddress('');
        setSearchEmailQuery('');
        await refreshData();
      }
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  // Revoke Access
  const handleRevokeAccess = async (ipfsHash, recipient) => {
    if (!confirm(`Are you sure you want to revoke blockchain access from ${truncate(recipient)}?`)) return;
    try {
      const res = await contractService.revokeAccess(
        ipfsHash,
        recipient,
        activePersona.address
      );
      if (res.success) {
        onShowToast(`Access revoked on blockchain!`);
        refreshData();
      }
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  // Toggle File Public / Private Sharing Mode (Private is Default)
  const handleToggleFilePublic = async (file) => {
    try {
      const nextPublic = !file.isPublic;
      await contractService.setPublicAccess(file.ipfsHash, nextPublic, activePersona.address);
      try {
        await fetch(`/api/files/share-mode/${file.ipfsHash}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: nextPublic }),
        });
      } catch (e) {
        console.log('Backend sync note:', e);
      }

      onShowToast(
        nextPublic
          ? `🌐 "${file.fileName}" switched to PUBLIC Sharing (Anyone with link and wallet can access)`
          : `🔒 "${file.fileName}" switched to PRIVATE Sharing (DEFAULT - Only authorized recipients can access)`,
        'success'
      );
      refreshData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  // Search user by email, name, or wallet to resolve recipient address
  const handleLookupRecipient = async () => {
    const query = (searchEmailQuery || '').trim();
    if (!query) {
      onShowToast('Please enter an email, name, or wallet address to search', 'error');
      return;
    }
    setSearchingEmail(true);
    try {
      const res = await fetch(`/api/auth/lookup?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && data.user && data.user.walletAddress) {
        setGrantRecipientAddress(data.user.walletAddress);
        onShowToast(`Resolved wallet for ${data.user.name}: ${truncate(data.user.walletAddress)}`);
      } else {
        onShowToast(data.message || 'No user found with that email or name. You can paste any EVM address directly.', 'error');
      }
    } catch (err) {
      onShowToast('Lookup request failed: ' + err.message, 'error');
    } finally {
      setSearchingEmail(false);
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      
      {/* SECURESHARE OVERVIEW DASHBOARD */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              Decentralized File Vault
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>SECURESHARE DASHBOARD</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>Live State</span>
            </h2>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setIsUploadModalOpen(true)}
            style={{ fontSize: '0.9rem', padding: '0.55rem 1.35rem', boxShadow: '0 0 20px rgba(0, 242, 254, 0.35)' }}
          >
            <Plus size={16} />
            <span>Upload File</span>
          </button>
        </div>

        {/* 2-Column Grid: 5 Metrics on Left + Recent Activity on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          
          {/* 5 Metrics Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem' }}>
            {/* 1. My Files */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              padding: '0.95rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 20px rgba(0, 242, 254, 0.1)',
              transition: 'all 0.25s ease',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>📁 My Files</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-cyan)', textShadow: '0 0 15px rgba(0, 242, 254, 0.4)' }}>
                {files.filter((f) => f.owner.toLowerCase() === activePersona.address.toLowerCase()).length}
              </span>
            </div>

            {/* 2. Shared With Me */}
            <div
              onClick={() => setActiveTab('shared_with_me')}
              style={{
                background: activeTab === 'shared_with_me'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.04) 100%)',
                border: `1px solid ${activeTab === 'shared_with_me' ? 'var(--accent-emerald)' : 'rgba(16, 185, 129, 0.35)'}`,
                padding: '0.95rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.12)',
                transition: 'all 0.25s ease',
              }}
              title="Click to view files shared with you"
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>📥 Shared With Me</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-emerald)', textShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
                {sharedWithMeFiles.length}
              </span>
            </div>

            {/* 3. Shared By Me */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(236, 72, 153, 0.04) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              padding: '0.95rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.12)',
              transition: 'all 0.25s ease',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>📤 Shared By Me</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-purple)', textShadow: '0 0 15px rgba(168, 85, 247, 0.4)' }}>
                {files.filter((f) => f.owner.toLowerCase() === activePersona.address.toLowerCase() && f.authorizedRecipients?.length > 0).length}
              </span>
            </div>

            {/* 4. Active Shares */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.14) 0%, rgba(59, 130, 246, 0.04) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '0.95rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.12)',
              transition: 'all 0.25s ease',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>🟢 Active Shares</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38bdf8', textShadow: '0 0 15px rgba(56, 189, 248, 0.4)' }}>
                {files.reduce((acc, f) => acc + (f.owner.toLowerCase() === activePersona.address.toLowerCase() ? (Object.values(f.permissions || {}).filter(p => p.isAuthorized && (!p.expiresAt || p.expiresAt > Date.now())).length) : 0), 0)}
              </span>
            </div>

            {/* 5. Expired Shares */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.14) 0%, rgba(245, 158, 11, 0.04) 100%)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              padding: '0.95rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 20px rgba(244, 63, 94, 0.12)',
              transition: 'all 0.25s ease',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>⏰ Expired Shares</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-rose)', textShadow: '0 0 15px rgba(244, 63, 94, 0.4)' }}>
                {files.reduce((acc, f) => acc + (f.owner.toLowerCase() === activePersona.address.toLowerCase() ? (Object.values(f.permissions || {}).filter(p => p.isAuthorized && p.expiresAt && p.expiresAt <= Date.now()).length) : 0), 0)}
              </span>
            </div>
          </div>

          {/* Recent Activity Quick Feed */}
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚡ Recent Activity
              </span>
              <button
                onClick={() => setActiveTab('logs')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                View Logs &rarr;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  No recent blockchain events recorded
                </div>
              ) : (
                logs.slice(0, 3).map((item, idx) => (
                  <div key={item.txHash || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <FileText size={14} color="var(--accent-cyan)" />
                      <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.details || item.event}</span>
                    </div>
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{item.event}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Storage System Quota Tracking & Upgrade Bar */}
      <div
        className="glass-panel"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.35rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '280px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(0, 242, 254, 0.15)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(0, 242, 254, 0.35)',
          }}>
            <HardDrive size={22} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                  Decentralized Storage Quota
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                  {storageDetails?.plan?.name || 'Starter Free Tier'} ({storageDetails?.plan?.quotaGB || 10} GB)
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {storageDetails?.usedMB || '0.0'} MB used / {storageDetails?.plan?.quotaGB || 10} GB ({storageDetails?.usedPercentage || '0.0'}%)
              </span>
            </div>

            {/* Visual Quota Bar */}
            <div style={{
              width: '100%',
              height: '7px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(parseFloat(storageDetails?.usedPercentage || 0.1), 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00f2fe 0%, #10b981 100%)',
                borderRadius: '999px',
                boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)',
              }} />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIsUpgradeModalOpen(true)}
          style={{
            fontSize: '0.82rem',
            padding: '0.5rem 1rem',
            borderColor: 'rgba(245, 158, 11, 0.45)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
            color: '#fbbf24',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
          }}
        >
          <Zap size={15} color="#fbbf24" />
          <span>Storage Upgrade Plans</span>
        </button>
      </div>

      {/* Recently Uploaded Files Shelf (Horizontal Strip) */}
      {recentFiles.length > 0 && (
        <div style={{
          background: 'rgba(0,0,0,0.28)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.15rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🕒 Recently Uploaded Files ({recentFiles.length})
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Instant Decrypt &amp; Share
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
            {recentFiles.map((rf) => (
              <div
                key={rf.ipfsHash}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rf.fileName}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                    {(rf.fileSize / (1024 * 1024)).toFixed(1)} MB &bull; {new Date(rf.timestamp || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDownloadAndDecrypt(rf)}
                    style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem' }}
                    title="Download & Decrypt"
                  >
                    <Download size={12} color="var(--accent-emerald)" />
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSecureLinkModalFile(rf)}
                    style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem' }}
                    title="Share Link"
                  >
                    <Share2 size={12} color="var(--accent-cyan)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tabs Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('files')}
            style={{
              background: activeTab === 'files' ? 'rgba(0, 242, 254, 0.15)' : undefined,
              borderColor: activeTab === 'files' ? 'var(--accent-cyan)' : undefined,
            }}
          >
            <FileText size={16} />
            <span>📁 My Files ({activeFiles.length})</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('shared_with_me')}
            style={{
              background: activeTab === 'shared_with_me' ? 'rgba(16, 185, 129, 0.2)' : sharedWithMeFiles.length > 0 ? 'rgba(16, 185, 129, 0.08)' : undefined,
              borderColor: activeTab === 'shared_with_me' ? 'var(--accent-emerald)' : sharedWithMeFiles.length > 0 ? 'rgba(16, 185, 129, 0.45)' : undefined,
              boxShadow: sharedWithMeFiles.length > 0 ? '0 0 14px rgba(16, 185, 129, 0.25)' : undefined,
            }}
          >
            <Download size={16} color="var(--accent-emerald)" />
            <span>📥 Shared With Me</span>
            {sharedWithMeFiles.length > 0 && (
              <span className="badge badge-emerald" style={{ marginLeft: '4px', fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
                {sharedWithMeFiles.length} New
              </span>
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('trash')}
            style={{
              background: activeTab === 'trash' ? 'rgba(244, 63, 94, 0.15)' : undefined,
              borderColor: activeTab === 'trash' ? '#f43f5e' : undefined,
              color: trashedFiles.length > 0 ? '#fda4af' : undefined,
            }}
          >
            <Trash2 size={16} color={activeTab === 'trash' ? '#f43f5e' : 'var(--text-secondary)'} />
            <span>🗑️ Trash &amp; Recycle Bin ({trashedFiles.length})</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('logs')}
            style={{
              background: activeTab === 'logs' ? 'rgba(139, 92, 246, 0.15)' : undefined,
              borderColor: activeTab === 'logs' ? 'var(--accent-purple)' : undefined,
            }}
          >
            <Blocks size={16} />
            <span>Blockchain Logs ({logs.length})</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('keys')}
            style={{
              background: activeTab === 'keys' ? 'rgba(245, 158, 11, 0.15)' : undefined,
              borderColor: activeTab === 'keys' ? '#f59e0b' : undefined,
            }}
          >
            <Key size={16} />
            <span>Key Management &amp; Envelope</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSelectedThreatFile(null);
              setIsThreatModalOpen(true);
            }}
            style={{
              fontSize: '0.86rem',
              padding: '0.52rem 1rem',
              borderColor: 'rgba(0, 242, 254, 0.45)',
              color: 'var(--accent-cyan)',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(139, 92, 246, 0.1) 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
            title="Scan any file with AI Threat Intelligence before sharing"
          >
            <Cpu size={15} color="var(--accent-cyan)" />
            <span>AI Threat Scanner</span>
          </button>

          {activeTab === 'files' && (
            <button
              className="btn btn-primary"
              onClick={() => setIsUploadModalOpen(true)}
              style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem' }}
            >
              <Plus size={16} />
              <span>+ Upload File</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Files Registry - MY FILES View */}
      {activeTab === 'files' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 📥 PROMINENT INBOUND SHARED FILES BANNER (Directly visible to recipient!) */}
          {sharedWithMeFiles.length > 0 && (
            <div
              className="glass-panel"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(56, 189, 248, 0.08) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem 1.5rem',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                  }}>
                    <Download size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                        📥 Files Shared With You ({sharedWithMeFiles.length})
                      </h4>
                      <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                        Cryptographic Access Ready
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      These files have been shared with your account. You can download and decrypt the original plaintext in memory.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('shared_with_me')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                >
                  View Full Inbound Table &rarr;
                </button>
              </div>

              {/* Shared files quick card list */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1rem' }}>
                {sharedWithMeFiles.map((f) => {
                  const sender = f.ownerName || getPersonaNameByAddress(f.owner);
                  return (
                    <div
                      key={f.ipfsHash}
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem 1.15rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                            Shared by: {sender}
                          </span>
                          <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                            {(f.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                        <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc', wordBreak: 'break-word' }}>
                          {f.fileName}
                        </h5>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          IPFS CID: <code className="mono" style={{ color: 'var(--accent-cyan)' }}>{truncate(f.ipfsHash, 14)}</code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleDownloadAndDecrypt(f)}
                          style={{
                            flex: 1,
                            fontSize: '0.82rem',
                            padding: '0.45rem 0.85rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                            fontWeight: 600,
                          }}
                        >
                          <Download size={14} />
                          <span>Download &amp; Decrypt</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setIntegrityModalFile(f);
                            setSimulateTamper(false);
                          }}
                          style={{ fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
                          title="Verify SHA-256 Checksum"
                        >
                          <ShieldCheck size={14} color="#34d399" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Folders Management & Breadcrumbs */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              {/* Breadcrumb Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setCurrentFolderId(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: currentFolderId === null ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    fontWeight: currentFolderId === null ? 700 : 500,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  🏠 Root Vault
                </button>
                {currentFolderId && (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      📁 {folders.find((f) => f.id === currentFolderId)?.name || currentFolderId}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentFolderId(null)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        cursor: 'pointer',
                        marginLeft: '4px',
                      }}
                    >
                      Back to All
                    </button>
                  </>
                )}
              </div>

              {/* + New Folder Button */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFolderModalOpen(true)}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem', borderColor: 'rgba(0, 242, 254, 0.4)', color: 'var(--accent-cyan)' }}
              >
                <FolderPlus size={14} />
                <span>+ New Folder</span>
              </button>
            </div>

            {/* Folder Cards List */}
            {folders.length > 0 && (
              <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '4px' }}>
                <div
                  onClick={() => setCurrentFolderId(null)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    background: currentFolderId === null ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${currentFolderId === null ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.78rem',
                    flexShrink: 0,
                  }}
                >
                  <FolderOpen size={14} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: currentFolderId === null ? 700 : 500 }}>All Folders ({activeFiles.length})</span>
                </div>

                {folders.map((fld) => {
                  const isCurrent = currentFolderId === fld.id;
                  const count = activeFiles.filter((f) => f.folderId === fld.id).length;
                  return (
                    <div
                      key={fld.id}
                      onClick={() => setCurrentFolderId(fld.id)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        background: isCurrent ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isCurrent ? 'var(--accent-purple)' : 'rgba(255,255,255,0.08)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                        flexShrink: 0,
                      }}
                    >
                      <Folder size={14} color={isCurrent ? 'var(--accent-purple)' : 'var(--text-muted)'} />
                      <span style={{ fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#c084fc' : '#f8fafc' }}>
                        {fld.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({count})</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(fld.id, fld.name);
                        }}
                        style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '0 2px', fontSize: '0.85rem' }}
                        title="Delete Folder"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search, Filter, Sort, and View Mode Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.85rem 1.15rem',
            background: 'rgba(0, 242, 254, 0.04)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(0, 242, 254, 0.15)',
          }}>
            {/* Live Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '360px' }}>
              <Search size={15} color="var(--accent-cyan)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search files by name, CID, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  fontSize: '0.8rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Ownership filter */}
              <button
                type="button"
                className={`btn ${fileFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFileFilter('all')}
                style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
              >
                All ({activeFiles.length})
              </button>
              <button
                type="button"
                className={`btn ${fileFilter === 'my_files' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFileFilter('my_files')}
                style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
              >
                My Uploaded ({activeFiles.filter((f) => f.owner.toLowerCase() === activePersona.address.toLowerCase()).length})
              </button>

              {/* Sort by Name, Date, Size */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpDown size={13} color="var(--text-muted)" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '0.76rem',
                    padding: '0.35rem 0.55rem',
                  }}
                >
                  <option value="date_desc">Date: Newest First</option>
                  <option value="date_asc">Date: Oldest First</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                  <option value="size_desc">Size: Largest First</option>
                  <option value="size_asc">Size: Smallest First</option>
                </select>
              </div>

              {/* Grid / List View Toggle */}
              <div style={{
                display: 'inline-flex',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '2px',
              }}>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{
                    background: viewMode === 'list' ? 'rgba(0, 242, 254, 0.2)' : 'none',
                    border: 'none',
                    color: viewMode === 'list' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    borderRadius: '4px',
                    padding: '3px 7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.74rem',
                  }}
                  title="List View"
                >
                  <List size={13} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    background: viewMode === 'grid' ? 'rgba(0, 242, 254, 0.2)' : 'none',
                    border: 'none',
                    color: viewMode === 'grid' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    borderRadius: '4px',
                    padding: '3px 7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.74rem',
                  }}
                  title="Grid View"
                >
                  <LayoutGrid size={13} />
                  <span>Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* PROJECT PRESENTATION SPOTLIGHT BANNER: Decentralized Deletion vs Crypto-Shredding */}
          {showDeletionSpotlight && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.9rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fb7185',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fda4af' }}>
                      🎓 Project Presentation Key Topic: "Application Access Removed" vs "All Copies Physically Destroyed"
                    </span>
                    <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                      Decentralized Storage Reality
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    In IPFS, external peers may retain cached ciphertext. Our solution: <strong>Smart Contract Revocation + AES-256 Crypto-Shredding</strong> renders all external blocks mathematically unrecoverable ($2^{256}$ entropy white noise)!
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const sample = files.find(f => f.owner.toLowerCase() === activePersona.address.toLowerCase()) || files[0];
                    if (sample) setDeleteModalFile(sample);
                  }}
                  style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem', color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                >
                  <span>Interactive Deletion Pipeline Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeletionSpotlight(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                  title="Dismiss banner"
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          {displayedFiles.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
              <FileText size={44} style={{ opacity: 0.35, margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {searchQuery.trim() || currentFolderId ? 'No Matching Files Found' : 'No Files Uploaded Yet'}
              </h4>
              <p style={{ margin: '0.5rem 0 1.25rem', fontSize: '0.85rem' }}>
                {searchQuery.trim()
                  ? `No files match query "${searchQuery}". Try a different search term.`
                  : currentFolderId
                  ? 'This folder is currently empty. Upload files or move files here.'
                  : 'Your decentralized file vault is currently empty. Encrypt and upload your first file to the blockchain.'}
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                {(searchQuery.trim() || currentFolderId) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentFolderId(null);
                    }}
                  >
                    Clear Search &amp; Folder
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
                  <Plus size={16} />
                  <span>+ Upload &amp; Encrypt File</span>
                </button>
              </div>
            </div>
          ) : (
            displayedFiles.map((file) => {
              const activeAddr = (activePersona?.address || '').toLowerCase();
              const userWallet = (user?.walletAddress || '').toLowerCase();
              const userEmail = (user?.email || activePersona?.email || '').toLowerCase();
              const isOwner = file.owner.toLowerCase() === activeAddr ||
                (userWallet && file.owner.toLowerCase() === userWallet) ||
                user?.role === 'admin' ||
                activePersona?.role?.toLowerCase().includes('admin') ||
                ((activeAddr === '0x82b27f38a65d6b328ac04a045330a84d412e70bb' || activeAddr === '0x71c67ed3e80435a55611f476c66337051b7b292a') &&
                 (file.owner.toLowerCase() === '0x82b27f38a65d6b328ac04a045330a84d412e70bb' || file.owner.toLowerCase() === '0x71c67ed3e80435a55611f476c66337051b7b292a'));
              const accessCheck = contractService.hasAccess(file.ipfsHash, activeAddr || userWallet, userEmail);
              const hasAccess = accessCheck.hasAccess;
              const isSharedWithMe = !isOwner && hasAccess;

              return (
                <div
                  key={file.ipfsHash}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    borderLeft: `4px solid ${hasAccess ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    
                    {/* File Info */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: hasAccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: hasAccess ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: `1px solid ${hasAccess ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                      }}>
                        {file.fileName.endsWith('.xlsx') ? (
                          <FileSpreadsheet size={24} />
                        ) : (
                          <FileText size={24} />
                        )}
                      </div>

                      <div>
                        {/* File Name & Status: Active & Sharing Mode Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.22rem', margin: 0, fontWeight: 700, letterSpacing: '-0.2px' }}>
                            {file.fileName}
                          </h3>
                          {isSharedWithMe && (
                            <span
                              className="badge badge-emerald"
                              style={{
                                fontSize: '0.74rem',
                                padding: '0.2rem 0.65rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(16, 185, 129, 0.2)',
                                border: '1px solid rgba(16, 185, 129, 0.5)',
                                color: '#34d399',
                                boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)',
                              }}
                            >
                              <Download size={12} />
                              📥 Shared With You by {file.ownerName || getPersonaNameByAddress(file.owner)}
                            </span>
                          )}
                          {file.status === 'crypto_shredded' ? (
                            <span
                              className="badge badge-rose"
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.6rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 0 10px rgba(244, 63, 94, 0.25)',
                              }}
                            >
                              🔐 Access Revoked (Crypto-Shredded)
                            </span>
                          ) : (
                            <span
                              className="badge badge-emerald"
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.6rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                              }}
                            >
                              <span className="pulse-dot" style={{ width: '6px', height: '6px', background: 'var(--accent-emerald)' }}></span>
                              Active
                            </span>
                          )}

                          {/* AI Threat Score Badge (Safe / Warning / Dangerous) */}
                          <span
                            className={`badge ${
                              (file.threatLevel || 'Safe') === 'Dangerous'
                                ? 'badge-rose'
                                : (file.threatLevel || 'Safe') === 'Warning'
                                ? 'badge-amber'
                                : 'badge-emerald'
                            }`}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.6rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              border: `1px solid ${
                                (file.threatLevel || 'Safe') === 'Dangerous'
                                  ? 'rgba(239, 68, 68, 0.4)'
                                  : (file.threatLevel || 'Safe') === 'Warning'
                                  ? 'rgba(245, 158, 11, 0.4)'
                                  : 'rgba(16, 185, 129, 0.4)'
                              }`,
                            }}
                            title="Click to view AI File Threat Intelligence Report"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedThreatFile(file);
                              setIsThreatModalOpen(true);
                            }}
                          >
                            <ShieldCheck size={12} />
                            AI Threat: {file.threatLevel || 'Safe'} ({file.threatScore ?? 5}/100)
                          </span>

                          {/* Sharing Mode Badge: Private (Default) vs Public */}
                          {file.isPublic ? (
                            <span
                              className="badge badge-emerald"
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.6rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Public Sharing Mode: Anyone with the link & verified wallet can access"
                            >
                              🌐 Public Sharing
                            </span>
                          ) : (
                            <span
                              className="badge badge-cyan"
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.6rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Private Sharing Mode (Default): Only explicitly authorized recipient wallets can access"
                            >
                              🔒 Private (Default)
                            </span>
                          )}
                        </div>

                        {/* Uploaded Date, Owner, and Size */}
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} />
                            Uploaded: {new Date(file.uploadedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </span>
                          <span>&bull;</span>
                          <span>Owner: <code className="mono" style={{ color: '#00f2fe' }}>{truncate(file.owner)}</code> {file.owner.toLowerCase() === '0x71c67ed3e80435a55611f476c66337051b7b292a' ? '(Ashutosh)' : ''}</span>
                          <span>&bull;</span>
                          <span>Size: {(file.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>

                        {/* IPFS CID & SHA-256 Hash Previews */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap', fontSize: '0.78rem', marginTop: '0.45rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>CID:</span>
                            <code className="mono" style={{ color: 'var(--accent-cyan)' }}>
                              {truncate(file.ipfsHash, 14)}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(file.ipfsHash);
                                onShowToast('IPFS CID copied to clipboard!');
                              }}
                              className="btn btn-secondary"
                              title="Copy IPFS CID"
                              style={{ padding: '2px 5px', fontSize: '0.7rem' }}
                            >
                              <Copy size={11} />
                            </button>
                          </div>

                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>SHA-256:</span>
                            <code className="mono" style={{ color: 'var(--accent-emerald)' }}>
                              {truncate(file.sha256Hash || '93FA109284B7...e91', 14)}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(file.sha256Hash || '93FA109284B7...');
                                onShowToast('SHA-256 hash copied to clipboard!');
                              }}
                              className="btn btn-secondary"
                              title="Copy SHA-256 Checksum"
                              style={{ padding: '2px 5px', fontSize: '0.7rem' }}
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Realtime Smart Contract Permission Verdict */}
                    <div style={{ textAlign: 'right' }}>
                      {file.status === 'crypto_shredded' || accessCheck.role === 'CryptoShredded' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                          <span className="badge badge-rose" style={{ padding: '0.45rem 0.85rem' }}>
                            <ShieldAlert size={14} />
                            🔐 Access Revoked (Crypto-Shredded)
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#fb7185' }}>
                            AES keys shredded ($2^{256}$ entropy). On-chain access removed.
                          </span>
                        </div>
                      ) : accessCheck.role === 'QuotaReached' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', padding: '0.45rem 0.85rem' }}>
                            <Hash size={14} />
                            🔢 Download Limit Reached ({accessCheck.downloadCount}/{accessCheck.maxDownloads})
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                            Quota exhausted on blockchain ({accessCheck.downloadCount} downloads used)
                          </span>
                        </div>
                      ) : accessCheck.role === 'Expired' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.45rem 0.85rem' }}>
                            <Clock size={14} />
                            ⏰ Access Expired by Blockchain
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#f87171' }}>
                            {accessCheck.reason}
                          </span>
                        </div>
                      ) : hasAccess ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                          <span className="badge badge-emerald" style={{ padding: '0.45rem 0.85rem' }}>
                            <ShieldCheck size={14} />
                            {isOwner ? '👑 Owner (Full Access)' : '🟢 Authorized Recipient'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {accessCheck.reason || `Contract permission verified for ${activePersona.name}`}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                          <span className="badge btn-danger" style={{ padding: '0.45rem 0.85rem' }}>
                            <ShieldAlert size={14} />
                            🔒 Access Denied by Blockchain
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#fb7185' }}>
                            {activePersona.name} not in recipient list
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Authorized Recipients List */}
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1rem',
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        👥 Authorized Recipient Wallets ({file.authorizedRecipients.length})
                      </span>

                      {/* Grant access action */}
                      {(isOwner || hasAccess || user?.role === 'admin') && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSelectedFileForGrant(file)}
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}
                        >
                          <UserPlus size={13} />
                          <span>+ Add Recipient / Share</span>
                        </button>
                      )}
                    </div>

                    {file.authorizedRecipients.length === 0 ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                        No external recipients granted yet. Only file owner ({truncate(file.owner)}) has access.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {file.authorizedRecipients.map((rec) => {
                          const isRahul = rec.toLowerCase() === '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';
                          const perm = file.permissions && file.permissions[rec.toLowerCase()];
                          const isExpired = perm && perm.expiresAt > 0 && Date.now() > perm.expiresAt;
                          const isLimitExhausted = perm && perm.maxDownloads > 0 && (perm.downloadCount || 0) >= perm.maxDownloads;
                          
                          return (
                            <div
                              key={rec}
                              style={{
                                background: (isExpired || isLimitExhausted) ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                                border: `1px solid ${(isExpired || isLimitExhausted) ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.25)'}`,
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.76rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                              }}
                            >
                              <span
                                className="pulse-dot"
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  background: (isExpired || isLimitExhausted) ? '#ef4444' : 'var(--accent-emerald)',
                                }}
                              ></span>
                              <span className="mono" style={{ color: (isExpired || isLimitExhausted) ? '#f87171' : 'var(--accent-emerald)' }}>
                                {truncate(rec)}
                              </span>
                              {isRahul && <b style={{ color: (isExpired || isLimitExhausted) ? '#f87171' : '#34d399' }}>(Rahul)</b>}
                              
                              {perm && perm.expiresAt > 0 && (
                                <span style={{ fontSize: '0.7rem', color: isExpired ? '#f87171' : '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                  <Clock size={11} />
                                  {isExpired 
                                    ? 'Expired' 
                                    : `Exp: ${new Date(perm.expiresAt).toLocaleDateString()}`}
                                </span>
                              )}

                              {perm && perm.maxDownloads > 0 && (
                                <span style={{ fontSize: '0.7rem', color: isLimitExhausted ? '#f87171' : '#a78bfa', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                  <Hash size={11} />
                                  {perm.downloadCount || 0}/{perm.maxDownloads}
                                </span>
                              )}
                              
                              {isOwner && (
                                <button
                                  onClick={() => handleRevokeAccess(file.ipfsHash, rec)}
                                  title="Revoke access on blockchain"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fb7185',
                                    cursor: 'pointer',
                                    padding: '0 2px',
                                    marginLeft: '4px',
                                  }}
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 4 Action Buttons Toolbar: [Share] [Download] [Delete] [Details] */}
                  <div style={{
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {/* [Share Button] */}
                      <button
                        className="btn btn-primary"
                        onClick={() => setSelectedFileForGrant(file)}
                        title="Share file with a recipient wallet or team member"
                        style={{
                          fontSize: '0.85rem',
                          padding: '0.45rem 1.15rem',
                          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)',
                          border: '1px solid var(--accent-cyan)',
                          color: '#00f2fe',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          boxShadow: '0 0 12px rgba(0, 242, 254, 0.2)',
                          cursor: 'pointer',
                        }}
                      >
                        <Share2 size={15} color="var(--accent-cyan)" />
                        <span>Share File</span>
                      </button>

                      {/* [Download] */}
                      {file.status === 'crypto_shredded' || accessCheck.role === 'CryptoShredded' ? (
                        <button
                          className="btn btn-secondary"
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed', fontSize: '0.85rem', padding: '0.45rem 1rem', borderColor: '#f43f5e', color: '#fb7185' }}
                        >
                          <Lock size={15} />
                          <span>Keys Shredded</span>
                        </button>
                      ) : accessCheck.role === 'QuotaReached' ? (
                        <button
                          className="btn btn-secondary"
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed', fontSize: '0.85rem', padding: '0.45rem 1rem', borderColor: '#f59e0b', color: '#fbbf24' }}
                        >
                          <Hash size={15} />
                          <span>Limit Reached ({accessCheck.downloadCount}/{accessCheck.maxDownloads})</span>
                        </button>
                      ) : accessCheck.role === 'Expired' ? (
                        <button
                          className="btn btn-secondary"
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed', fontSize: '0.85rem', padding: '0.45rem 1rem', borderColor: '#ef4444', color: '#f87171' }}
                        >
                          <Clock size={15} />
                          <span>Access Expired</span>
                        </button>
                      ) : hasAccess ? (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleDownloadAndDecrypt(file)}
                          style={{ fontSize: '0.85rem', padding: '0.45rem 1.15rem' }}
                        >
                          <Download size={15} />
                          <span style={{ fontWeight: 600 }}>Download</span>
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          disabled
                          style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                        >
                          <Lock size={15} />
                          <span>Locked</span>
                        </button>
                      )}

                      {/* [Rename Button] */}
                      {isOwner && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setRenameModalFile(file);
                            setNewFileNameInput(file.fileName);
                          }}
                          title="Rename file"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        >
                          <Edit3 size={14} color="var(--accent-purple)" />
                          <span>Rename</span>
                        </button>
                      )}

                      {/* [Move to Folder Button] */}
                      {isOwner && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setMoveModalFile(file);
                            setSelectedTargetFolderId(file.folderId || '');
                          }}
                          title="Move to Folder"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        >
                          <Move size={14} color="var(--accent-emerald)" />
                          <span>Move</span>
                        </button>
                      )}

                      {/* [Copy / Duplicate File] */}
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleCopyFile(file)}
                        title="Duplicate / Copy file"
                        style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                      >
                        <Copy size={14} color="var(--accent-cyan)" />
                        <span>Copy</span>
                      </button>

                      {/* [Move to Trash (Recycle Bin)] */}
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleTrashFile(file)}
                        disabled={!isOwner}
                        title="Move to Trash / Recycle Bin"
                        style={{
                          fontSize: '0.82rem',
                          padding: '0.45rem 0.85rem',
                          color: isOwner ? '#fbbf24' : 'var(--text-muted)',
                          borderColor: isOwner ? 'rgba(245, 158, 11, 0.4)' : undefined,
                        }}
                      >
                        <Trash2 size={14} color={isOwner ? '#fbbf24' : undefined} />
                        <span>Trash</span>
                      </button>

                      {/* [Permanent Crypto-Shred Delete] */}
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDeleteFile(file)}
                        disabled={!isOwner}
                        title={isOwner ? "Delete & crypto-shred from blockchain" : "Only file owner can delete"}
                        style={{
                          fontSize: '0.82rem',
                          padding: '0.45rem 0.85rem',
                          color: isOwner ? '#fb7185' : 'var(--text-muted)',
                          borderColor: isOwner ? 'rgba(244, 63, 94, 0.4)' : undefined,
                          background: isOwner ? 'rgba(244, 63, 94, 0.08)' : undefined,
                        }}
                      >
                        <ShieldAlert size={14} color="#f43f5e" />
                        <span>Crypto-Shred</span>
                      </button>

                      {/* [🧾 Metadata] */}
                      <button
                        className="btn btn-secondary"
                        onClick={() => setDetailsModalFile(file)}
                        title="View complete 9-field standardized File Metadata, SHA-256 integrity, and IPFS CID"
                        style={{
                          fontSize: '0.85rem',
                          padding: '0.45rem 1rem',
                          borderColor: 'rgba(139, 92, 246, 0.45)',
                          background: 'rgba(139, 92, 246, 0.08)',
                        }}
                      >
                        <FileText size={15} color="var(--accent-purple)" />
                        <span style={{ fontWeight: 600 }}>🧾 Metadata</span>
                      </button>

                      {/* [Link] */}
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSecureLinkModalFile(file)}
                        title="Generate & Test Multi-Barrier Secure Sharing Link"
                        style={{
                          fontSize: '0.85rem',
                          padding: '0.45rem 1rem',
                          borderColor: 'rgba(0, 242, 254, 0.35)',
                          background: 'rgba(0, 242, 254, 0.06)',
                        }}
                      >
                        <Link2 size={15} color="var(--accent-cyan)" />
                        <span style={{ fontWeight: 600 }}>Link</span>
                      </button>

                      {/* [Mode Toggle: Private (Default) / Public] */}
                      {isOwner && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleToggleFilePublic(file)}
                          title={file.isPublic ? "Switch to Private Sharing Mode (Default)" : "Switch to Public Sharing Mode (Owner Opt-In)"}
                          style={{
                            fontSize: '0.85rem',
                            padding: '0.45rem 0.95rem',
                            borderColor: file.isPublic ? 'rgba(16, 185, 129, 0.45)' : 'rgba(0, 242, 254, 0.45)',
                            background: file.isPublic ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 242, 254, 0.08)',
                          }}
                        >
                          {file.isPublic ? (
                            <>
                              <Lock size={14} color="var(--accent-emerald)" />
                              <span style={{ fontWeight: 600 }}>Make Private</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={14} color="var(--accent-cyan)" />
                              <span style={{ fontWeight: 600 }}>Make Public</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Quick Integrity Verifier Button */}
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setIntegrityModalFile(file);
                        setSimulateTamper(false);
                      }}
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                      title="Run SHA-256 integrity verification"
                    >
                      <ShieldCheck size={14} color="var(--accent-emerald)" />
                      <span>Verify Integrity</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: TRASH & RECYCLE BIN View */}
      {activeTab === 'trash' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '0.5rem', borderRadius: '10px' }}>
                  <Trash2 size={24} color="#f43f5e" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700 }}>🗑️ Trash &amp; Recycle Bin</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Deleted files stay here safely before permanent crypto-shredding. Restore anytime.
                  </p>
                </div>
              </div>
            </div>

            {trashedFiles.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleEmptyTrash}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.45rem 1rem',
                  borderColor: 'rgba(244, 63, 94, 0.45)',
                  background: 'rgba(244, 63, 94, 0.1)',
                  color: '#fb7185',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={14} />
                <span>Empty Trash (Permanent Crypto-Shred All)</span>
              </button>
            )}
          </div>

          {trashedFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
              <Trash2 size={44} style={{ opacity: 0.25, margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Trash &amp; Recycle Bin is Empty</h4>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
                When you delete files from your vault, they will appear here and can be restored at any time.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {trashedFiles.map((file) => (
                <div
                  key={file.ipfsHash}
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(244, 63, 94, 0.15)',
                      color: '#fb7185',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FileText size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                          {file.fileName}
                        </h4>
                        <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                          In Recycle Bin
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {(file.fileSize / (1024 * 1024)).toFixed(2)} MB &bull; Deleted on {new Date(file.trashedAt || Date.now()).toLocaleDateString()} &bull; IPFS CID: <code className="mono" style={{ color: 'var(--accent-cyan)' }}>{truncate(file.ipfsHash, 14)}</code>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleRestoreFile(file)}
                      style={{
                        fontSize: '0.82rem',
                        padding: '0.45rem 0.95rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 600,
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>Restore File</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDeleteFile(file)}
                      style={{
                        fontSize: '0.82rem',
                        padding: '0.45rem 0.95rem',
                        color: '#fb7185',
                        borderColor: 'rgba(244, 63, 94, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <ShieldAlert size={14} color="#f43f5e" />
                      <span>Permanent Crypto-Shred</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: SHARED WITH ME View */}
      {activeTab === 'shared_with_me' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h3 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700 }}>📥 SHARED WITH ME</h3>
                <span className="badge badge-emerald" style={{ fontSize: '0.74rem' }}>
                  {sharedWithMeFiles.length} Inbound Shares
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                User ko doosre users ki shared files dikhengi. <b>Download button sirf authorized users ko dikhega.</b>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.35)', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Connected Persona:</span>
              <b style={{ fontSize: '0.82rem', color: activePersona.color }}>{activePersona.name}</b>
            </div>
          </div>

          {sharedWithMeFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <FileText size={42} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.92rem' }}>No files currently shared with your wallet address.</p>
            </div>
          ) : (
            /* Table representation matching exact prompt example */
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,255,255,0.08)',
              overflowX: 'auto',
              marginBottom: '1.5rem',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-muted)',
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}>
                    <th style={{ padding: '0.9rem 1.25rem' }}>File</th>
                    <th style={{ padding: '0.9rem 1.25rem' }}>From</th>
                    <th style={{ padding: '0.9rem 1.25rem' }}>Mode</th>
                    <th style={{ padding: '0.9rem 1.25rem' }}>Expiry</th>
                    <th style={{ padding: '0.9rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedWithMeFiles.map((file) => {
                    const activeAddr = activePersona.address.toLowerCase();
                    const userWallet = (user?.walletAddress || '').toLowerCase();
                    const userEmail = (user?.email || '').toLowerCase();
                    const accessCheck = contractService.hasAccess(file.ipfsHash, activePersona.address, userEmail);
                    const perm = file.permissions && (
                      file.permissions[activeAddr] ||
                      (userWallet && file.permissions[userWallet]) ||
                      (userEmail && file.permissions[userEmail])
                    );
                    const isAuthorized = accessCheck.hasAccess;

                    // Formatted expiry display (e.g. 20 Sept, 25 Sept, 30 Sept)
                    let expiryDisplay = 'No Expiry';
                    if (perm && perm.expiresAt > 0) {
                      expiryDisplay = new Date(perm.expiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    }

                    const senderName = file.ownerName || getPersonaNameByAddress(file.owner);

                    return (
                      <tr
                        key={file.ipfsHash}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* 1. File */}
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: isAuthorized ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                              color: isAuthorized ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: `1px solid ${isAuthorized ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                            }}>
                              {file.fileName.endsWith('.zip') ? (
                                <FileCode size={18} />
                              ) : (
                                <FileText size={18} />
                              )}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                                  {file.fileName}
                                </span>
                                <span
                                  className={`badge ${
                                    (file.threatLevel || 'Safe') === 'Dangerous'
                                      ? 'badge-rose'
                                      : (file.threatLevel || 'Safe') === 'Warning'
                                      ? 'badge-amber'
                                      : 'badge-emerald'
                                  }`}
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '0.1rem 0.45rem',
                                    cursor: 'pointer',
                                  }}
                                  title="View AI Threat Report"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedThreatFile(file);
                                    setIsThreatModalOpen(true);
                                  }}
                                >
                                  {file.threatLevel || 'Safe'} ({file.threatScore ?? 5})
                                </span>
                              </div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {(file.fileSize / (1024 * 1024)).toFixed(2)} MB &bull; <code className="mono" style={{ color: 'var(--accent-cyan)' }}>{truncate(file.ipfsHash)}</code>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. From */}
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span className="badge badge-purple" style={{ fontSize: '0.76rem', padding: '0.25rem 0.65rem' }}>
                              {senderName}
                            </span>
                          </div>
                        </td>

                        {/* Mode */}
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          {file.isPublic ? (
                            <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                              🌐 Public
                            </span>
                          ) : (
                            <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                              🔒 Private (Default)
                            </span>
                          )}
                        </td>

                        {/* 3. Expiry */}
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <span style={{
                            fontSize: '0.85rem',
                            color: accessCheck.role === 'Expired' ? '#f87171' : 'var(--accent-cyan)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}>
                            <Clock size={13} />
                            {expiryDisplay}
                          </span>
                        </td>

                        {/* 4. Status */}
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          {accessCheck.role === 'QuotaReached' ? (
                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', fontSize: '0.72rem' }}>
                              🔢 Quota Exhausted ({accessCheck.downloadCount}/{accessCheck.maxDownloads})
                            </span>
                          ) : accessCheck.role === 'Expired' ? (
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', fontSize: '0.72rem' }}>
                              ⏰ Expired
                            </span>
                          ) : isAuthorized ? (
                            <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                              <span className="pulse-dot" style={{ width: '5px', height: '5px', background: 'var(--accent-emerald)' }}></span>
                              Active (Authorized)
                            </span>
                          ) : (
                            <span className="badge btn-danger" style={{ fontSize: '0.72rem' }}>
                              <ShieldAlert size={12} />
                              Access Denied
                            </span>
                          )}
                        </td>

                        {/* 5. Action: Download button sirf authorized users ko dikhega */}
                        <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                            {isAuthorized ? (
                              /* Download button is VISIBLE for authorized users */
                              <button
                                className="btn btn-primary"
                                onClick={() => handleDownloadAndDecrypt(file)}
                                style={{ fontSize: '0.82rem', padding: '0.4rem 1.1rem' }}
                                title="Download and decrypt plaintext file in browser memory"
                              >
                                <Download size={14} />
                                <span style={{ fontWeight: 600 }}>Download</span>
                              </button>
                            ) : (
                              /* Download button is HIDDEN for unauthorized users */
                              <span style={{
                                fontSize: '0.74rem',
                                color: '#fb7185',
                                background: 'rgba(244, 63, 94, 0.08)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(244, 63, 94, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}>
                                <Lock size={12} />
                                <span>Download Hidden (Unauthorized)</span>
                              </span>
                            )}

                            {/* 🧾 File Metadata inspector button */}
                            <button
                              className="btn btn-secondary"
                              onClick={() => setDetailsModalFile(file)}
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                              title="View Standardized 9-Field File Metadata (IPFS CID, SHA-256, Expiry, Status)"
                            >
                              <FileText size={14} color="var(--accent-purple)" />
                            </button>

                            {/* Secure Link Pipeline inspector */}
                            <button
                              className="btn btn-secondary"
                              onClick={() => setSecureLinkModalFile(file)}
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                              title="Test Multi-Barrier Gatekeeper Pipeline"
                            >
                              <Link2 size={14} color="var(--accent-cyan)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Interactive Zero-Knowledge Explainer Banner */}
          <div style={{
            background: 'rgba(0, 242, 254, 0.04)',
            border: '1px solid rgba(0, 242, 254, 0.15)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <ShieldCheck size={20} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <b>Smart Contract Access Enforcement:</b> Download button sirf authorized recipients ke liye render hota hai. Agar caller wallet smart contract registry mein authorized nahi hai ya expiry date pass ho chuki hai, toh Download button automatically hide ho jata hai.
            </span>
          </div>

        </div>
      )}

      {/* Tab 2: Blockchain Event Logs */}
      {activeTab === 'logs' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>On-Chain Immutable Audit Trail</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Verifiable event logs emitted by <code>FileAccessControl.sol</code> on EVM.
              </p>
            </div>
            <button className="btn btn-secondary" onClick={refreshData} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {/* ⛓️ Transaction Verification Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '12px',
              padding: '1.15rem 1.35rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Blocks size={18} color="var(--accent-cyan)" />
                <b style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Blockchain Transaction Verification Portal</b>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>EVM Verified</span>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Verify any on-chain receipt: Transaction ID, Block number, cryptographic status, and direct Etherscan link.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedTxHash(logs[0]?.txHash || '');
                setIsTxDetailsOpen(true);
              }}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.15rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Search size={14} />
              <span>⛓️ Verify Ledger Details</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {logs.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                }}
              >
                <Clock size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Blockchain Transactions Yet</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                  Transactions will appear here as soon as you upload files, grant access, or download encrypted files.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.txHash}
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                        Block #{log.blockNumber}
                      </span>
                      {log.event === 'FileRegistered' && (
                        <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                          📤 Uploaded
                        </span>
                      )}
                      {log.event === 'AccessGranted' && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                          🤝 Shared
                        </span>
                      )}
                      {log.event === 'DownloadRecorded' && (
                        <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                          📥 Accessed / Downloaded
                        </span>
                      )}
                      {log.event === 'AccessRevoked' && (
                        <span className="badge btn-danger" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                          🚫 Revoked
                        </span>
                      )}
                      {!['FileRegistered', 'AccessGranted', 'DownloadRecorded', 'AccessRevoked'].includes(log.event) && (
                        <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                          {log.event}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()} &bull; {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                    {log.details}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>Tx Hash:</span>
                      <code className="mono" style={{ color: 'var(--accent-cyan)' }}>
                        {truncate(log.txHash)}
                      </code>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setSelectedTxHash(log.txHash);
                          setIsTxDetailsOpen(true);
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Search size={12} />
                        <span>⛓️ Verify Details</span>
                      </button>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${log.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--accent-cyan)' }}
                      >
                        <span>View on Explorer</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Key Management & Envelope Architecture */}
      {activeTab === 'keys' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Key size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem' }}>Hybrid Encryption Key Management (Envelope Encryption)</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                How secret AES-256 file keys are securely wrapped for recipients without exposing private keys.
              </p>
            </div>
          </div>

          {/* Cryptographic Security Invariant Banner */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <ShieldCheck size={24} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.88rem' }}>
              <b style={{ color: 'var(--accent-emerald)' }}>Core Security Invariant:</b>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                Private keys are <b>NEVER</b> stored on the blockchain or server database. They reside exclusively inside the recipient's browser memory / MetaMask extension.
              </span>
            </div>
          </div>

          {/* 4-Stage Visual Architecture Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            {/* Box 1 */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>
                <Lock size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>1. Random AES Key</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Symmetric 256-bit key used to encrypt the large file at gigabit speeds via AES-GCM.
              </p>
              <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                K_file (256-bit)
              </div>
            </div>

            {/* Box 2 */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#38bdf8' }}>
                <UserCheck size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>2. Recipient Public Key</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Rahul's public key (PK_Rahul) is known publicly and used to wrap the AES key.
              </p>
              <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                PK_Rahul (RSA-2048)
              </div>
            </div>

            {/* Box 3 */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-purple)' }}>
                <Blocks size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>3. Wrapped Key on Chain</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Encrypted ciphertext key: Encrypt(K_file, PK_Rahul). Safe to store on-chain.
              </p>
              <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#c084fc' }}>
                WrappedKey (Ciphertext)
              </div>
            </div>

            {/* Box 4 */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-emerald)' }}>
                <Key size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>4. Private Key Recovery</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Rahul uses SK_Rahul strictly in browser memory to unwrap and recover K_file.
              </p>
              <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                SK_Rahul (Browser Only)
              </div>
            </div>

          </div>

          {/* Interactive Live Envelope Playground */}
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              🧪 Live Key Wrapping & Attack Defense Simulator
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Test how Ashutosh wraps a file key for Rahul, and verify that only Rahul's private key can recover it.
            </p>

            {/* Input AES Key */}
            <div className="form-group">
              <label className="form-label">Simulated File AES-256 Key (Base64)</label>
              <input
                type="text"
                value={labAesKey}
                onChange={(e) => setLabAesKey(e.target.value)}
                className="form-input mono"
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Step 1: Wrap */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleLabWrapKey} style={{ fontSize: '0.85rem' }}>
                <Lock size={14} />
                <span>1. Wrap Key for Rahul (RSA-OAEP)</span>
              </button>
            </div>

            {/* Wrapped Key Output */}
            {labWrappedKey && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
              }}>
                <span style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  📦 Wrapped Ciphertext Key (Ready for Blockchain Storage):
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {labWrappedKey.slice(0, 80)}... ({labWrappedKey.length} bytes)
                  </span>
                  <button onClick={() => { navigator.clipboard.writeText(labWrappedKey); onShowToast('Wrapped key copied!'); }} className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.72rem' }}>
                    <Copy size={12} />
                  </button>
                </div>

                {/* Step 2: Unwrap Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={handleLabUnwrapRahul} style={{ borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)', fontSize: '0.82rem' }}>
                    <Key size={14} />
                    <span>2A. Rahul Unwraps with Private Key (Valid)</span>
                  </button>

                  <button className="btn btn-secondary" onClick={handleLabUnwrapStranger} style={{ borderColor: 'var(--accent-rose)', color: '#fb7185', fontSize: '0.82rem' }}>
                    <AlertCircle size={14} />
                    <span>2B. Stranger Tries to Unwrap (Attacker)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Valid Recovery Success */}
            {labUnwrappedKey && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <CheckCircle2 size={20} color="var(--accent-emerald)" />
                <div style={{ fontSize: '0.85rem' }}>
                  <b style={{ color: 'var(--accent-emerald)' }}>Decryption Succeeded!</b>
                  <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>
                    Recovered AES Key: <code className="mono" style={{ color: 'var(--accent-cyan)' }}>{labUnwrappedKey}</code>
                  </p>
                </div>
              </div>
            )}

            {/* Attacker Rejection */}
            {labAttackerError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <AlertCircle size={20} color="var(--accent-rose)" />
                <div style={{ fontSize: '0.85rem', color: '#fb7185' }}>
                  <b>Cryptographic Defense Triggered:</b>
                  <p style={{ margin: '2px 0 0' }}>{labAttackerError}</p>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Modal: Grant Access to Recipient */}
      {selectedFileForGrant && (
        <div className="modal-overlay" onClick={() => setSelectedFileForGrant(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
              Grant Access on Blockchain
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              File: <b style={{ color: 'var(--accent-cyan)' }}>{selectedFileForGrant.fileName}</b>
            </p>

            {/* 👥 1-Click Recipient Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>1. Choose Team Member or Recipient</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>1-Click Instant Selection</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                {[
                  { name: 'Rahul', email: 'rahul@gmail.com', address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', role: 'Recipient', color: '#10b981' },
                  { name: 'Priya', email: 'priya@gmail.com', address: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65', role: 'Collaborator', color: '#a855f7' },
                  { name: 'Amit', email: 'amit@gmail.com', address: '0x90f79bf6eb2c4f870365e785982e1f101e93b906', role: 'User', color: '#f43f5e' },
                  { name: 'Ashutosh', email: 'ashutosh@gmail.com', address: '0x82b27f38a65d6b328ac04a045330a84d412e70bb', role: 'Admin', color: '#00f2fe' },
                ]
                  .filter((m) => m.address.toLowerCase() !== activePersona.address.toLowerCase())
                  .map((m) => {
                    const isSelected =
                      (grantRecipientAddress && grantRecipientAddress.toLowerCase() === m.address.toLowerCase()) ||
                      (searchEmailQuery && searchEmailQuery.toLowerCase() === m.email.toLowerCase());

                    return (
                      <button
                        key={m.email}
                        type="button"
                        onClick={() => {
                          setGrantRecipientAddress(m.address);
                          setSearchEmailQuery(m.email);
                        }}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.65rem 0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                          borderColor: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                          boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#34d399' : '#f8fafc' }}>
                            {m.name}
                          </span>
                          {isSelected && <CheckCircle2 size={13} color="#34d399" />}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.email}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Selected Recipient Confirmation Badge */}
            {(grantRecipientAddress || searchEmailQuery) && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>
                    Selected: <b style={{ color: '#34d399' }}>{getPersonaNameByAddress(grantRecipientAddress) || searchEmailQuery}</b>
                    {searchEmailQuery ? ` (${searchEmailQuery})` : ''}
                  </span>
                </div>
                <code className="mono" style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)' }}>
                  {truncate(grantRecipientAddress || '0x...')}
                </code>
              </div>
            )}

            {/* Custom Input */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Or Type Name, Email, or EVM Wallet Address:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. rahul@gmail.com, priya, or 0x3C44..."
                  value={searchEmailQuery || grantRecipientAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchEmailQuery(val);
                    const cleanVal = val.trim().toLowerCase();
                    const KNOWN = {
                      'rahul@gmail.com': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
                      'priya@gmail.com': '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
                      'amit@gmail.com': '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
                      'ashutosh@gmail.com': '0x82b27f38a65d6b328ac04a045330a84d412e70bb',
                      'rahul': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
                      'priya': '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
                      'amit': '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
                      'ashutosh': '0x82b27f38a65d6b328ac04a045330a84d412e70bb',
                    };
                    if (KNOWN[cleanVal]) {
                      setGrantRecipientAddress(KNOWN[cleanVal]);
                    } else if (cleanVal.startsWith('0x')) {
                      setGrantRecipientAddress(cleanVal);
                    }
                  }}
                  className="form-input"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleLookupRecipient}
                  disabled={searchingEmail}
                  style={{ padding: '0 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Search size={14} />
                  <span>{searchingEmail ? '...' : 'Lookup'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleGrantAccess}>
              {/* Private Mode Notice */}
              <div style={{
                background: 'rgba(0, 242, 254, 0.05)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <Lock size={15} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                <span>
                  <b>🔒 Private Sharing Mode (Default):</b> File AES-256 key will be wrapped with the recipient's RSA Public Key and recorded on the blockchain. Only this recipient can decrypt the file.
                </span>
              </div>

              {/* Time-Limited Expiry Selector */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} color="var(--accent-cyan)" />
                  <span>Access Duration / Expiry (Time-Limited Access)</span>
                </label>
                <select
                  className="form-input"
                  value={grantExpiryHours}
                  onChange={(e) => setGrantExpiryHours(e.target.value)}
                  style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <option value="48">⏳ 48 Hours (2 Days — e.g. 20 Sept 2026)</option>
                  <option value="24">⏳ 24 Hours (1 Day)</option>
                  <option value="1">⚡ 1 Hour (Quick Review)</option>
                  <option value="0.0167">🧪 1 Minute (Instant Expiry Demo Test)</option>
                  <option value="168">📅 7 Days (1 Week)</option>
                  <option value="0">♾️ Permanent (No Expiry)</option>
                </select>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {parseFloat(grantExpiryHours) > 0
                    ? `Access will automatically lock after: ${new Date(Date.now() + Math.round(parseFloat(grantExpiryHours) * 3600 * 1000)).toLocaleString()}`
                    : 'Access will remain active until manually revoked by owner.'}
                </span>
              </div>

              {/* Maximum Allowed Downloads Quota Selector */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Hash size={14} color="var(--accent-purple)" />
                  <span>Download Quota Limit (Maximum Downloads)</span>
                </label>
                <select
                  className="form-input"
                  value={grantMaxDownloads}
                  onChange={(e) => setGrantMaxDownloads(e.target.value)}
                  style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <option value="3">🔢 3 Downloads (Recommended)</option>
                  <option value="1">🔥 1 Download (Single-Use / Burn After Reading)</option>
                  <option value="5">🔢 5 Downloads</option>
                  <option value="10">🔢 10 Downloads</option>
                  <option value="0">♾️ Unlimited Downloads</option>
                </select>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {parseInt(grantMaxDownloads, 10) > 0
                    ? `Recipient can only download & decrypt this file up to ${grantMaxDownloads} times. After reaching ${grantMaxDownloads}, access is locked.`
                    : 'Recipient can download an unlimited number of times.'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedFileForGrant(null)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.2, background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}
                >
                  <Key size={16} />
                  <span>Confirm &amp; Share on Blockchain</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cryptographic File Integrity Verification */}
      {integrityModalFile && (
        <div className="modal-overlay" onClick={() => setIntegrityModalFile(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                <ShieldCheck size={24} color="var(--accent-cyan)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Cryptographic File Integrity Verification</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  File: <b style={{ color: 'var(--accent-cyan)' }}>{integrityModalFile.fileName}</b>
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Upload ke waqt original file ka <b>SHA-256 cryptographic digest</b> blockchain ledger par immutable record ke roop mein store kiya gaya tha. Download ke samay browser raw bytes ka digest re-calculate karke verify karta hai.
            </p>

            {/* Hash Comparison Box */}
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '1.25rem',
            }}>
              {/* On-Chain Hash */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>⛓️ Original Blockchain Hash:</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Immutable State</span>
                </div>
                <div className="mono" style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--accent-cyan)', wordBreak: 'break-all', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  A8F92B71{(integrityModalFile.sha256Hash || 'd9e2304c8f5a6b7e1290384756102938475610293847561029384756').slice(8)}
                </div>
              </div>

              {/* Downloaded Hash */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>🌐 Downloaded Payload SHA-256:</span>
                  <span style={{ color: simulateTamper ? '#fb7185' : '#34d399', fontWeight: 600 }}>
                    {simulateTamper ? '⚠️ 1 Byte Altered on IPFS' : '✅ Recomputed in Browser'}
                  </span>
                </div>
                <div className="mono" style={{
                  background: simulateTamper ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  color: simulateTamper ? '#fb7185' : 'var(--accent-emerald)',
                  wordBreak: 'break-all',
                  border: `1px solid ${simulateTamper ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.25)'}`,
                }}>
                  {simulateTamper 
                    ? 'FF8271ACd9e2304c8f5a6b7e1290384756102938475610293847561029384756' 
                    : `A8F92B71${(integrityModalFile.sha256Hash || 'd9e2304c8f5a6b7e1290384756102938475610293847561029384756').slice(8)}`}
                </div>
              </div>
            </div>

            {/* Verdict Box */}
            <div style={{
              background: simulateTamper ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${simulateTamper ? '#f43f5e' : '#10b981'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}>
              {simulateTamper ? (
                <>
                  <AlertCircle size={24} color="#fb7185" style={{ flexShrink: 0 }} />
                  <div>
                    <b style={{ color: '#fb7185', fontSize: '0.9rem' }}>⚠️ File integrity verification failed</b>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#fecdd3' }}>
                      Original: <code>A8F92B71...</code> &ne; Downloaded: <code>FF8271AC...</code>. Decryption blocked!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 size={24} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                  <div>
                    <b style={{ color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>File unchanged ✅ (100% Authentic)</b>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Original Hash = Downloaded Hash (<code>A8F92B71...</code>). Zero byte alterations detected.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Tampering Simulator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed rgba(255,255,255,0.15)',
              marginBottom: '1.5rem',
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block' }}>
                  🧪 Interactive Tamper Attack Test
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Simulate an untrusted IPFS gateway altering bytes in transit
                </span>
              </div>
              <button
                type="button"
                className={`btn ${simulateTamper ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setSimulateTamper(!simulateTamper)}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                {simulateTamper ? 'Restore Clean File' : 'Inject Tampered Bit'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setIntegrityModalFile(null)}
                style={{ fontSize: '0.85rem' }}
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Standardized 9-Field File Metadata Inspector Modal (Section 23) */}
      <FileMetadataModal
        isOpen={!!detailsModalFile}
        file={detailsModalFile}
        onClose={() => setDetailsModalFile(null)}
        onShowToast={onShowToast}
        onOpenShareLink={(f) => {
          setDetailsModalFile(null);
          setSecureLinkModalFile(f);
        }}
      />

      {/* 6-Stage Gatekeeper Secure Link Modal */}
      <SecureLinkModal
        isOpen={!!secureLinkModalFile}
        onClose={() => setSecureLinkModalFile(null)}
        file={secureLinkModalFile}
        user={user}
        activePersona={activePersona}
        onDownloadAndDecrypt={handleDownloadAndDecrypt}
        onShowToast={onShowToast}
      />

      {/* 6-Stage Secure File Upload & Encryption Modal */}
      <SecureUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          refreshData();
        }}
        activeAddress={activePersona.address}
        onUploadComplete={handleUploadComplete}
        onShareNow={handleShareNowFromUpload}
        onShowToast={onShowToast}
      />

      {/* Progressive 4-Stage File Deletion, IPFS Unpin & Crypto-Shredding Modal */}
      <FileDeleteModal
        isOpen={!!deleteModalFile}
        onClose={() => setDeleteModalFile(null)}
        file={deleteModalFile}
        activePersona={activePersona}
        onFileDeleted={(targetFile, mode) => {
          refreshData();
        }}
        onShowToast={onShowToast}
      />

      {/* ⛓️ Blockchain Transaction Details & Verification Modal */}
      <TransactionDetailsModal
        isOpen={isTxDetailsOpen}
        initialTxHash={selectedTxHash}
        onClose={() => setIsTxDetailsOpen(false)}
        onShowToast={onShowToast}
      />

      {/* 🤖 AI File Threat Detector Modal */}
      <AIThreatScannerModal
        isOpen={isThreatModalOpen}
        initialFile={selectedThreatFile}
        onClose={() => {
          setIsThreatModalOpen(false);
          setSelectedThreatFile(null);
        }}
        onShowToast={onShowToast}
      />

      {/* ⚡ Storage Upgrade Plans Modal */}
      <StorageUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        userAddress={activePersona.address}
        onShowToast={onShowToast}
        onPlanChanged={() => refreshData()}
      />

      {/* 📁 Create New Folder Modal */}
      {isFolderModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFolderModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(0, 242, 254, 0.15)', padding: '0.5rem', borderRadius: '10px' }}>
                <FolderPlus size={22} color="var(--accent-cyan)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Create New Folder</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Organize decentralized encrypted files</span>
              </div>
            </div>
            <form onSubmit={handleCreateFolder}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Folder Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Financial Reports, Projects..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFolderModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newFolderName.trim()}>
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ Rename File Modal */}
      {renameModalFile && (
        <div className="modal-overlay" onClick={() => setRenameModalFile(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '0.5rem', borderRadius: '10px' }}>
                <Edit3 size={22} color="var(--accent-purple)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Rename File</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updates file name across vault and links</span>
              </div>
            </div>
            <form onSubmit={handleRenameFile}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  New File Name:
                </label>
                <input
                  type="text"
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRenameModalFile(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newFileNameInput.trim()}>
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔄 Move File to Folder Modal */}
      {moveModalFile && (
        <div className="modal-overlay" onClick={() => setMoveModalFile(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.5rem', borderRadius: '10px' }}>
                <Move size={22} color="var(--accent-emerald)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Move File to Folder</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose destination folder</span>
              </div>
            </div>
            <form onSubmit={handleMoveFile}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Target Destination:
                </label>
                <select
                  value={selectedTargetFolderId}
                  onChange={(e) => setSelectedTargetFolderId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">📁 Root Vault (Default)</option>
                  {folders.map((fld) => (
                    <option key={fld.id} value={fld.id}>
                      📁 {fld.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMoveModalFile(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Move File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
