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
};

export default ST;
