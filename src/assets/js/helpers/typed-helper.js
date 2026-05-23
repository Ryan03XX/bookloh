// @ts-check

{
    /** @type {typeof import('typed.js').default} */
    // @ts-ignore
    const Typed = window.Typed;
    /** @type {Record<string, string[]>} */
    const dataTypedAttrType = {
        string: [
            "stringsElement",
            "fadeOutClass",
            "cursorChar",
            "attr",
            "contentType"
        ],
        number: [
            "typeSpeed",
            "startDelay",
            "backSpeed",
            "backDelay",
            "loopCount"
        ],
        boolean: [
            "smartBackspace",
            "shuffle",
            "fadeOut",
            "fadeOutDelay",
            "loop",
            "showCursor",
            "autoInsertCss",
            "bindInputFocusEvents"
        ]
    };
    /** @param {Element} el */
    const runDataAttr = el => {
        const content = el.cloneNode(true);
        if (!(content instanceof Element)) return;
        el.innerHTML = '';
        const options = dataAttrHelpers.parseDataAttr(el.getAttribute('data-uc-typed') || '', dataTypedAttrType);
        const typed = new Typed(el, {
            stringsElement: content,
            ...options
        });
    };

    // Run all.
    dataAttrHelpers.watchDataAttr('data-uc-typed', runDataAttr);
}