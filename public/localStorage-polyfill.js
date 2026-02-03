(function() {
  try {
    localStorage.getItem('__test__');
  } catch (e) {
    let memoryStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem(key) { return memoryStorage[key] !== undefined ? memoryStorage[key] : null; },
        setItem(key, value) { memoryStorage[key] = String(value); },
        removeItem(key) { delete memoryStorage[key]; },
        clear() { memoryStorage = {}; },
        get length() { return Object.keys(memoryStorage).length; },
        key(index) { return Object.keys(memoryStorage)[index] || null; }
      },
      writable: true,
      configurable: true
    });
    console.log('[localStorage-polyfill] Memory storage fallback activated');
  }
})();
