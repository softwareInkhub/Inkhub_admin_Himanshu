// Session-scoped storage: each browser tab keeps its own UI state.
// Safe guards for SSR to prevent hydration mismatches.
export const sessionStorageSafe: Storage = {
  getItem: (k) => (typeof window === "undefined" ? null : window.sessionStorage.getItem(k)),
  setItem: (k, v) => { if (typeof window !== "undefined") window.sessionStorage.setItem(k, v); },
  removeItem: (k) => { if (typeof window !== "undefined") window.sessionStorage.removeItem(k); },
  key: (i) => (typeof window === "undefined" ? null : window.sessionStorage.key(i)),
  get length() { return typeof window === "undefined" ? 0 : window.sessionStorage.length; },
  clear: () => { if (typeof window !== "undefined") window.sessionStorage.clear(); },
};
