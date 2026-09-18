/**
 * Ethers.js & Web3 Smart Contract Service
 * Interacts with FileAccessControl.sol
 */

import { ethers, BrowserProvider, Contract } from 'ethers';
import { notificationService } from './notificationService';

// ABI for FileAccessControl.sol
export const FILE_ACCESS_CONTROL_ABI = [
  "function registerFile(string memory _ipfsHash, string memory _fileName, string memory _fileType, uint256 _fileSize) external",
  "function grantAccess(string memory _ipfsHash, address _recipient) external",
  "function revokeAccess(string memory _ipfsHash, address _recipient) external",
  "function hasAccess(string memory _ipfsHash, address _user) external view returns (bool)",
  "function getFile(string memory _ipfsHash) external view returns (string memory fileName, string memory fileType, uint256 fileSize, address owner, uint256 uploadedAt)",
  "function getAuthorizedRecipients(string memory _ipfsHash) external view returns (address[] memory)",
  "event FileRegistered(string indexed ipfsHash, string fileName, address indexed owner, uint256 timestamp)",
  "event AccessGranted(string indexed ipfsHash, address indexed recipient, address indexed owner, uint256 timestamp)",
  "event AccessRevoked(string indexed ipfsHash, address indexed recipient, address indexed owner, uint256 timestamp)"
];

// In-Memory & LocalStorage Persistent Blockchain State
const STORAGE_KEY_FILES = 'blockshare_chain_files_v4';
const STORAGE_KEY_LOGS = 'blockshare_chain_logs_v2';

export const getPersonaNameByAddress = (address) => {
  if (!address) return 'Unknown';
  const clean = address.toLowerCase();
  if (clean === '0x71c67ed3e80435a55611f476c66337051b7b292a') return 'Ashutosh';
  if (clean === '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc') return 'Rahul';
  if (clean === '0x90f79bf6eb2c4f870365e785982e1f101e93b906') return 'Amit';
  if (clean === '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65') return 'Priya';
  return clean.slice(0, 6) + '...' + clean.slice(-4);
};

const INITIAL_FILES = [
  {
    shareId: '8f72d9e2',
    ipfsHash: 'QmReport78xK29vnemtYgPpHdWEz79ojWnPbdG12345678',
    fileName: 'Report.pdf',
    fileType: 'application/pdf',
    fileSize: 1850000,
    isPublic: false, // Default: Private Sharing (Only Rahul)
    sha256Hash: 'a8f92b71d9e2304c8f5a6b7e1290384756102938475610293847561029384756',
    owner: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', // Rahul
    ownerName: 'Rahul',
    uploadedAt: Date.now() - 3600000 * 5,
    authorizedRecipients: [
      '0x71c67ed3e80435a55611f476c66337051b7b292a', // Ashutosh
    ],
    permissions: {
      '0x71c67ed3e80435a55611f476c66337051b7b292a': {
        isAuthorized: true,
        expiresAt: new Date('2026-09-20T12:00:00Z').getTime(), // 20 Sept
        maxDownloads: 5,
        downloadCount: 1,
      },
    },
  },
  {
    shareId: '3b92f810',
    ipfsHash: 'QmNotes45aB91vnemtYgPpHdWEz79ojWnPbdG87654321',
    fileName: 'Notes.pdf',
    fileType: 'application/pdf',
    fileSize: 940000,
    isPublic: false, // Default: Private Sharing
    sha256Hash: '3b92f8102938475610293847561029384756a8f92b71d9e2304c8f5a6b7e1290',
    owner: '0x90f79bf6eb2c4f870365e785982e1f101e93b906', // Amit
    ownerName: 'Amit',
    uploadedAt: Date.now() - 3600000 * 8,
    authorizedRecipients: [
      '0x71c67ed3e80435a55611f476c66337051b7b292a', // Ashutosh
    ],
    permissions: {
      '0x71c67ed3e80435a55611f476c66337051b7b292a': {
        isAuthorized: true,
        expiresAt: new Date('2026-09-25T12:00:00Z').getTime(), // 25 Sept
        maxDownloads: 3,
        downloadCount: 0,
      },
    },
  },
  {
    shareId: '7c8d9e0f',
    ipfsHash: 'QmProjectZip99xnemtYgPpHdWEz79ojWnPbdG99887766',
    fileName: 'Project.zip',
    fileType: 'application/zip',
    fileSize: 5600000,
    isPublic: false, // Default: Private Sharing
    sha256Hash: '7c8d9e0f2a4b6c8d0e2f4a6b8c0d2ea8f92b71d9e2304c8f5a6b7e1290384756',
    owner: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65', // Priya
    ownerName: 'Priya',
    uploadedAt: Date.now() - 3600000 * 12,
    authorizedRecipients: [
      '0x71c67ed3e80435a55611f476c66337051b7b292a', // Ashutosh
    ],
    permissions: {
      '0x71c67ed3e80435a55611f476c66337051b7b292a': {
        isAuthorized: true,
        expiresAt: new Date('2026-09-30T12:00:00Z').getTime(), // 30 Sept
        maxDownloads: 10,
        downloadCount: 0,
      },
    },
  },
  {
    shareId: 'a8f92b71',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    fileName: 'Project_Alpha_Blueprint.pdf',
    fileType: 'application/pdf',
    fileSize: 2458000,
    isPublic: false, // Default: Private Sharing
    sha256Hash: 'a8f92b71d9e2304c8f5a6b7e1290384756102938475610293847561029384756',
    owner: '0x71c67ed3e80435a55611f476c66337051b7b292a', // Ashutosh
    ownerName: 'Ashutosh',
    uploadedAt: Date.now() - 3600000 * 4,
    authorizedRecipients: [
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', // Rahul
    ],
    permissions: {
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': {
        isAuthorized: true,
        expiresAt: new Date('2026-09-20T12:00:00Z').getTime(),
        maxDownloads: 3,
        downloadCount: 1,
      },
    },
  },
  {
    shareId: '7c3a819b',
    ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    fileName: 'Annual_Financial_Audit_2026.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 1124000,
    isPublic: false, // Default: Private Sharing
    sha256Hash: '7c3a819b5d2f4019a8e72c5b0d4f3e1a6b9c8d7e0f2a4b6c8d0e2f4a6b8c0d2e',
    owner: '0x71c67ed3e80435a55611f476c66337051b7b292a', // Ashutosh
    ownerName: 'Ashutosh',
    uploadedAt: Date.now() - 3600000 * 24,
    authorizedRecipients: [],
  },
];

