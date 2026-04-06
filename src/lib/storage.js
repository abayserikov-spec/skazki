// Storage utility for Skazka Vmeste
const ST = {
  async get(k) { try { const v = localStorage.getItem("skazka_" + k); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(k, v) { try { localStorage.setItem("skazka_" + k, JSON.stringify(v)); } catch {} },
  async del(k) { try { localStorage.removeItem("skazka_" + k); } catch {} },
};

export default ST;
