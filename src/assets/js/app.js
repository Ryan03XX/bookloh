// @ts-check
/// <reference types="jquery"/>
/// <reference types="animejs"/>
/// <reference path="../../../node_modules/uni-js-framework/js/globals.d.ts"/>
/// <reference path="../../../node_modules/uni-js-framework/js/app-head-bs.js"/>

// Scrollbar width
{
    const updateScrollWidth = () => {
        document.documentElement.style.setProperty('--body-scroll-width', `${window.innerWidth - document.documentElement.clientWidth}px`);
    };
    window.addEventListener('resize', updateScrollWidth);
    updateScrollWidth();
}

/**
 * After back/forward cache restore (or flaky wheel smoothers), document scroll can stay “locked”
 * (wheel does nothing until the scrollbar is dragged). Clear inline overflow locks and nudge layout.
 */
window.addEventListener('pageshow', (event) => {
    const unlock = () => {
        const { documentElement: root, body } = document;
        root.style.overflow = '';
        body.style.overflow = '';
        root.style.touchAction = '';
        body.style.touchAction = '';
        root.style.paddingRight = '';
        body.style.paddingRight = '';
        root.classList.remove('uc-modal-page', 'uc-offcanvas-page', 'uc-lightbox-page');
        body.classList.remove('uc-modal-page', 'uc-offcanvas-page', 'uc-lightbox-page');
    };
    unlock();
    requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
    });
    if (event.persisted && typeof window.SmoothScroll !== 'undefined' && typeof window.SmoothScroll.destroy === 'function') {
        try {
            window.SmoothScroll.destroy();
        } catch {
            /* ignore */
        }
    }
});

// Dark mode toggle
{
    const handleDarkModeChange = () => {
        setDarkMode(!isDarkMode());
        const isDark = isDarkMode();
        localStorage.setItem('darkMode', isDark ? '1' : '0');
    };

    const setInitialDarkMode = darkToggle => {
        darkToggle.checked = isDarkMode();
    };

    const darkModeElements = document.querySelectorAll('[data-darkmode-toggle] input, [data-darkmode-switch] input');
    darkModeElements.forEach(darkToggle => {
        darkToggle.addEventListener('change', handleDarkModeChange);
        // @ts-ignore
        setInitialDarkMode(darkToggle);
    });
}

// Horizontal Scroll
document.querySelectorAll('.uc-horizontal-scroll').forEach(element => {
    element.addEventListener('wheel', e => {
        e.preventDefault();
        // @ts-ignore
        element.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    });
});

// To Top
document.addEventListener('DOMContentLoaded', () => {
    const $elem = document.querySelector('[data-uc-backtotop]');
    if (!$elem) return;

    $elem.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let scrollPos = 0;
    window.addEventListener('scroll', () => {
        const top = document.body.getBoundingClientRect().top;
        // @ts-ignore
        $elem.parentNode.classList.toggle('uc-active', top <= scrollPos);
        scrollPos = top;
    });
});
        
// Pretty Print
// @ts-ignore
window.prettyPrint && prettyPrint();