export const getFileByShareId = (shareId) => {
  if (!shareId) return null;
  const clean = shareId.toLowerCase().trim();
  const files = getStoredFiles();
  return (
    files.find(
      (f) =>
        (f.shareId && f.shareId.toLowerCase() === clean) ||
        f.ipfsHash.toLowerCase().includes(clean) ||
        (f.sha256Hash && f.sha256Hash.toLowerCase().startsWith(clean))
    ) || null
  );
};

const INITIAL_LOGS = [
  {
    txHash: '0x8f2b4c7913e8a4d70183ec9482bca84192bfa71029487cbb9281a4b92138a011',
    blockNumber: 18942150,
    event: 'FileRegistered',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    details: 'Ashutosh uploaded Project_Alpha_Blueprint.pdf (SHA-256 Checksum: a8f92b71...)',
    timestamp: Date.now() - 3600000 * 3,
  },
  {
    txHash: '0x3a7e912f68bc1d459021da637e1b5902847cbb9281a4b92138a0112487cbb928',
    blockNumber: 18942180,
    event: 'AccessGranted',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    details: 'Ashutosh shared Project_Alpha_Blueprint.pdf with Rahul (0x3C44...93BC)',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    txHash: '0x5c8e219fa82bca470183ec9482bca84192bfa71029487cbb9281a4b92138a044',
    blockNumber: 18942220,
    event: 'DownloadRecorded',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    details: 'Rahul accessed and downloaded Project_Alpha_Blueprint.pdf (Decrypted in browser)',
    timestamp: Date.now() - 3600000 * 1,
  },
  {
    txHash: '0x9d4e1f7a82bca84192bfa71029487cbb9281a4b92138a0110183ec9482bca855',
    blockNumber: 18942260,
    event: 'AccessRevoked',
    ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    details: "Ashutosh revoked Rahul's access for file Annual_Financial_Audit_2026.xlsx",
    timestamp: Date.now() - 1800000,
  },
];

export const getStoredFiles = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_FILES);
    const files = data ? JSON.parse(data) : INITIAL_FILES;
    let updated = false;
    files.forEach((f) => {
      if (!f.shareId) {
        f.shareId = f.sha256Hash ? f.sha256Hash.slice(0, 8) : f.ipfsHash.slice(2, 10);
        updated = true;
      }
    });
    if (updated) {
      saveStoredFiles(files);
    }
    return files;
  } catch {
    return INITIAL_FILES;
  }
};

export const saveStoredFiles = (files) => {
  localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
};

export const getStoredLogs = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_LOGS);
    return data ? JSON.parse(data) : INITIAL_LOGS;
  } catch {
    return INITIAL_LOGS;
  }
};

export const saveStoredLogs = (logs) => {
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
};

const generateMockTxHash = () => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

