// @ts-check

const dataAttrHelpers = (() => {
    /** @type {Record<string, (value: string) => boolean>} */
    const typesTesters = {
        string: value => true,
        number: value => /^-?\d+(\.\d+)?$/.test(value),
        boolean: value => value === 'false' || value === 'true',
    };
    /** @type {Record<string, (value: string) => any>} */
    const typesParsers = {
        string: value => value,
        number: value => parseFloat(value),
        boolean: value => value !== 'false',
    };
    /**
     *
     * @param {string} dataAttr
     * @param {Record<string, string[]>} types
     */
    const parseDataAttr = (dataAttr, types = {}) => {
        const options = {};
        for (const row of dataAttr.split(';')) {
            const match = row.trim().match(/^(.*?):([\s\S]*)$/);
            if (!match) continue;
            let [key, value] = [match[1], match[2]].map(a => a.trim());
            for (const type in types) {
                if (types[type].includes(key) && typesTesters[type](value)) {
                    value = typesParsers[type](value);
                    break;
                }
            }
            options[key] = value;
        }
        return options;
    };

    /**
     * @param {string} dataAttrName 
     * @param {(el: Element) => void} runDataAttr 
     */
    const watchDataAttr = (dataAttrName, runDataAttr) => {
        const callback = (/** @type {Element} */el) => {
            if (!el.hasAttribute(dataAttrName)) return;
            const key = '--data-attr-' + dataAttrName + '--';
            if (el[key]) return;
            el[key] = true;
            runDataAttr(el);
        };
        document.querySelectorAll('[' + dataAttrName + ']').forEach(callback);
        const observer = new MutationObserver(mutationList => {
            for (const mutation of mutationList) {
                if (mutation.target instanceof Element) {
                    callback(mutation.target);
                    mutation.target.querySelectorAll('[' + dataAttrName + ']').forEach(callback);
                }
            }
        });
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: [dataAttrName],
        });
    };

    return {
        typesTesters,
        typesParsers,
        watchDataAttr,
        parseDataAttr,
    };
})();

// document.addEventListener('DOMContentLoaded', () => {
//     // Run all.
//     dataAttrHelpers.watchDataAttr('data-feather', el => {
//         // @ts-ignore
//         if (typeof feather !== 'undefined') feather.replace();
//     });
// });