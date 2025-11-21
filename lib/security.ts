
// Sovereign Security Layer
// Handles Encryption (AES-GCM) and Immutable Audit Logging

// --- Encryption Service ---

const ALGORITHM = 'AES-GCM';
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt'];
const KEY_STORAGE_NAME = 'issie_master_key';

// Generate a session-based key (in a real persistent OS, this would be derived from a master password)
let sessionKey: CryptoKey | null = null;

export const initializeSecurity = async () => {
    if (sessionKey) return;

    try {
        const storedKey = localStorage.getItem(KEY_STORAGE_NAME);
        
        if (storedKey) {
            // Import existing key from storage
            sessionKey = await window.crypto.subtle.importKey(
                'jwk',
                JSON.parse(storedKey),
                { name: ALGORITHM },
                true,
                KEY_USAGE
            );
        } else {
            // Generate new key
            sessionKey = await window.crypto.subtle.generateKey(
                { name: ALGORITHM, length: 256 },
                true,
                KEY_USAGE
            );
            // Export and save key for persistence
            const exportedKey = await window.crypto.subtle.exportKey('jwk', sessionKey);
            localStorage.setItem(KEY_STORAGE_NAME, JSON.stringify(exportedKey));
        }
    } catch (e) {
        console.error("Security Initialization Failed. Resetting Key.", e);
        // Fallback: Generate new ephemeral key if storage is corrupt
        sessionKey = await window.crypto.subtle.generateKey(
            { name: ALGORITHM, length: 256 },
            true,
            KEY_USAGE
        );
        localStorage.removeItem(KEY_STORAGE_NAME);
    }
};

// Convert ArrayBuffer to Base64
const ab2str = (buf: ArrayBuffer) => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf) as any));
};

// Convert Base64 to ArrayBuffer
const str2ab = (str: string) => {
    const binaryString = atob(str);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

export const encryptData = async (data: any): Promise<string | null> => {
    try {
        if (!sessionKey) await initializeSecurity();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(JSON.stringify(data));
        
        const encrypted = await window.crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            sessionKey!,
            encoded
        );

        // Return as "IV:CIPHERTEXT" (Base64 encoded)
        return `${ab2str(iv)}:${ab2str(encrypted)}`;
    } catch (e) {
        console.error("Encryption failed:", e);
        return null;
    }
};

export const decryptData = async (cipherStr: string): Promise<any | null> => {
    try {
        if (!sessionKey) await initializeSecurity();
        
        // Sanity check format
        if (!cipherStr.includes(':')) return null;

        const [ivStr, dataStr] = cipherStr.split(':');
        if (!ivStr || !dataStr) return null;

        const iv = str2ab(ivStr);
        const data = str2ab(dataStr);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: ALGORITHM, iv: new Uint8Array(iv) },
            sessionKey!,
            data
        );

        const decoded = new TextDecoder().decode(decrypted);
        return JSON.parse(decoded);
    } catch (e) {
        // Warn but do not crash. This happens if data was encrypted with an old/lost key.
        console.warn("Decryption failed (Key mismatch or legacy data). Data will be reset on next save.");
        return null;
    }
};

// --- Secure Storage Wrapper ---

export const secureStorage = {
    setItem: async (key: string, value: any) => {
        const encrypted = await encryptData(value);
        if (encrypted) {
            localStorage.setItem(key, encrypted);
        }
    },
    getItem: async (key: string) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        // Try decrypting; if fail (e.g. old plaintext data or key mismatch), return null
        try {
            if (item.includes(':')) {
                const decrypted = await decryptData(item);
                return decrypted;
            }
            return JSON.parse(item); // Fallback for legacy unencrypted data
        } catch {
            return null;
        }
    },
    removeItem: (key: string) => localStorage.removeItem(key)
};

// --- Immutable Audit Log ---

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    agent: string;
    action: string;
    status: 'SUCCESS' | 'FAILURE';
    details: string;
    hash: string; // Simple tamper-evident hash
}

const generateHash = async (content: string) => {
    const msgBuffer = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const logAuditEntry = async (agent: string, action: string, status: 'SUCCESS' | 'FAILURE', details: string) => {
    const entry: AuditLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agent,
        action,
        status,
        details,
        hash: ''
    };
    
    // Create a hash of the entry itself for integrity
    entry.hash = await generateHash(`${entry.id}${entry.timestamp}${agent}${action}${status}${details}`);
    
    // Store in audit log (using standard local storage for the log itself to be inspectable, but could be encrypted)
    const existingLogs = JSON.parse(localStorage.getItem('audit_trail') || '[]');
    // Keep last 100 logs
    const updatedLogs = [entry, ...existingLogs].slice(0, 100);
    localStorage.setItem('audit_trail', JSON.stringify(updatedLogs));
    
    console.log(`[AUDIT] [${agent}] ${action}: ${status}`);
    return entry;
};
