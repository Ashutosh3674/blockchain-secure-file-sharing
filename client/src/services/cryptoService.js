/**
 * Client-Side Web Cryptography API Service
 * Implements zero-knowledge AES-GCM 256-bit file encryption & decryption
 */

// Helper: Convert ArrayBuffer to Hex String
export const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

// Helper: Convert ArrayBuffer to Base64
export const bufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper: Convert Base64 to ArrayBuffer
export const base64ToBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const cryptoService = {
  /**
   * 1. Generate a cryptographically secure 256-bit AES-GCM key
   */
  async generateAESKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Export CryptoKey to readable Base64 string
   */
  async exportKey(key) {
    const raw = await window.crypto.subtle.exportKey('raw', key);
    return bufferToBase64(raw);
  },

  /**
   * Import Base64 string back into a CryptoKey
   */
  async importKey(base64Key) {
    const rawBuffer = base64ToBuffer(base64Key);
    return await window.crypto.subtle.importKey(
      'raw',
      rawBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Calculate SHA-256 checksum digest of an ArrayBuffer
   */
  async calculateSHA256(buffer) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    return bufferToHex(hashBuffer);
  },

  /**
   * 2. Encrypt file using AES-GCM (256-bit) with a randomized 12-byte IV
   * @param {File} file Original plaintext file
   * @param {CryptoKey} [providedKey] Optional existing key or generates new one
   */
  async encryptFile(file, providedKey = null) {
    const key = providedKey || (await this.generateAESKey());
    const rawKeyString = await this.exportKey(key);

    // Read file bytes as ArrayBuffer
    const plaintextBuffer = await file.arrayBuffer();

    // Generate random 12-byte (96-bit) IV recommended for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Execute Client-Side Encryption
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      plaintextBuffer
    );

    // Calculate SHA-256 integrity hash of the ciphertext
    const ciphertextSha256 = await this.calculateSHA256(ciphertextBuffer);

    return {
      ciphertextBuffer,
      iv: Array.from(iv), // 12 numbers array for easy serialization
      keyString: rawKeyString,
      sha256Hash: ciphertextSha256,
      originalName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      encryptedSize: ciphertextBuffer.byteLength,
    };
  },

  /**
   * 3. Decrypt ciphertext back to original plaintext and initiate browser download
   */
  async decryptFile(ciphertextBuffer, ivArray, keyString, originalName, mimeType) {
    const key = await this.importKey(keyString);
    const iv = new Uint8Array(ivArray);

    const plaintextBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertextBuffer
    );

    // Create a downloadable Blob
    const blob = new Blob([plaintextBuffer], { type: mimeType || 'application/octet-stream' });
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = originalName || 'decrypted_file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, size: plaintextBuffer.byteLength };
  },
};
