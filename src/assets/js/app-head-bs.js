// global options
let
ENABLE_PAGE_PRELOADER = true, 
DEFAULT_DARK_MODE = false, 
USE_LOCAL_STORAGE = true, 
USE_SYSTEM_PREFERENCES = false, 
DEFAULT_BREAKPOINTS = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 };

// add dom-ready class
document.addEventListener('DOMContentLoaded', () => {
    html.classList.add('dom-ready');
});

// body scroll width
const updateScrollWidth = () => document.documentElement.style.setProperty('--body-scroll-width', `${window.innerWidth - document.documentElement.clientWidth}px`);
window.addEventListener('resize', updateScrollWidth);
updateScrollWidth();

// default breakpoints classes
const html = document.documentElement, 
      setupBp = (bp, bpSize, type = 'min') => {
          const media = matchMedia(`(${type}-width: ${bpSize}px)`), 
                cls = `bp-${bp}${type === 'max' ? '-max' : ''}`, 
                update = () => html.classList.toggle(cls, media.matches);
          media.onchange = update;
          update();
      };
Object.entries(DEFAULT_BREAKPOINTS).forEach(([bp, bpSize]) => {
    setupBp(bp, bpSize, 'min');
    setupBp(bp, bpSize - 1, 'max');
});

// auto darkmode feature
const isDarkMode = () => html.classList.contains('uc-dark'), 
      setDarkMode = enableDark => {
          enableDark = !!enableDark;
          if (isDarkMode() === enableDark) return;
          html.classList.toggle('uc-dark', enableDark);
          window.dispatchEvent(new CustomEvent('darkmodechange'));
      }, 
      getInitialDarkMode = () => USE_LOCAL_STORAGE && localStorage.getItem('darkMode') !== null ? localStorage.getItem('darkMode') === '1' : USE_SYSTEM_PREFERENCES ? matchMedia('(prefers-color-scheme: dark)').matches : DEFAULT_DARK_MODE;
setDarkMode(getInitialDarkMode());

// darkmode feature by url parameters
const dark = new URLSearchParams(location.search).get('dark');
if (dark) html.classList.toggle('uc-dark', dark === '1');

// page preloader feature
if (ENABLE_PAGE_PRELOADER) {
    const style = document.createElement('style');
    style.textContent = `
        .uc-pageloader {
            position: fixed; top: 0; left: 0; bottom: 0; right: 0;
            display: flex; justify-content: center; align-items: center;
            z-index: 99999;
            background-color: #faf8ff;
        }
        .uc-dark .uc-pageloader, .uc-pageloader:where(.uc-dark) {
            background-color: #131313;
        }
        .uc-pageloader>.loading {
            display: flex; justify-content: center; align-items: center;
            width: 44px; height: 44px;
        }
        .uc-pageloader .uc-pageloader-ring {
            width: 40px; height: 40px; padding: 4px; border-radius: 50%; box-sizing: border-box;
            background: conic-gradient(from 0deg, #ff9d7e, #ff5ec7, #c800ff, #9333ea, #c800ff, #ff9d7e);
            animation: uc-loading 0.95s linear infinite;
            display: flex;
        }
        .uc-pageloader .uc-pageloader-ring > span {
            flex: 1; min-width: 0; min-height: 0; border-radius: 50%;
            background: #faf8ff;
        }
        .uc-dark .uc-pageloader .uc-pageloader-ring > span,
        .uc-pageloader.uc-dark .uc-pageloader-ring > span {
            background: #131313;
        }
        @keyframes uc-loading { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        html.show-preloader body { display: none; }
    `;
    document.head.append(style);

    const preloader = document.createElement('div');
    preloader.className = 'uc-pageloader';
    preloader.innerHTML = '<div class="loading" role="status" aria-live="polite" aria-busy="true"><div class="uc-pageloader-ring"><span></span></div></div>';
    html.classList.add('show-preloader');
    html.append(preloader);

    (async () => {
        const t0 = Date.now();
        await new Promise(r => document.addEventListener('DOMContentLoaded', r));
        html.classList.remove('show-preloader');
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, Math.max(0, 500 - (Date.now() - t0))));
        preloader.style.transition = `opacity 1.1s cubic-bezier(0.8, 0, 0.2, 1)`;
        preloader.style.opacity = 0;
        await new Promise(r => setTimeout(r, 1100));
        preloader.remove();
    })();
}

// GPDR popup
document.addEventListener('DOMContentLoaded', function() {
    const gdprNotification = document.getElementById('uc-gdpr-notification');
    const acceptButton = document.getElementById('uc-accept-gdpr');
    const declineButton = document.getElementById('uc-decline-gdpr');
    const closeButton = document.getElementById('uc-close-gdpr-notification');
    const gdprAccepted = localStorage.getItem('gdprAccepted');

    // Only proceed if the GDPR notification exists
    if (gdprNotification) {
        // Show the GDPR notification if it has not been accepted
        if (!gdprAccepted) {
            setTimeout(function() {
                gdprNotification.classList.add('show');
            }, 5000); // 5000 milliseconds = 5 seconds
        }

        // Set event listener for the accept button if it exists
        if (acceptButton) {
            acceptButton.addEventListener('click', function() {
                gdprNotification.classList.remove('show');
                // Set the localStorage item to indicate GDPR has been accepted
                localStorage.setItem('gdprAccepted', 'true');
            });
        }

        // Set event listener for the decline button if it exists
        if (declineButton) {
            declineButton.addEventListener('click', function() {
                gdprNotification.classList.remove('show');
                localStorage.setItem('gdprAccepted', 'declined');
            });
        }

        // Set event listener for the close button if it exists
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                gdprNotification.classList.remove('show');
            });
        }
    }
});

// Clients area toggle
document.addEventListener('DOMContentLoaded', function() {
    const panel = document.getElementById('clients_feedback_area');
    const toggleArea = document.getElementById('clients-feedback-toggle-area');
    
    if (panel) {
        const toggleButton = panel.querySelector('a');
        
        if (toggleButton) {
            toggleButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Check if panel has uc-active class and update button text
                if (panel.classList.contains('uc-active')) {
                    panel.classList.remove('h-700px');
                    panel.classList.add('h-auto');
                    toggleArea.classList.remove('position-absolute');
                    toggleArea.classList.remove('h-300px');
                    toggleArea.classList.add('mt-8');
                    toggleButton.classList.remove('btn-primary');
                    toggleButton.classList.add('btn-secondary');
                    toggleButton.textContent = 'Close feedbacks'; // Change to desired text
                } else {
                    panel.classList.remove('h-auto');
                    panel.classList.add('h-700px');
                    toggleArea.classList.add('position-absolute');
                    toggleArea.classList.add('h-300px');
                    toggleArea.classList.remove('mt-8');
                    toggleButton.classList.add('btn-primary');
                    toggleButton.classList.remove('btn-secondary');
                    toggleButton.textContent = 'View all feedbacks'; // Default text
                }
            });
        }
    }
});
