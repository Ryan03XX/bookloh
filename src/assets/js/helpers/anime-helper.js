// @ts-check
/// <reference types="animejs"/>
/// <reference types="jquery"/>
/// <reference path="anime-helper.d.ts"/>

{
    /** @type {JQueryStatic} */
    // @ts-ignore
    const $ = typeof jQuery !== 'undefined' ? jQuery : null;
    const { typesTesters, typesParsers } = dataAttrHelpers;
    /**
     *
     * @param {string} dataAttr
     * @param {Record<string, string[]>} types
     */
    const parseDataAttr = (dataAttr, types) => {
        const options = {};
        for (const row of dataAttr.split(';')) {
            const match = row.trim().match(/^(.*?):([\s\S]*)$/);
            if (!match) continue;
            let [key, value] = [match[1], match[2]].map(a => a.trim());
            if (aliases[key]) {
                key = aliases[key];
            }
            for (const type in types) {
                if (types[type].includes(key) && typesTesters[type](value)) {
                    value = typesParsers[type](value);
                    break;
                }
            }
            if (typeof value === 'string') {
                if (/^(\[|\{|anime\.|"|')/.test(value)) {
                    value = new Function(`return (${value})`)();
                }
            }
            const parts = key.split('-');
            /** @type {any} */
            let opts = options;
            parts.forEach((part, i) => {
                if (i < parts.length - 1) {
                    opts[part] = opts[part] || {};
                    opts = opts[part];
                } else {
                    opts[part] = value;
                }
            });
        }
        return options;
    };
    /** @type {Record<string, string[]>} */
    const dataAnimeAttrType = {
        string: [
            "targets",
            "onscroll",
            "onscroll-target",
        ],
        number: [
            "onview",
        ],
        boolean: [
            "loop",
            "onclick",
            "onview",
            "autoplay",
            "onscroll",
            "onscroll-target",
            "onscroll-pen",
        ]
    };
    /** @type {Record<string, string>} */
    const aliases = {
        'onscroll': 'onscroll-target',
        'onscroll-trigger': 'onscroll-triggerHook',
    };
    /**
     *
     * @param {Element & { animeToggleOpen?: boolean }} el
     * @param {anime.AnimeInstance | anime.AnimeTimelineInstance} instance
     * @param {'restart' | 'alternate' | 'reset'} direction
     */
    const runInstance = (el, instance, direction = 'restart') => {
        if (direction === 'alternate') {
            if (!el.animeToggleOpen) {
                if (instance.reversed) {
                    instance.reverse();
                }
            } else {
                if (!instance.reversed) {
                    instance.reverse();
                }
            }
            el.animeToggleOpen = !el.animeToggleOpen;
            instance.play();
        } else if (direction === 'restart') {
            instance.restart();
        } else if (direction === 'reset') {
            instance.reset();
        } else {
            throw 'invalid direction';
        }
    };
    const loadingPromise = new Promise(r => {
        document.addEventListener('DOMContentLoaded', e => {
            setTimeout(() => {
                r(true);
            }, 1000 + 300);
        });
    });
    /**
     * @param {Element} el
     * @param {AnimeHelperRunOptions} options
     * @param {anime.AnimeInstance | anime.AnimeTimelineInstance} instance
     */
    const runHelper = async (el, options, instance) => {
        /**
         *
         * @param {Parameters<typeof runInstance>[2]} direction
         */
        const run = (direction = 'restart') => {
            runInstance(el, instance, direction);
        };
        let autoRun = options.autoplay !== false;
        if (options.onclick) {
            const toggle = options.onclick === 'alternate';
            el.addEventListener('click', e => {
                e.preventDefault();
                run(toggle ? 'alternate' : 'restart');
            });
            autoRun = false;
        }
        if (options.onscroll) {
            const scrollMagicOptions = typeof options.onscroll === 'boolean' ? { triggerElement: el } : options.onscroll;
            if (scrollMagicOptions.target) {
                scrollMagicOptions.triggerElement = scrollMagicOptions.target;
                delete scrollMagicOptions.target;
            }
            const controller = new ScrollMagic.Controller({
                ...(scrollMagicOptions.controller || {}),
            });
            const penOption = scrollMagicOptions.pen;
            delete scrollMagicOptions.controller;
            delete scrollMagicOptions.pen;
            const sceneOptions = scrollMagicOptions || {};
            const triggerElement = sceneOptions.triggerElement ? (
                typeof sceneOptions.triggerElement === 'string'
                    ? document.querySelector(sceneOptions.triggerElement)
                    : sceneOptions.triggerElement
            ) : el;
            delete sceneOptions.triggerElement;
            const scene = new ScrollMagic.Scene({
                triggerElement,
                duration: '100%',
                triggerHook: 1,
                ...sceneOptions,
            });
            if (penOption) {
                const pen = penOption === true ? triggerElement : document.querySelector(penOption);
                scene.setPin(pen);
            }
            scene.on('progress', e => {
                    // @ts-ignore
                    instance.seek(e.progress * instance.duration);
                })
                // @ts-ignore
                // .setAnime(instance)
                .addTo(controller);
            void scene;
            delete options.onscroll;
            autoRun = false;
        }
        if (options.onhover) {
            $(el).on('mouseenter mouseleave', () => {
                run('alternate');
            });
            autoRun = false;
        }
        await loadingPromise;
        if (typeof options.onview !== 'undefined' && options.onview !== false) {
            const offset = typeof options.onview === 'number' ? options.onview : 0;
            const handler = () => {
                if (window.innerHeight > el.getBoundingClientRect().top - offset) {
                    window.removeEventListener('scroll', handler);
                    window.removeEventListener('resize', handler);
                    run();
                }
            };
            window.addEventListener('scroll', handler);
            window.addEventListener('resize', handler);
            handler();
            autoRun = false;
        }
        if (options.media) {
            const mediaArray = typeof options.media === 'string' ? [options.media] : options.media;
            /** @type {{ bp: string, type: 'min' | 'max' }[][]} */
            const mediaList = [];
            for (let i = 0; i < mediaArray.length; i++) {
                const bp = mediaArray[i];
                const group = i % 2 === 0 ? (mediaList[i / 2] = []) : mediaList[(i - 1) / 2];
                group.push({ bp, type: i % 2 === 0 ? 'min' : 'max' });
            }
            const mediaText = mediaList.map(mediaArray => '(' + mediaArray.map(({ bp, type }) => {
                const bpSize = breakpoints[bp] || 0;
                return `(${type}-width: ${type === 'max' ? bpSize - 1 : bpSize}px)`;
            }).join(' and ') + ')').join(' or ');
            // console.log('media', mediaArray, mediaList, mediaText);
            const media = matchMedia(mediaText);
            const update = () => {
                // console.log('media.matches', media.matches);
                run(media.matches ? "restart" : "reset");
            };
            media.onchange = update;
            update();
            autoRun = false;
        }
        if (autoRun) {
            run();
        }
    };

    /** @param {Element} el */
    const runDataAnime = async (el) => {
        /** @type {AnimeHelperRunOptions} */
        const options = parseDataAttr(el.getAttribute('data-anime') || '', dataAnimeAttrType);
        const targets = options.targets ? [...$(options.targets, el)] : el;
        Object.assign(options, { targets });
        /** @type {anime.AnimeTimelineInstance | anime.AnimeInstance} */
        let instance;
        if (options.timeline) {
            const timelineName = options.timeline;
            delete options.timeline;
            if (!timelines[timelineName]) {
                if (!timelinesPromises[timelineName]) {
                    timelinesPromises[timelineName] = new Promise(resolve => {
                        timelinesResolvers[timelineName] = resolve;
                    });
                }
                await timelinesPromises[timelineName];
            }
            instance = timelines[timelineName](el, options);
        } else {
            instance = anime(options);
        }
        instance.pause();
        // @ts-ignore
        el.animeInstance = instance;
        runHelper(el, options, instance);
    };

    /** @type {Record<string, AnimeTimelineHelperCallback>} */
    const timelines = {};

    /** @type {Record<string, Promise<AnimeTimelineHelperCallback>>} */
    const timelinesPromises = {};

    /** @type {Record<string, (value: AnimeTimelineHelperCallback) => void>} */
    const timelinesResolvers = {};

    /**
     *
     * @param {string} name
     * @param {AnimeTimelineHelperCallback} fn
     */
    const defineAnimeTimelineHelper = (name, fn) =>  {
        timelines[name] = fn;
        if (timelinesResolvers[name]) {
            timelinesResolvers[name](fn);
        }
    };

    Object.assign(window, { defineAnimeTimelineHelper });

    /** @param {Element} el */
    const runDataAnimeToggle = async (el) => {
        const toggleSelector = el.getAttribute('data-anime-toggle') || '';
        el.addEventListener('click', e => {
            e.preventDefault();
            const els = [...$(toggleSelector)];
            els.forEach(other => {
                /** @type {anime.AnimeTimelineInstance | anime.AnimeInstance} */
                // @ts-ignore
                const instance = other.animeTimelineInstance || other.animeInstance;
                if (!instance) return;
                runInstance(other, instance, 'alternate');
            });
        });
    };

    // Run all.
    dataAttrHelpers.watchDataAttr('data-anime', runDataAnime);
    dataAttrHelpers.watchDataAttr('data-anime-toggle', runDataAnimeToggle);
}
