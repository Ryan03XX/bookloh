// @ts-check
{
    /** @type {typeof import('split-type').default} */
    // @ts-ignore
    const SplitType = window.SplitType;
    const { parseDataAttr } = dataAttrHelpers;

    /** @type {Record<string, string[]>} */
    const dataSplitTypeAttrType = {
        string: [
            "tagName",
            "lineClass",
            "wordClass",
            "charClass",
            "splitClass",
            "types",
            "split",
        ],
        number: [
            // "threshold",
        ],
        boolean: [
            "absolute",
        ]
    };

    /** @param {Element} el */
    const runDataAttr = el => {
        const content = el.cloneNode(true);
        if (!(content instanceof Element)) return;
        const options = parseDataAttr(el.getAttribute('data-uc-splitext') || '', dataSplitTypeAttrType);
        const SplitText = new SplitType(/** @type {HTMLElement} */(el), {
            // stringsElement: content,
            ...options
        });
    };

    dataAttrHelpers.watchDataAttr('data-uc-splitext', runDataAttr);
}