// Contract Methods Wrapper
export const contractService = {
  // 1. Register File on Blockchain
  async registerFile(ipfsHash, fileName, fileType, fileSize, currentAddress, sha256Hash = '') {
    const cleanAddress = (currentAddress || '0x71c67ed3e80435a55611f476c66337051b7b292a').toLowerCase();
    const files = getStoredFiles();

    if (files.some((f) => f.ipfsHash === ipfsHash)) {
      throw new Error('This IPFS CID is already registered on the blockchain.');
    }

    const shareId = sha256Hash ? sha256Hash.slice(0, 8) : ipfsHash.slice(2, 10);

    const newRecord = {
      shareId,
      ipfsHash,
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize: fileSize || 1024 * 1024,
      isPublic: false, // Default: Private Sharing (Only specified recipient)
      sha256Hash: sha256Hash || 'a8f92b71d9e2304c8f5a6b7e1290384756102938475610293847561029384756',
      owner: cleanAddress,
      uploadedAt: Date.now(),
      authorizedRecipients: [],
    };

    files.unshift(newRecord);
    saveStoredFiles(files);

    const tx = {
      txHash: generateMockTxHash(),
      blockNumber: Math.floor(18942160 + Math.random() * 500),
      event: 'FileRegistered',
      ipfsHash,
      details: `File "${fileName}" registered in PRIVATE mode (Default) by Owner (${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)})`,
      timestamp: Date.now(),
    };

    const logs = getStoredLogs();
    logs.unshift(tx);
    saveStoredLogs(logs);

    return { success: true, file: newRecord, tx };
  },

  // 1b. Toggle Private (default) vs Public sharing mode
  async setPublicAccess(ipfsHash, isPublic, currentAddress) {
    const cleanAddress = (currentAddress || '').toLowerCase();
    const files = getStoredFiles();
    const targetFile = files.find(
      (f) => f.ipfsHash === ipfsHash || (f.shareId && f.shareId.toLowerCase() === ipfsHash.toLowerCase())
    );

    if (!targetFile) {
      throw new Error('File not found on blockchain');
    }

    if (targetFile.owner.toLowerCase() !== cleanAddress) {
      throw new Error('Access Denied: Only the file owner can change sharing mode.');
    }

    targetFile.isPublic = !!isPublic;
    saveStoredFiles(files);

    // Also sync to backend server if online
    try {
      await fetch(`/api/files/share-mode/${targetFile.ipfsHash}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: targetFile.isPublic, ownerAddress: cleanAddress }),
      });
    } catch (e) {
      console.log('Server share-mode sync notice:', e);
    }

    const modeName = targetFile.isPublic ? 'PUBLIC 🌐 (Anyone with link)' : 'PRIVATE 🔒 (Selected recipient only - Default)';
    const tx = {
      txHash: generateMockTxHash(),
      blockNumber: Math.floor(18942350 + Math.random() * 500),
      event: 'PublicAccessToggled',
      ipfsHash: targetFile.ipfsHash,
      details: `Owner (${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}) switched "${targetFile.fileName}" to ${modeName}`,
      timestamp: Date.now(),
    };

    const logs = getStoredLogs();
    logs.unshift(tx);
    saveStoredLogs(logs);

    return { success: true, file: targetFile, tx, isPublic: targetFile.isPublic, mode: targetFile.isPublic ? 'Public' : 'Private' };
  },

  // 2. Grant Access to Recipient (with wrapped AES key, optional expiry & max download quota)
  async grantAccess(ipfsHash, recipientAddress, currentAddress, wrappedKey = null, expiresAt = 0, maxDownloads = 0) {
    const cleanAddress = (currentAddress || '').toLowerCase();
    const cleanRecipient = (recipientAddress || '').toLowerCase();

    if (!cleanRecipient.startsWith('0x') || cleanRecipient.length !== 42) {
      throw new Error('Invalid Ethereum recipient address (must be 42 characters starting with 0x)');
    }

    const files = getStoredFiles();
    const targetFile = files.find((f) => f.ipfsHash === ipfsHash);

    if (!targetFile) {
      throw new Error('File not found on blockchain');
    }

    // Owner check
    if (targetFile.owner.toLowerCase() !== cleanAddress) {
      throw new Error(`Access Denied: Only file owner (${targetFile.owner.slice(0, 6)}...) can grant access. You are ${cleanAddress.slice(0, 6)}...`);
    }

    if (!targetFile.authorizedRecipients.includes(cleanRecipient)) {
      targetFile.authorizedRecipients.push(cleanRecipient);
    }

    // Permissions with expiry & max download quota tracking
    if (!targetFile.permissions) targetFile.permissions = {};
    targetFile.permissions[cleanRecipient] = {
      isAuthorized: true,
      expiresAt: expiresAt || 0, // 0 = permanent, otherwise epoch ms
      maxDownloads: maxDownloads || 0, // 0 = unlimited, e.g. 3
      downloadCount: 0,
    };

    // Save Wrapped Key in on-chain metadata mapping
    if (!targetFile.wrappedKeys) targetFile.wrappedKeys = {};
    if (wrappedKey) {
      targetFile.wrappedKeys[cleanRecipient] = wrappedKey;
    }

    saveStoredFiles(files);

    const expiryDesc = expiresAt > 0 
      ? ` (Expires: ${new Date(expiresAt).toLocaleDateString()} ${new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
      : ' (Permanent)';
    const quotaDesc = maxDownloads > 0 ? ` [Max Downloads: ${maxDownloads}]` : ' [Unlimited Downloads]';

    const tx = {
      txHash: generateMockTxHash(),
      blockNumber: Math.floor(18942200 + Math.random() * 500),
      event: 'AccessGranted',
      ipfsHash,
      details: `Access GRANTED to ${cleanRecipient.slice(0, 6)}...${cleanRecipient.slice(-4)}${expiryDesc}${quotaDesc}`,
      timestamp: Date.now(),
    };

    const logs = getStoredLogs();
    logs.unshift(tx);
    saveStoredLogs(logs);

    // 🔔 Real-time notification trigger: "Rahul shared a file with you"
    const senderName = getPersonaNameByAddress(cleanAddress);
    notificationService.notifyFileShared(senderName, targetFile.fileName);

    // If expiry was set, also schedule/register expiry reminder notification
    if (expiresAt > 0) {
      notificationService.notifyAccessExpiring(targetFile.fileName, 'tomorrow');
    }

    return { success: true, file: targetFile, tx };
  },

  getWrappedKey(ipfsHash, recipientAddress) {
    const files = getStoredFiles();
    const targetFile = files.find((f) => f.ipfsHash === ipfsHash);
    if (!targetFile || !targetFile.wrappedKeys) return null;
    return targetFile.wrappedKeys[recipientAddress.toLowerCase()] || null;
  },

  // Record a successful download on-chain and increment download count
  async recordDownload(ipfsHash, userAddress) {
    if (!userAddress) return;
    const clean = userAddress.toLowerCase();
    const files = getStoredFiles();
    const targetFile = files.find((f) => f.ipfsHash === ipfsHash);
    if (!targetFile) return;

    if (targetFile.owner.toLowerCase() === clean) {
      return; // Owner is exempt from download quotas
    }

    if (targetFile.permissions && targetFile.permissions[clean]) {
      const current = targetFile.permissions[clean].downloadCount || 0;
      targetFile.permissions[clean].downloadCount = current + 1;
      saveStoredFiles(files);

      const max = targetFile.permissions[clean].maxDownloads;
      const tx = {
        txHash: generateMockTxHash(),
        blockNumber: Math.floor(18942400 + Math.random() * 500),
        event: 'DownloadRecorded',
        ipfsHash,
        details: `Download #${current + 1} recorded on-chain for ${clean.slice(0, 6)}...${clean.slice(-4)}${max > 0 ? ` (Quota: ${current + 1}/${max})` : ''}`,
        timestamp: Date.now(),
      };

      const logs = getStoredLogs();
      logs.unshift(tx);
      saveStoredLogs(logs);

      // 🔔 Real-time notification trigger: "Your file was downloaded."
      const downloaderName = getPersonaNameByAddress(clean);
      notificationService.notifyFileDownloaded(downloaderName, targetFile.fileName);
    }
  },

  // 3. Revoke Access from Recipient
  async revokeAccess(ipfsHash, recipientAddress, currentAddress) {
    const cleanAddress = (currentAddress || '').toLowerCase();
    const cleanRecipient = (recipientAddress || '').toLowerCase();

    const files = getStoredFiles();
    const targetFile = files.find((f) => f.ipfsHash === ipfsHash);

    if (!targetFile) {
      throw new Error('File not found on blockchain');
    }

    if (targetFile.owner.toLowerCase() !== cleanAddress) {
      throw new Error(`Access Denied: Only file owner can revoke access.`);
    }

    targetFile.authorizedRecipients = targetFile.authorizedRecipients.filter(
      (r) => r.toLowerCase() !== cleanRecipient
    );

    if (targetFile.permissions && targetFile.permissions[cleanRecipient]) {
      targetFile.permissions[cleanRecipient].isAuthorized = false;
    }

    if (targetFile.wrappedKeys) {
      delete targetFile.wrappedKeys[cleanRecipient];
    }

    saveStoredFiles(files);

    const tx = {
      txHash: generateMockTxHash(),
      blockNumber: Math.floor(18942300 + Math.random() * 500),
      event: 'AccessRevoked',
      ipfsHash,
      details: `Access REVOKED from ${cleanRecipient.slice(0, 6)}...${cleanRecipient.slice(-4)} for file "${targetFile.fileName}"`,
      timestamp: Date.now(),
    };

    const logs = getStoredLogs();
    logs.unshift(tx);
    saveStoredLogs(logs);

    // 🔔 Real-time notification trigger: "Access to Project.pdf was revoked."
    notificationService.notifyAccessRevoked(targetFile.fileName, getPersonaNameByAddress(cleanAddress));

    return { success: true, file: targetFile, tx };
  },

  // 4. Verify Access Permission on Blockchain (with Time-Limited Expiry & Max Download Quota check)
  hasAccess(ipfsHash, userAddress) {
    if (!userAddress) return { hasAccess: false, reason: 'No wallet address provided' };
    const clean = userAddress.toLowerCase();
    const files = getStoredFiles();
    const file = files.find((f) => f.ipfsHash === ipfsHash || (f.shareId && f.shareId.toLowerCase() === ipfsHash.toLowerCase()));

    if (!file) {
      return { hasAccess: false, reason: 'File does not exist on blockchain' };
    }

    // Check if access was revoked / keys crypto-shredded
    if (file.status === 'crypto_shredded' || file.isCryptoShredded) {
      return {
        hasAccess: false,
        role: 'CryptoShredded',
        reason: '🔐 Access Removed: File decryption keys were cryptographically shredded by owner.',
      };
    }

    if (file.owner.toLowerCase() === clean) {
      return { hasAccess: true, role: 'Owner', mode: file.isPublic ? 'Public' : 'Private', reason: 'You are the file creator & owner' };
    }

    // Public Sharing Mode: Owner intentionally opened access to anyone with link
    if (file.isPublic === true) {
      return {
        hasAccess: true,
        role: 'Public Access',
        mode: 'Public',
        reason: '🌐 Public Access Enabled by Owner (Anyone with link permitted)',
      };
    }

    const isAuthorized = file.authorizedRecipients.some((r) => r.toLowerCase() === clean);
    const perm = file.permissions && file.permissions[clean];

    if (isAuthorized && (!perm || perm.isAuthorized !== false)) {
      // Check block timestamp / expiry
      if (perm && perm.expiresAt && perm.expiresAt > 0) {
        if (Date.now() > perm.expiresAt) {
          return {
            hasAccess: false,
            role: 'Expired',
            mode: 'Private',
            expiresAt: perm.expiresAt,
            reason: `⏰ Access Expired on ${new Date(perm.expiresAt).toLocaleString()}`,
          };
        }
      }

      // Check max download quota
      if (perm && perm.maxDownloads > 0) {
        const count = perm.downloadCount || 0;
        if (count >= perm.maxDownloads) {
          return {
            hasAccess: false,
            role: 'QuotaReached',
            mode: 'Private',
            downloadCount: count,
            maxDownloads: perm.maxDownloads,
            reason: `🔢 Download limit reached (${count}/${perm.maxDownloads} downloads exhausted)`,
          };
        }
      }

      const quotaNotice = perm?.maxDownloads > 0 
        ? ` (Quota: ${perm.downloadCount || 0}/${perm.maxDownloads})`
        : '';

      return {
        hasAccess: true,
        role: 'Authorized Recipient',
        mode: 'Private',
        expiresAt: perm?.expiresAt || 0,
        maxDownloads: perm?.maxDownloads || 0,
        downloadCount: perm?.downloadCount || 0,
        reason: perm?.expiresAt 
          ? `Valid until ${new Date(perm.expiresAt).toLocaleString()}${quotaNotice}`
          : `Smart contract private permission active${quotaNotice}`,
      };
    }

    return {
      hasAccess: false,
      role: 'Unauthorized',
      mode: 'Private',
      reason: 'File is in PRIVATE mode (Default). Your wallet address is not on the smart contract authorized list.',
    };
  },

  // 5. Crypto-Shred File (Destroy Decryption Keys & Revoke On-Chain Access)
  // Decentralized Storage Distinction:
  // Application Access Removed != All copies physically destroyed.
  // In IPFS, foreign nodes that cached the CID cannot be remotely wiped.
  // Crypto-shredding destroys the AES-256 key, rendering any residual ciphertext permanently indecipherable.
  async cryptoShredFile(ipfsHash, ownerAddress) {
    const files = getStoredFiles();
    const targetFile = files.find((f) => f.ipfsHash === ipfsHash || (f.shareId && f.shareId.toLowerCase() === ipfsHash.toLowerCase()));
    if (!targetFile) {
      throw new Error('File not found in registry');
    }

    // 1. Physically destroy cryptographic encryption keys
    targetFile.encryptionKey = null;
    targetFile.status = 'crypto_shredded';
    targetFile.isCryptoShredded = true;
    targetFile.permissions = {};
    targetFile.authorizedRecipients = [];

    // 2. Also wipe wrapped keys from envelope storage
    const wrappedStoreKey = `blockshare_wrapped_keys_${targetFile.ipfsHash}`;
    localStorage.removeItem(wrappedStoreKey);

    saveStoredFiles(files);

    // 3. Notify backend server
    try {
      await fetch(`/api/files/crypto-shred/${targetFile.ipfsHash}`, { method: 'POST' });
    } catch (e) {
      console.log('Backend crypto-shred sync note:', e);
    }

    // 4. Record Immutable Audit Log on Blockchain Ledger
    const tx = {
      txHash: '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
      blockNumber: 18942300 + Math.floor(Math.random() * 50),
      event: 'FileAccessRemoved',
      ipfsHash: targetFile.ipfsHash,
      details: `Owner (${ownerAddress ? ownerAddress.slice(0, 6) + '...' + ownerAddress.slice(-4) : 'Owner'}) CRYPTO-SHREDDED keys for "${targetFile.fileName}". On-chain access permanently revoked.`,
      timestamp: Date.now(),
      cryptoShredded: true,
    };
    const logs = getStoredLogs();
    logs.unshift(tx);
    saveStoredLogs(logs);

    return {
      success: true,
      fileName: targetFile.fileName,
      ipfsHash: targetFile.ipfsHash,
      tx,
      decentralizedDistinction: {
        applicationAccessRemoved: true,
        keysDestroyed: true,
        externalCopiesNotice:
          'Application access revoked and cryptographic keys destroyed. While external IPFS peers may still cache raw ciphertext blocks, the content is mathematically unrecoverable ($2^256$ entropy).',
      },
    };
  },

  // 5b. Delete / Unregister File from local/on-chain registry & Unpin from IPFS
  async deleteFile(ipfsHash, ownerAddress, options = { unpinLocal: true, cryptoShred: true }) {
    const files = getStoredFiles();
    const targetFile = files.find((f) => f.ipfsHash === ipfsHash || (f.shareId && f.shareId.toLowerCase() === ipfsHash.toLowerCase()));
    if (!targetFile) {
      throw new Error('File not found in registry');
    }

    // Unpin from local IPFS storage if requested
    if (options.unpinLocal) {
      try {
        await fetch(`/api/files/ipfs-unpin/${targetFile.ipfsHash}`, { method: 'DELETE' });
      } catch (e) {
        console.log('Local IPFS unpin note:', e);
      }
    }

    // Also notify server crypto-shred
    try {
      await fetch(`/api/files/crypto-shred/${targetFile.ipfsHash}`, { method: 'POST' });
    } catch (e) {}

    // Wipe wrapped keys from local storage
    const wrappedStoreKey = `blockshare_wrapped_keys_${targetFile.ipfsHash}`;
    localStorage.removeItem(wrappedStoreKey);

    const updatedFiles = files.filter((f) => f.ipfsHash !== targetFile.ipfsHash);
    saveStoredFiles(updatedFiles);

    // Record Unregister/Delete log on ledger
    const tx = {
      txHash: '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
      blockNumber: 18942300 + Math.floor(Math.random() * 50),
      event: 'FileAccessRemoved',
      ipfsHash: targetFile.ipfsHash,
      details: `${ownerAddress ? (ownerAddress.slice(0, 6) + '...' + ownerAddress.slice(-4)) : 'Owner'} unlinked "${targetFile.fileName}" from registry and unpinned local node copy.`,
      timestamp: Date.now(),
      cryptoShredded: true,
    };
    const logs = getStoredLogs();
    logs.unshift(tx);
    saveStoredLogs(logs);

    return {
      success: true,
      fileName: targetFile.fileName,
      ipfsHash: targetFile.ipfsHash,
      tx,
      decentralizedDistinction: {
        applicationAccessRemoved: true,
        localPinRemoved: true,
        keysDestroyed: true,
        externalCopiesNotice:
          'Local gateway pin removed and keys destroyed. External distributed IPFS copies are rendered permanently undecryptable.',
      },
    };
  },

  // 6. Multi-Barrier Verification Pipeline for Secure Sharing Links
  // Pipeline: Link -> Login -> Wallet/User verification -> Blockchain permission check -> Expiry check -> Download limit check -> Allow/Deny
  verifyShareLinkAccess(shareId, user, callerAddress, simulationOverrides = null) {
    // Stage 1: Link Resolution
    const file = getFileByShareId(shareId);
    const stage1Passed = !!file;

    // Check if file access was removed via crypto-shredding
    if (file && (file.status === 'crypto_shredded' || file.isCryptoShredded)) {
      const stageShredded = {
        id: 'link',
        number: 1,
        name: '1. Link Resolution (Access Removed)',
        shortName: 'CryptoShredded',
        desc: 'Validates on-chain existence and cryptographic key availability',
        passed: false,
        detail: 'Access Removed: File encryption keys were cryptographically shredded by owner.',
        errorMsg: 'This file access has been permanently revoked by the owner and the decryption key has been shredded.',
      };
      return {
        stages: [
          stageShredded,
          { id: 'login', number: 2, name: '2. Login Authentication', shortName: 'Login', passed: false, detail: 'Blocked at Stage 1' },
          { id: 'wallet', number: 3, name: '3. Wallet Verification', shortName: 'Wallet', passed: false, detail: 'Blocked at Stage 1' },
          { id: 'blockchain', number: 4, name: '4. Blockchain Permission', shortName: 'Blockchain', passed: false, detail: 'Blocked at Stage 1' },
          { id: 'expiry', number: 5, name: '5. Expiry Check', shortName: 'Expiry', passed: false, detail: 'Blocked at Stage 1' },
          { id: 'download_limit', number: 6, name: '6. Download Limit', shortName: 'Quota', passed: false, detail: 'Blocked at Stage 1' },
        ],
        isAllowed: false,
        verdict: 'DENY',
        failedStage: stageShredded,
        remediation: 'This file was deleted by the owner. Note: While raw ciphertext blocks may linger on decentralized IPFS nodes, the data is mathematically unrecoverable without the shredded keys.',
        file,
      };
    }

    const stage1 = {
      id: 'link',
      number: 1,
      name: '1. Link Resolution',
      shortName: 'Link',
      desc: `Resolves token (${shareId || 'none'}) to registered on-chain file metadata`,
      passed: stage1Passed,
      detail: stage1Passed
        ? `Valid file: "${file.fileName}" (CID: ${file.ipfsHash.slice(0, 8)}...)`
        : `Token "${shareId}" not found on blockchain or IPFS storage`,
      errorMsg: 'Invalid or non-existent share link token.',
    };

    if (!stage1Passed) {
      return {
        stages: [
          stage1,
          { id: 'login', number: 2, name: '2. Login Authentication', shortName: 'Login', passed: false, detail: 'Blocked at Stage 1' },
          { id: 'wallet', number: 3, name: '3. Wallet Verification', shortName: 'Wallet', passed: false, detail: 'Blocked at Stage 1' },
          { id: 'blockchain', number: 4, name: '4. Blockchain Permission', shortName: 'Blockchain', passed: false, detail: 'Blocked at Stage 1' },
          { id: 'expiry', number: 5, name: '5. Expiry Check', shortName: 'Expiry', passed: false, detail: 'Blocked at Stage 1' },
          { id: 'download_limit', number: 6, name: '6. Download Limit', shortName: 'Quota', passed: false, detail: 'Blocked at Stage 1' },
        ],
        isAllowed: false,
        verdict: 'DENY',
        failedStage: stage1,
        remediation: 'Check if the link was copied correctly or ask the owner for a fresh link.',
        file: null,
      };
    }

    // Apply simulation overrides if testing
    let effectiveUser = simulationOverrides?.loggedOut ? null : user;
    let effectiveWallet = simulationOverrides?.walletAddress !== undefined 
      ? simulationOverrides.walletAddress 
      : callerAddress;

    // Stage 2: Login Check
    const isUserLoggedIn = !!(effectiveUser && (effectiveUser.email || effectiveUser.name || effectiveUser.id));
    const stage2 = {
      id: 'login',
      number: 2,
      name: '2. Login Authentication',
      shortName: 'Login',
      desc: 'Checks active BlockShare session and user identity',
      passed: isUserLoggedIn,
      detail: isUserLoggedIn
        ? `Authenticated as: ${effectiveUser.name || effectiveUser.email}`
        : 'Access Blocked: User is not logged into a BlockShare account',
      errorMsg: 'You must log in to an authorized account to access this secure link.',
    };

    // Stage 3: Wallet/User Verification
    const hasWallet = !!(effectiveWallet && effectiveWallet.startsWith('0x'));
    const stage3 = {
      id: 'wallet',
      number: 3,
      name: '3. Wallet/User Verification',
      shortName: 'Wallet',
      desc: 'Verifies active Web3 cryptographic keypair identity',
      passed: stage2.passed && hasWallet,
      detail: hasWallet
        ? `Cryptographic Wallet: ${effectiveWallet.slice(0, 6)}...${effectiveWallet.slice(-4)} (${getPersonaNameByAddress(effectiveWallet)})`
        : 'Access Blocked: No Web3 wallet connected',
      errorMsg: 'Please connect MetaMask or select a Web3 persona wallet.',
    };

    // Stage 4: Blockchain Permission Check
    const cleanAddress = (effectiveWallet || '').toLowerCase();
    const isOwner = file.owner.toLowerCase() === cleanAddress;
    const isRecipient = file.authorizedRecipients.some((r) => r.toLowerCase() === cleanAddress);
    
    // Check permission record in smart contract state
    let perm = (file.permissions && file.permissions[cleanAddress]) || null;
    if (simulationOverrides?.overridePermissions) {
      perm = simulationOverrides.overridePermissions;
    }

    // Check if file is Public vs Private (Default)
    const isPublic = simulationOverrides?.isPublic !== undefined 
      ? simulationOverrides.isPublic 
      : file.isPublic === true;

    const hasPermission = isOwner || isRecipient || (perm && perm.isAuthorized) || isPublic;
    const stage4 = {
      id: 'blockchain',
      number: 4,
      name: '4. Blockchain Permission Check',
      shortName: 'Blockchain',
      desc: isPublic
        ? 'Public Sharing Mode: Smart contract allows open link access'
        : 'Private Sharing Mode (Default): Queries smart contract for recipient wallet',
      passed: stage3.passed && !!hasPermission,
      detail: hasPermission
        ? (isOwner 
            ? '👑 Verified as File Owner (Full Access)' 
            : isPublic 
            ? '🌐 Verified: Owner enabled Public Link Access' 
            : '🟢 Verified on Smart Contract Access List')
        : `Access Blocked: File is in PRIVATE mode (Default). Wallet ${cleanAddress ? cleanAddress.slice(0, 6) + '...' + cleanAddress.slice(-4) : ''} is not on the smart contract authorized list.`,
      errorMsg: isPublic
        ? 'Public access error on blockchain.'
        : 'This file is in Private mode (Default). Only designated recipient wallets can access it.',
    };

    // Stage 5: Expiry Check (block.timestamp <= expiry)
    let isExpired = false;
    let expiryDetail = 'No expiration set (Permanent)';
    if (!isOwner && perm && perm.expiresAt && perm.expiresAt > 0) {
      const expiryDate = new Date(perm.expiresAt);
      if (Date.now() > perm.expiresAt) {
        isExpired = true;
        expiryDetail = `Expired on ${expiryDate.toLocaleDateString()} at ${expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        expiryDetail = `Valid until ${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }

    const stage5 = {
      id: 'expiry',
      number: 5,
      name: '5. Expiry Check (block.timestamp <= expiry)',
      shortName: 'Expiry',
      desc: 'Validates time-limited validity on ledger',
      passed: stage4.passed && !isExpired,
      detail: isExpired
        ? `Access Blocked: ${expiryDetail}`
        : `Active: ${expiryDetail}`,
      errorMsg: 'The time window granted for this secure link has expired.',
    };

    // Stage 6: Download Limit Check (downloadCount < maxDownloads)
    let isQuotaExhausted = false;
    let quotaDetail = 'Unlimited downloads';
    if (!isOwner && perm && perm.maxDownloads && perm.maxDownloads > 0) {
      const currentCount = perm.downloadCount || 0;
      if (currentCount >= perm.maxDownloads) {
        isQuotaExhausted = true;
        quotaDetail = `Quota exhausted (${currentCount}/${perm.maxDownloads} downloads used)`;
      } else {
        quotaDetail = `${currentCount}/${perm.maxDownloads} downloads used (${perm.maxDownloads - currentCount} remaining)`;
      }
    }

    const stage6 = {
      id: 'download_limit',
      number: 6,
      name: '6. Download Limit Check (count < max)',
      shortName: 'Quota',
      desc: 'Verifies download quota recorded on blockchain',
      passed: stage5.passed && !isQuotaExhausted,
      detail: isQuotaExhausted
        ? `Access Blocked: ${quotaDetail}`
        : `Quota Status: ${quotaDetail}`,
      errorMsg: 'The maximum download quota for your wallet has been reached.',
    };

    const isAllowed = stage1.passed && stage2.passed && stage3.passed && stage4.passed && stage5.passed && stage6.passed;
    const stages = [stage1, stage2, stage3, stage4, stage5, stage6];
    const failedStage = stages.find((s) => !s.passed) || null;

    let remediation = '';
    if (failedStage) {
      if (failedStage.id === 'login') remediation = 'Please log in to your BlockShare account using the login button above.';
      else if (failedStage.id === 'wallet') remediation = 'Connect your MetaMask wallet or select an authorized Web3 persona identity.';
      else if (failedStage.id === 'blockchain') {
        remediation = isPublic
          ? 'Error verifying public permissions on ledger.'
          : 'This file is in PRIVATE mode (Default). Ask the owner to grant access to your wallet address or switch to Public mode.';
      }
      else if (failedStage.id === 'expiry') remediation = 'Ask the file owner to extend the expiry timestamp on the smart contract.';
      else if (failedStage.id === 'download_limit') remediation = 'Ask the file owner to increase your download quota on the blockchain.';
    }

    return {
      stages,
      isAllowed,
      verdict: isAllowed ? 'ALLOW' : 'DENY',
      failedStage,
      remediation,
      file,
      isOwner,
      isPublic,
      mode: isPublic ? 'Public' : 'Private',
      perm,
    };
  },

  // 9. Standardized 9-Field File Metadata Extractor
  getFileMetadata(identifier) {
    if (!identifier) return null;
    const clean = identifier.toLowerCase().trim();
    const files = getStoredFiles();
    const file = files.find(
      (f) =>
        (f.shareId && f.shareId.toLowerCase() === clean) ||
        f.ipfsHash.toLowerCase() === clean ||
        f.ipfsHash.toLowerCase().includes(clean) ||
        (f.fileName && f.fileName.toLowerCase() === clean) ||
        (f.sha256Hash && f.sha256Hash.toLowerCase().startsWith(clean))
    );
    if (!file) return null;

    const bytes = Number(file.fileSize || 0);
    let formattedSize = '0 B';
    if (bytes >= 1024 * 1024) formattedSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    else if (bytes >= 1024) formattedSize = `${(bytes / 1024).toFixed(1)} KB`;
    else formattedSize = `${bytes} B`;

    let fileType = 'DOC';
    const ext = (file.fileName || '').lastIndexOf('.') !== -1 ? file.fileName.slice(file.fileName.lastIndexOf('.')).toUpperCase().replace('.', '') : '';
    if (ext) fileType = ext;
    else if (file.fileType) fileType = file.fileType.split('/')[1]?.toUpperCase() || 'FILE';

    const ownerAddress = file.owner || '0x71c67ed3e80435a55611f476c66337051b7b292a';
    const ownerShort = `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`;

    const ipfsCid = file.ipfsHash || 'Qm...';
    const cidShort = ipfsCid.length > 16 ? `${ipfsCid.slice(0, 10)}...${ipfsCid.slice(-6)}` : ipfsCid;

    const fullHash = file.sha256Hash || file.sha256 || '93fa102938475610293847561029384756102938475610293847561029384756';
    const hashShort = `${fullHash.slice(0, 8)}...${fullHash.slice(-6)}`.toUpperCase();

    const uploadDate = new Date(file.uploadedAt || Date.now()).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let expiryDisplay = 'Permanent (No Expiry)';
    let isExpired = false;
    if (file.permissions) {
      const firstPerm = Object.values(file.permissions)[0];
      if (firstPerm && firstPerm.expiresAt) {
        isExpired = Date.now() > firstPerm.expiresAt;
        expiryDisplay = new Date(firstPerm.expiresAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    }

    let accessStatus = 'Active';
    if (file.status === 'crypto_shredded') accessStatus = 'Access Revoked (Crypto-Shredded)';
    else if (isExpired) accessStatus = 'Expired';
    else if (file.isPublic) accessStatus = 'Active (Public)';
    else accessStatus = 'Active (Private - Default)';

    const formattedSummary = `Name: ${file.fileName}
Size: ${formattedSize}
Type: ${fileType}
Owner: ${ownerShort} (${file.ownerName || getPersonaNameByAddress(ownerAddress)})
CID: ${cidShort}
Hash: ${hashShort}
Uploaded: ${uploadDate}
Expiry: ${expiryDisplay}
Status: ${accessStatus}`;

    return {
      fileName: file.fileName,
      fileSize: formattedSize,
      fileSizeBytes: bytes,
      fileType,
      owner: ownerShort,
      ownerFull: ownerAddress,
      ownerName: file.ownerName || getPersonaNameByAddress(ownerAddress),
      ipfsCid,
      ipfsCidShort: cidShort,
      sha256Hash: fullHash,
      sha256Short: hashShort,
      uploadDate,
      uploadTimestamp: file.uploadedAt || Date.now(),
      expiry: expiryDisplay,
      isExpired,
      accessStatus,
      status: file.status || 'active',
      isPublic: !!file.isPublic,
      formattedSummary,
      file,
    };
  },
};

