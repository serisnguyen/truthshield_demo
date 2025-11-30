
const DB_NAME = 'TruthShieldDB';
const STORE_NAME = 'voiceProfiles';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return reject(new Error('IndexedDB is not supported in this environment.'));
      }

      const request = window.indexedDB.open(DB_NAME, 1);
      
      request.onerror = (event) => {
        // Handle cases where IndexedDB is disabled (e.g., Firefox Private Browsing)
        console.error("IndexedDB Open Error:", request.error);
        reject(request.error || new Error('Failed to open IndexedDB. It might be disabled in Private Mode.'));
      };
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    } catch (err) {
      // Catch synchronous errors (e.g., SecurityError in sandboxed iframes)
      console.error("IndexedDB Access Error:", err);
      reject(err instanceof Error ? err : new Error('IndexedDB access denied.'));
    }
  });
};

export const checkStorageQuota = async (): Promise<boolean> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage && estimate.quota) {
        const percentUsed = (estimate.usage / estimate.quota) * 100;
        if (percentUsed > 80) {
          console.warn('Storage almost full:', percentUsed.toFixed(2) + '%');
          return false;
        }
      }
    } catch (e) {
      console.error("Storage quota check failed", e);
    }
  }
  return true;
};

export const saveVoiceProfile = async (id: string, audioBlob: Blob) => {
  try {
      const isSafe = await checkStorageQuota();
      if (!isSafe) {
          console.warn("Device storage is running low (>80% used).");
      }

      const db = await initDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id, audioBlob, timestamp: Date.now() });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error("Failed to write to IndexedDB"));
      });
  } catch (err) {
      console.error("saveVoiceProfile failed:", err);
      throw err; // Re-throw to be handled by UI
  }
};

export const getVoiceProfile = async (id: string): Promise<Blob | null> => {
  try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result?.audioBlob || null);
        request.onerror = () => {
            console.warn("Failed to fetch from DB:", request.error);
            resolve(null);
        };
      });
  } catch (error) {
      console.error("IndexedDB Read Error:", error);
      return null;
  }
};
