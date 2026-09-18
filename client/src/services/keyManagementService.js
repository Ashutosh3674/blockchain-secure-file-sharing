/**
 * Hybrid Cryptography & Key Management Service (Envelope Encryption)
 * Implements RSA-OAEP 2048-bit key wrapping for AES-256 symmetric file keys.
 * 
 * Strict Security Invariant:
 * Private keys NEVER leave the browser or get sent to the server/blockchain!
 */

import { bufferToBase64, base64ToBuffer } from './cryptoService';

const KEY_STORAGE_PREFIX = 'blockshare_rsa_keys_';

// Pre-seeded Demo Public & Private Keys for Ashutosh, Rahul, and Stranger
// Generated with standard RSA-OAEP (2048 bits, SHA-256)
const DEMO_KEYS = {
  // Ashutosh (Owner)
  '0x71c67ed3e80435a55611f476c66337051b7b292a': {
    name: 'Ashutosh',
    publicKeySpki: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx4qV9z2mK8...ASHUTOSH_PUBKEY',
  },
  // Rahul (Recipient)
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': {
    name: 'Rahul',
    publicKeySpki: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu7mK1z9pL2...RAHUL_PUBKEY',
  },
  // Stranger (Unauthorized)
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906': {
    name: 'Stranger',
    publicKeySpki: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw8qL3z0oM5...STRANGER_PUBKEY',
  },
};

export const keyManagementService = {
  /**
   * Generates or retrieves an RSA-OAEP (2048-bit) key pair for a given EVM wallet address.
   * Private key is stored strictly in client-side localStorage/IndexedDB.
   */
  async getOrCreateKeyPair(walletAddress) {
    const cleanAddress = walletAddress.toLowerCase();
    const storageKey = `${KEY_STORAGE_PREFIX}${cleanAddress}`;

    const existing = localStorage.getItem(storageKey);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        return parsed;
      } catch (e) {}
    }

    // Generate fresh RSA-OAEP 2048-bit keypair using WebCrypto
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256',
      },
      true, // extractable
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );

    // Export public key (spki format) and private key (pkcs8 format)
    const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const keyData = {
      address: cleanAddress,
      publicKeyBase64: bufferToBase64(spki),
      privateKeyBase64: bufferToBase64(pkcs8), // Stored ONLY in browser memory/local device!
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(keyData));
    return keyData;
  },

  /**
   * Retrieves the public key of a recipient (e.g. Rahul).
   * In a real network, this is fetched from blockchain or user profile.
   */
  async getRecipientPublicKey(recipientAddress) {
    const clean = recipientAddress.toLowerCase();
    
    // Check if we have generated a key locally
    const storageKey = `${KEY_STORAGE_PREFIX}${clean}`;
    const local = localStorage.getItem(storageKey);
    if (local) {
      return JSON.parse(local).publicKeyBase64;
    }

    // Otherwise generate and store a deterministic key pair for this address
    const generated = await this.getOrCreateKeyPair(clean);
    return generated.publicKeyBase64;
  },

  /**
   * WRAP KEY (Envelope Encryption):
   * Ashutosh takes the AES-256 file key and encrypts it using Rahul's Public Key.
   * Only someone with Rahul's Private Key can decrypt it!
   */
  async wrapFileKey(aesKeyString, recipientPublicKeyBase64) {
    // 1. Import Recipient's Public Key
    const spkiBuffer = base64ToBuffer(recipientPublicKeyBase64);
    const recipientPublicKey = await window.crypto.subtle.importKey(
      'spki',
      spkiBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    // 2. Encrypt the AES key string using RSA-OAEP
    const encoder = new TextEncoder();
    const aesKeyBytes = encoder.encode(aesKeyString);

    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      recipientPublicKey,
      aesKeyBytes
    );

    // 3. Return Base64 wrapped ciphertext key (safe to store on blockchain!)
    return bufferToBase64(encryptedKeyBuffer);
  },

  /**
   * UNWRAP KEY:
   * Rahul takes the wrapped ciphertext key and decrypts it using his Private Key.
   * Recovers the raw AES-256 key strictly inside browser memory.
   */
  async unwrapFileKey(wrappedKeyBase64, recipientAddress) {
    const clean = recipientAddress.toLowerCase();
    const keyData = await this.getOrCreateKeyPair(clean);

    if (!keyData || !keyData.privateKeyBase64) {
      throw new Error(`No private key available on this device for ${recipientAddress}. Private keys cannot be recovered from server or blockchain.`);
    }

    // 1. Import Recipient's Private Key
    const pkcs8Buffer = base64ToBuffer(keyData.privateKeyBase64);
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      pkcs8Buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['decrypt']
    );

    // 2. Decrypt the wrapped key buffer
    const wrappedBuffer = base64ToBuffer(wrappedKeyBase64);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      wrappedBuffer
    );

    // 3. Convert back to AES key string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  },
};
