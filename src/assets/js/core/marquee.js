// @ts-check
{
    /** @type {Record<string, string[]>} */
    const dataTypedAttrType = {
        string: [
        ],
        number: [
            "clone",
            "speed",
            "gap",
        ],
        boolean: [
            "clone",
            "reverse",
            "hover",
        ]
    };
    /** @param {Element} el */
    const runDataAttr = el => {
        if (!(el instanceof HTMLElement)) return;
        // @ts-ignore
        const options = dataAttrHelpers.parseDataAttr(el.getAttribute('data-uc-marquee') || '', dataTypedAttrType);
        if (options.speed) el.style.setProperty('--speed', options.speed + 's');
        if (options.gap) el.style.setProperty('--gap', options.gap + 'px');
        el.classList.toggle('reverse', !!options.reverse);
        el.classList.toggle('pause-on-hover', !!options.hover);
        if (options.clone && el.firstElementChild) {
            const cloneCount = +options.clone;
            const container = el.firstElementChild;
            const children = [...container.childNodes];
            for (let i = 0; i < cloneCount; i++) {
                for (let j = 0; j < children.length; j++) {
                    container.append(children[j].cloneNode(true));
                }
            }
        }
    };
    // Run all.
    // @ts-ignore
    dataAttrHelpers.watchDataAttr('data-uc-marquee', runDataAttr);
}