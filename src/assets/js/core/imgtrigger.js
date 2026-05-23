// @ts-check
{
    /** @type {Record<string, string[]>} */
    const dataTypedAttrType = {
        string: [
        ],
        number: [
            "offset",
            "delay",
        ],
        boolean: [
        ]
    };
    /** @param {Element} el */
    const runDataAttr = el => {
        if (!(el instanceof HTMLElement)) return;
        const options = dataAttrHelpers.parseDataAttr(el.getAttribute('data-uc-imgtrigger') || '', dataTypedAttrType);
        const offset = (options.offset) ? options.offset : 0;
        const delay = (options.delay) ? options.delay : 0;
        const handler = () => {
            if (window.innerHeight > el.getBoundingClientRect().top - offset) {
                window.setTimeout(function(){
                    $(el).addClass('animate');
                }, delay);
                window.removeEventListener('scroll', handler);
                window.removeEventListener('resize', handler);
            }
        };
        window.addEventListener('scroll', handler);
        window.addEventListener('resize', handler);
        handler();
    };
     
    // Run all.
    dataAttrHelpers.watchDataAttr('data-uc-imgtrigger', runDataAttr);
}