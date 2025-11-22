// Full-width helper utility
export const makeFullWidth = () => {
  const sections = [
    '.features-section',
    '.testimonials-section', 
    '.stats-section',
    '.cta-section',
    '.how-section'
  ];

  sections.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      // Force full viewport width with aggressive breakout
      element.style.cssText = `
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: none !important;
        margin-left: calc(-50vw + 50%) !important;
        margin-right: calc(-50vw + 50%) !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        position: relative !important;
        left: 0 !important;
        right: 0 !important;
        box-sizing: border-box !important;
        transform: translateX(0) !important;
      `;
      
      // Override any container constraints within sections
      const containers = element.querySelectorAll('.container, .features-container, .testimonials-container, .stats-container, .cta-container, .how-container');
      containers.forEach(container => {
        // Responsive container padding based on screen size
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth <= 768;
        
        let padding = '0 2rem';
        if (isMobile) {
          padding = '0 0.5rem';
        } else if (isTablet) {
          padding = '0 1rem';
        }
        
        container.style.cssText = `
          max-width: 1200px !important;
          margin: 0 auto !important;
          padding: ${padding} !important;
          width: 100% !important;
          box-sizing: border-box !important;
        `;
      });
    }
  });

  // Also force the home container to be full width
  const homeContainer = document.querySelector('.home-container');
  if (homeContainer) {
    homeContainer.style.cssText = `
      width: 100vw !important;
      min-width: 100vw !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
    `;
  }

  // Force root elements to be full width
  const rootElements = ['#root', '.App', 'main'];
  rootElements.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      element.style.cssText = `
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
      `;
    }
  });
};

// Ensure full width on window resize
export const setupFullWidthListener = () => {
  makeFullWidth();
  window.addEventListener('resize', makeFullWidth);
  
  // Also run after DOM changes
  const observer = new MutationObserver(makeFullWidth);
  observer.observe(document.body, { childList: true, subtree: true });
  
  return () => {
    window.removeEventListener('resize', makeFullWidth);
    observer.disconnect();
  };
};