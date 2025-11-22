// Disable problematic browser extension interactions
(function() {
  'use strict';
  
  console.log('SkillHub: Initializing extension conflict prevention...');
  
  // Prevent extension message channel errors
  if (window.chrome && window.chrome.runtime) {
    const originalAddListener = window.chrome.runtime.onMessage.addListener;
    window.chrome.runtime.onMessage.addListener = function(callback) {
      const wrappedCallback = function(message, sender, sendResponse) {
        try {
          return callback(message, sender, sendResponse);
        } catch (error) {
          console.warn('SkillHub: Prevented extension error:', error);
          return false;
        }
      };
      return originalAddListener.call(this, wrappedCallback);
    };
  }
  
  // Block problematic extension resource loading
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('chrome-extension://')) {
      console.warn('SkillHub: Blocked extension resource:', url);
      return Promise.reject(new Error('Extension resource blocked'));
    }
    return originalFetch.apply(this, arguments);
  };
  
  // Prevent extension script injection
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
          if (node.src && node.src.includes('chrome-extension://')) {
            console.warn('SkillHub: Blocked extension script:', node.src);
            node.remove();
          }
        }
      });
    });
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  console.log('SkillHub: Extension conflict prevention active');
})();
