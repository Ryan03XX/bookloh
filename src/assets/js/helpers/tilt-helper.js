// @ts-check

{
    /** @type {typeof import('tilt.js').default} */
    // @ts-ignore
    const Tilt = window.VanillaTilt;
    /** @type {Record<string, string[]>} */
    const dataTiltAttrType = {
        string: [
            "axis", // What axis should be enabled. Can be "x" or "y"
            "easing", // cubic-bezier(.03,.98,.52,.99) — Easing on enter/exit.
            "mouse-event-element", // css-selector or link to an HTML-element that will be listening to mouse events
        ],
        number: [
            "max", // max tilt rotation (degrees)
            "startX", // the starting tilt on the X axis, in degrees.
            "startY", // the starting tilt on the Y axis, in degrees.
            "perspective", // Transform perspective, the lower the more extreme the tilt gets.
            "scale", // 2 = 200%, 1.5 = 150%, etc..
            "speed", // Speed of the enter/exit transition
            "max-glare", // 1 / the maximum "glare" opacity (1 = 100%, 0.5 = 50%)
            "gyroscopeMinAngleX",
            "gyroscopeMaxAngleX",
            "gyroscopeMinAngleY",
            "gyroscopeMaxAngleY",
            "gyroscopeSamples",
        ],
        boolean: [
            "reverse", // reverse the tilt direction
            "transition", // Set a transition on enter/exit.
            "reset", // If the tilt effect has to be reset on exit.
            "reset-to-start", // Whether the exit reset will go to [0,0] (default) or [startX, startY]
            "glare", // false / if it should have a "glare" effect
            "glare-prerender",
            "gyroscope",
            "full-page-listening",
        ]
    };
    /** @param {Element} el */
    const runDataAttr = el => {
        if (!(el instanceof HTMLElement)) return;
        const options = dataAttrHelpers.parseDataAttr(el.getAttribute('data-uc-tilt') || '', dataTiltAttrType);
        const tilt = new Tilt(el, {
            ...options
        });
    };
    // Run all.
    dataAttrHelpers.watchDataAttr('data-uc-tilt', runDataAttr);
}