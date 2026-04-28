/**
 * End-to-End Encryption utilities using Web Crypto API
 * Uses AES-GCM for symmetric encryption and ECDH for key exchange
 */

// Generate a new ECDH key pair for key exchange
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey"]
  );
}

// Export public key to a shareable format
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(exported);
}

// Import a public key from base64 format
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(publicKeyBase64);
  return crypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
}

// Export private key to a storable format
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(exported);
}

// Import a private key from base64 format
export async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(privateKeyBase64);
  return crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey"]
  );
}

// Derive a shared AES key from ECDH key exchange
export async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt a message using AES-GCM
export async function encryptMessage(
  message: string,
  sharedKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Generate a random IV for each message
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    sharedKey,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return arrayBufferToBase64(combined.buffer);
}

// Decrypt a message using AES-GCM
export async function decryptMessage(
  encryptedMessage: string,
  sharedKey: CryptoKey
): Promise<string> {
  const combined = new Uint8Array(base64ToArrayBuffer(encryptedMessage));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    sharedKey,
    encryptedData
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

// Helper: ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Storage keys for encryption keys
const PRIVATE_KEY_STORAGE_KEY = "edworld_e2e_private_key";
const PUBLIC_KEY_STORAGE_KEY = "edworld_e2e_public_key";

// Get or generate user's encryption keys
export async function getOrCreateUserKeys(): Promise<{
  publicKey: string;
  privateKey: CryptoKey;
}> {
  const storedPrivateKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
  const storedPublicKey = localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);
  
  if (storedPrivateKey && storedPublicKey) {
    const privateKey = await importPrivateKey(storedPrivateKey);
    return { publicKey: storedPublicKey, privateKey };
  }
  
  // Generate new key pair
  const keyPair = await generateKeyPair();
  const publicKeyExported = await exportPublicKey(keyPair.publicKey);
  const privateKeyExported = await exportPrivateKey(keyPair.privateKey);
  
  // Store keys locally
  localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKeyExported);
  localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, publicKeyExported);
  
  return { publicKey: publicKeyExported, privateKey: keyPair.privateKey };
}

// Cache for derived shared keys to avoid re-deriving
const sharedKeyCache = new Map<string, CryptoKey>();

// Get or derive shared key for a conversation
export async function getSharedKey(
  myPrivateKey: CryptoKey,
  otherPublicKeyBase64: string
): Promise<CryptoKey> {
  if (sharedKeyCache.has(otherPublicKeyBase64)) {
    return sharedKeyCache.get(otherPublicKeyBase64)!;
  }
  
  const otherPublicKey = await importPublicKey(otherPublicKeyBase64);
  const sharedKey = await deriveSharedKey(myPrivateKey, otherPublicKey);
  
  sharedKeyCache.set(otherPublicKeyBase64, sharedKey);
  return sharedKey;
}

// Check if a message is encrypted (starts with encrypted marker)
export function isEncryptedMessage(content: string): boolean {
  // Encrypted messages are base64 encoded and will be longer than typical messages
  // We use a simple prefix marker for clarity
  return content.startsWith("E2E:");
}

// Add encryption marker to message
export function markAsEncrypted(encryptedContent: string): string {
  return `E2E:${encryptedContent}`;
}

// Remove encryption marker from message
export function removeEncryptionMarker(content: string): string {
  if (content.startsWith("E2E:")) {
    return content.substring(4);
  }
  return content;
}
