export type MemoryEntry = {
  id: string;
  key: string;
  value: string;
  createdAt: string;
};

const store: Record<string, MemoryEntry[]> = {};

export const simpleMemory = {
  async write(namespace: string, key: string, value: string) {
    const entry: MemoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      key,
      value,
      createdAt: new Date().toISOString(),
    };
    store[namespace] = store[namespace] ?? [];
    store[namespace].push(entry);
    return entry;
  },
  async readAll(namespace: string) {
    return store[namespace] ?? [];
  },
  async clear(namespace: string) {
    delete store[namespace];
  },
};
