// Dynamic background
(() => {
    let currentColors = { bgColor: '', textColor: '' };
    const isDarkHexColor = hex => {
        const hexCode = hex.charAt(0) === '#' ? hex.substr(1, 6) : hex;
        const r = parseInt(hexCode.substr(0, 2), 16);
        const g = parseInt(hexCode.substr(2, 2), 16);
        const b = parseInt(hexCode.substr(4, 2), 16);
        // Gets the average value of the colors
        const contrastRatio = (r + g + b) / (255 * 3);
        return contrastRatio < 0.5;
    };
    const update = () => {
        const sections = document.querySelectorAll('[data-uc-bgcolor]');
        if (!sections.length) return;
        const scrollY = window.innerHeight / 2;
        let minDist = Infinity, minSection = null;
        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            const sectionY = rect.top + rect.height / 2;
            const dist = Math.abs(sectionY - scrollY);
            if (dist < minDist) {
                minDist = dist;
                minSection = section;
            }
        }
        if (!minSection) return;
        const section = minSection;
        const bgColor = section.dataset.ucBgcolor;
        const textColor = section.dataset.color;
        if (currentColors.bgColor === bgColor && currentColors.textColor === textColor) return;
        currentColors.bgColor = bgColor;
        currentColors.textColor = textColor;
        const isDark = isDarkHexColor(bgColor);
        setDarkMode(isDark);
        document.body.style.background = bgColor;
        document.body.style.color = typeof textColor !== 'undefined' ? textColor : (isDark ? 'white' : 'black');
        document.body.style.transition = 'background 750ms ease, color 750ms ease';
    };
    document.addEventListener('scroll', update);
    window.addEventListener('load', update);
})();