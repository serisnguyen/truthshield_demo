
const DB_NAME = 'TruthShieldDB';
const STORE_NAME = 'voiceProfiles';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
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
    request.onerror = () => reject(request.error);
  });
};

export const getVoiceProfile = async (id: string): Promise<Blob | null> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result?.audioBlob || null);
    request.onerror = () => resolve(null);
  });
};
