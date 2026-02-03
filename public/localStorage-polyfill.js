(function() {
  try {
    localStorage.getItem('__test__');
  } catch (e) {
    var memoryStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: function(key) { return memoryStorage[key] !== undefined ? memoryStorage[key] : null; },
        setItem: function(key, value) { memoryStorage[key] = String(value); },
        removeItem: function(key) { delete memoryStorage[key]; },
        clear: function() { memoryStorage = {}; },
        get length() { return Object.keys(memoryStorage).length; },
        key: function(index) { return Object.keys(memoryStorage)[index] || null; }
      },
      writable: true,
      configurable: true
    });
    console.log('[localStorage-polyfill] Memory storage fallback activated');
  }
})();
