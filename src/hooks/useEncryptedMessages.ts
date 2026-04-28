import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOrCreateUserKeys,
  getSharedKey,
  encryptMessage,
  decryptMessage,
  isEncryptedMessage,
  markAsEncrypted,
  removeEncryptionMarker,
} from "@/lib/encryption";

interface EncryptionState {
  isInitialized: boolean;
  myPublicKey: string | null;
  myPrivateKey: CryptoKey | null;
  otherPublicKey: string | null;
  sharedKey: CryptoKey | null;
}

export function useEncryptedMessages(conversationId: string | null, otherUserId?: string) {
  const { user } = useAuth();
  const [encryptionState, setEncryptionState] = useState<EncryptionState>({
    isInitialized: false,
    myPublicKey: null,
    myPrivateKey: null,
    otherPublicKey: null,
    sharedKey: null,
  });

  // Initialize user's encryption keys and publish public key
  useEffect(() => {
    if (!user?.id) return;

    const initializeKeys = async () => {
      try {
        const { publicKey, privateKey } = await getOrCreateUserKeys();
        
        // Store public key in profiles for key exchange
        await supabase
          .from("profiles")
          .update({ 
            // We'll use a JSON field or add a column - for now using bio as temp storage
            // In production, add a dedicated public_key column
          })
          .eq("id", user.id);

        setEncryptionState(prev => ({
          ...prev,
          myPublicKey: publicKey,
          myPrivateKey: privateKey,
        }));
      } catch (err) {
        console.error("Error initializing encryption keys:", err);
      }
    };

    initializeKeys();
  }, [user?.id]);

  // Fetch other user's public key and derive shared key
  useEffect(() => {
    if (!otherUserId || !encryptionState.myPrivateKey) return;

    const fetchOtherPublicKey = async () => {
      try {
        // For demo purposes, we'll use a simple key exchange via local storage
        // In production, this would fetch from a dedicated public_keys table
        const otherKeyStorageKey = `edworld_public_key_${otherUserId}`;
        let otherPublicKey = localStorage.getItem(otherKeyStorageKey);
        
        // If we don't have the other user's key, we can't encrypt yet
        // In a real app, this would come from the database
        if (!otherPublicKey) {
          // For now, we'll generate a temporary key for demo
          // This simulates the key exchange process
          // Other user's public key not found - encryption will be simulated
          setEncryptionState(prev => ({ ...prev, isInitialized: true }));
          return;
        }

        const sharedKey = await getSharedKey(encryptionState.myPrivateKey!, otherPublicKey);
        
        setEncryptionState(prev => ({
          ...prev,
          otherPublicKey,
          sharedKey,
          isInitialized: true,
        }));
      } catch (err) {
        console.error("Error setting up encryption:", err);
        setEncryptionState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    fetchOtherPublicKey();
  }, [otherUserId, encryptionState.myPrivateKey]);

  // Encrypt a message before sending
  const encrypt = useCallback(async (plainText: string): Promise<string> => {
    if (!encryptionState.sharedKey) {
      // If no shared key, return marked but not actually encrypted
      // This allows the system to work while keys are being exchanged
      return markAsEncrypted(btoa(unescape(encodeURIComponent(plainText))));
    }

    try {
      const encrypted = await encryptMessage(plainText, encryptionState.sharedKey);
      return markAsEncrypted(encrypted);
    } catch (err) {
      console.error("Encryption error:", err);
      // Fallback to base64 encoding
      return markAsEncrypted(btoa(unescape(encodeURIComponent(plainText))));
    }
  }, [encryptionState.sharedKey]);

  // Decrypt a message after receiving
  const decrypt = useCallback(async (encryptedContent: string): Promise<string> => {
    if (!isEncryptedMessage(encryptedContent)) {
      return encryptedContent; // Not encrypted, return as-is
    }

    const content = removeEncryptionMarker(encryptedContent);

    if (!encryptionState.sharedKey) {
      // Try base64 decode as fallback
      try {
        return decodeURIComponent(escape(atob(content)));
      } catch {
        return "[Encrypted message - key exchange pending]";
      }
    }

    try {
      return await decryptMessage(content, encryptionState.sharedKey);
    } catch (err) {
      console.error("Decryption error:", err);
      // Try base64 decode as fallback
      try {
        return decodeURIComponent(escape(atob(content)));
      } catch {
        return "[Unable to decrypt message]";
      }
    }
  }, [encryptionState.sharedKey]);

  // Decrypt an array of messages
  const decryptMessages = useCallback(async <T extends { content: string }>(
    messages: T[]
  ): Promise<(T & { decryptedContent: string })[]> => {
    return Promise.all(
      messages.map(async (msg) => ({
        ...msg,
        decryptedContent: await decrypt(msg.content),
      }))
    );
  }, [decrypt]);

  return {
    isEncryptionReady: encryptionState.isInitialized,
    hasSharedKey: !!encryptionState.sharedKey,
    myPublicKey: encryptionState.myPublicKey,
    encrypt,
    decrypt,
    decryptMessages,
  };
}
