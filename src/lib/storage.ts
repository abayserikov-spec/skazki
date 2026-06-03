// Storage utility for Skazka Vmeste
const ST = {
  async get<T = unknown>(k: string): Promise<T | null> {
    try {
      const v = localStorage.getItem("skazka_" + k);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  async set(k: string, v: unknown): Promise<void> {
    try {
      localStorage.setItem("skazka_" + k, JSON.stringify(v));
    } catch {}
  },
  async del(k: string): Promise<void> {
    try {
      localStorage.removeItem("skazka_" + k);
    } catch {}
  },
  clear(opts?: { preserve?: string[] }): void {
    try {
      const skip = (opts?.preserve ?? []).map((k) => "skazka_" + k);
      Object.keys(localStorage)
        .filter((k) => k.startsWith("skazka_") && !skip.includes(k))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  },
};

export default ST;
