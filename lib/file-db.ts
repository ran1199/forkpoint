// Uploaded files (PDF, sketches) live in the browser's IndexedDB, which holds far
// more than localStorage (Ran's choice in Phase 2). Nothing leaves the computer.

const DB_NAME = "forkpoint";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = work(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

/** All files saved under a prefix ("app:" or "demo:"), keyed by file id. */
export async function loadFiles(prefix: string): Promise<Record<string, string>> {
  const range = IDBKeyRange.bound(prefix, prefix + "￿");
  const [keys, values] = await Promise.all([
    run("readonly", (s) => s.getAllKeys(range)),
    run("readonly", (s) => s.getAll(range)),
  ]);
  const files: Record<string, string> = {};
  keys.forEach((k, i) => (files[String(k).slice(prefix.length)] = values[i] as string));
  return files;
}

export function saveFile(key: string, dataUrl: string) {
  return run("readwrite", (s) => s.put(dataUrl, key));
}

export function deleteFile(key: string) {
  return run("readwrite", (s) => s.delete(key));
}
