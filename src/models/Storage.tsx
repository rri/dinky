
export const STORE_SETTINGS = "settings";
export const STORE_TASKS = "tasks";
export const STORE_TOPICS = "topics";
export const STORE_NOTES = "notes";
export const STORE_WORKS = "works";

export class Storage {
    private dbName: string;
    private db: IDBDatabase | null = null;
    private stores = [STORE_SETTINGS, STORE_TASKS, STORE_TOPICS, STORE_NOTES, STORE_WORKS];

    constructor(dbName = "dinky") {
        this.dbName = dbName;
    }

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2); // Bump version to 2
            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = request.result;
                this.stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName);
                    }
                });
                
                // If migrating from version 1, it had a "kv" store
                if (event.oldVersion === 1 && db.objectStoreNames.contains("kv")) {
                    // We'll handle data migration in Store.tsx instead of here to keep this simple
                }
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName: string, key: string): Promise<any | null> {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, "readonly");
                const store = transaction.objectStore(storeName);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error(`IndexedDB get failed for ${storeName}:${key}`, e);
            return null;
        }
    }

    async getAll(storeName: string): Promise<Record<string, any>> {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, "readonly");
                const store = transaction.objectStore(storeName);
                const request = store.openCursor();
                const result: Record<string, any> = {};
                request.onsuccess = (event: any) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        result[cursor.key] = cursor.value;
                        cursor.continue();
                    } else {
                        resolve(result);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error(`IndexedDB getAll failed for ${storeName}`, e);
            return {};
        }
    }

    async set(storeName: string, key: string, value: any): Promise<void> {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, "readwrite");
                const store = transaction.objectStore(storeName);
                const request = store.put(value, key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error(`IndexedDB set failed for ${storeName}:${key}`, e);
        }
    }

    async setMany(storeName: string, items: Record<string, any>): Promise<void> {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, "readwrite");
                const store = transaction.objectStore(storeName);
                Object.entries(items).forEach(([key, value]) => {
                    store.put(value, key);
                });
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (e) {
            console.error(`IndexedDB setMany failed for ${storeName}`, e);
        }
    }

    async delete(storeName: string, key: string): Promise<void> {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, "readwrite");
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error(`IndexedDB delete failed for ${storeName}:${key}`, e);
        }
    }

    // Specialized method for migrating from version 1 "kv" store
    async getOldData(key: string): Promise<any | null> {
        try {
            const db = await this.getDB();
            if (!db.objectStoreNames.contains("kv")) return null;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction("kv", "readonly");
                const store = transaction.objectStore("kv");
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            return null;
        }
    }

    async clearOldData(key: string): Promise<void> {
        try {
            const db = await this.getDB();
            if (!db.objectStoreNames.contains("kv")) return;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction("kv", "readwrite");
                const store = transaction.objectStore("kv");
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error(`IndexedDB clearOldData failed for ${key}`, e);
        }
    }
}

export const storage = new Storage();
