// storage-polyfill.ts
if (typeof window !== "undefined") {
  const mockStorage = () => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = String(value); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      get length() { return Object.keys(store).length; },
      key: (index: number) => Object.keys(store)[index] || null,
    };
  };

  // Polyfill sessionStorage
  try {
    const testKey = "__storage_test__";
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
  } catch {
    try {
      Object.defineProperty(window, "sessionStorage", {
        value: mockStorage(),
        writable: true,
        configurable: true,
      });
      console.warn("sessionStorage is polyfilled due to SecurityError.");
    } catch {}
  }

  // Polyfill localStorage
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch {
    try {
      Object.defineProperty(window, "localStorage", {
        value: mockStorage(),
        writable: true,
        configurable: true,
      });
      console.warn("localStorage is polyfilled due to SecurityError.");
    } catch {}
  }
}
