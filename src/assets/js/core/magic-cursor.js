// @ts-check
const { UCCursor, UCMagnetic } = (() => {
    const $ = typeof jQuery !== 'undefined' ? jQuery : /** @type {typeof jQuery} */(undefined);
    class UCCursor {
        constructor(options) {
            this.options = $.extend(true, {
                container: "body:not(.disable-cursor), enable-cursor",
                speed: 0.7,
                ease: "expo.out",
                visibleTimeout: 300,
                stickForce: 0,
                stickMagneticForce: 0.3
            }, options);
            this.body = $(this.options.container);
            this.el = $('<div class="uc-cursor"></div>');
            this.text = $('<div class="uc-cursor-text"></div>');
            this.stickForce = this.options.stickForce;
            this.pos = { x: 0, y: 0 };
            /** @type {false | { x: number, y: number }} */
            this.stick = false;
            this.visible = false;
            this.init();
        }
        init() {
            this.el.append(this.text);
            this.body.append(this.el);
            this.bind();
            this.move(-window.innerWidth, -window.innerHeight, 0);
        }
        bind() {
            const self = this;
            function onMouseEnterCursorStick() {
                self.setStick($(this));
            }
            function onMouseLeaveCursorStick() {
                self.removeStick();
            }
            this.body
                .on("mouseleave", function () {
                    self.hide();
                })
                .on("mouseenter", function () {
                    self.show();
                })
                .on("mousemove", function (e) {
                    self.pos = {
                        x: self.stick ? self.stick.x - (self.stick.x - e.clientX) * self.stickForce : e.clientX,
                        y: self.stick ? self.stick.y - (self.stick.y - e.clientY) * self.stickForce : e.clientY
                    };
                    self.update();
                })
                .on("mousedown", function () {
                    self.setState("active");
                })
                .on("mouseup", function () {
                    self.removeState("active");
                })
                .on("mouseenter", "a,input,textarea,button", function () {
                    self.setState("pointer");
                })
                .on("mouseleave", "a,input,textarea,button", function () {
                    self.removeState("pointer");
                })
                .on("mouseenter", "iframe", function () {
                    self.hide();
                })
                .on("mouseleave", "iframe", function () {
                    self.show();
                })
                .on("mouseenter", "[data-uc-cursor]", function () {
                    if (this.getAttribute("data-uc-cursor")) {
                        self.setState(this.dataset.ucCursor);
                    } else {
                        self.setState('default');
                    }
                })
                .on("mouseleave", "[data-uc-cursor]", function () {
                    if (this.getAttribute("data-uc-cursor")) {
                        self.removeState(this.dataset.ucCursor);
                    } else {
                        self.removeState('default');
                    }
                })
                .on("mouseenter", "[data-uc-cursor-text]", function () {
                    self.setText(this.dataset.ucCursorText);
                })
                .on("mouseleave", "[data-uc-cursor-text]", function () {
                    self.removeText();
                })
                .on("mouseenter", "[data-uc-cursor-icon]", function () {
                    self.setText(`<i class="${this.dataset.ucCursorIcon}"></i>`);
                })
                .on("mouseleave", "[data-uc-cursor-icon]", function () {
                    self.removeText();
                })
                .on("mouseenter", "[data-uc-cursor-stick]", function () {
                    self.setStick($(this).find(this.dataset.ucCursorStick));
                    $(this)
                        .on("mouseenter", this.dataset.ucCursorStick, onMouseEnterCursorStick)
                        .on("mouseleave", this.dataset.ucCursorStick, onMouseLeaveCursorStick);
                })
                .on("mouseleave", "[data-uc-cursor-stick]", function () {
                    self.removeStick();
                    $(this)
                        .off("mouseenter", this.dataset.ucCursorStick, onMouseEnterCursorStick)
                        .off("mouseleave", this.dataset.ucCursorStick, onMouseLeaveCursorStick);
                });
        }
        setState(state) {
            this.el.addClass(state);
        }
        removeState(state) {
            this.el.removeClass(state);
        }
        toggleState(state) {
            this.el.toggleClass(state);
        }
        setText(text) {
            this.text.html(text);
            this.el.addClass("text");
        }
        removeText() {
            this.el.removeClass("text");
        }
        /**
         * @param {HTMLElement | JQuery<HTMLElement>} el 
         */
        setStick(el) {
            const self = this;
            const $targets = $(el);
            let minDistance = Infinity, minStick = null;
            for (const target of $targets) {
                const bound = target.getBoundingClientRect();
                const width = $(target).width() || 0, height = $(target).height() || 0;
                const stick = { y: bound.top + height / 2, x: bound.left + width / 2 };
                const dist = (self.pos.x - stick.x)**2 + (self.pos.y - stick.y)**2;
                if (dist > minDistance) continue;
                minStick = stick;
                minDistance = dist;
            }
            if (!minStick) return;
            this.stick = minStick;
            this.move(this.stick.x, this.stick.y, 5);
        }
        removeStick() {
            this.stick = false;
        }
        update() {
            this.move();
            this.show();
        }
        move(x, y, duration) {
            gsap.to(this.el, {
                x: x || this.pos.x,
                y: y || this.pos.y,
                force3D: true,
                overwrite: true,
                ease: this.options.ease,
                duration: this.visible ? duration || this.options.speed : 0
            });
        }
        show() {
            const _this2 = this;
            if (this.visible) return;
            clearInterval(this.visibleInt);
            this.el.addClass("visible");
            this.visibleInt = setTimeout(function () {
                return (_this2.visible = true);
            });
        }
        hide() {
            const _this3 = this;
            clearInterval(this.visibleInt);
            this.el.removeClass("visible");
            this.visibleInt = setTimeout(function () {
                return (_this3.visible = false);
            }, this.options.visibleTimeout);
        }
    }
        
    class UCMagnetic {
        /**
         * @param {Element} el 
         * @param {UCCursor} cursor 
         */
        constructor(el, cursor) {
            const options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            this.cursor = cursor;
            this.el = $(el);
            this.options = $.extend(true, { y: 0.4, x: 0.4, s: 0.3, rs: 0.5}, this.el.data("magnetic") || options);
            this.y = 0;
            this.x = 0;
            this.width = 0;
            this.height = 0;
            if (this.el.data("magnetic-init"))
                return;
            this.el.data("magnetic-init", true);
            this.bind();
        }
        bind() {
            const _this = this;
            this.el.on("mouseenter", function (e) {
                const offset = _this.el.offset() || { top: 0, left: 0 };
                _this.y = offset.top - window.pageYOffset;
                _this.x = offset.left - window.pageXOffset;
                _this.width = _this.el.outerWidth() || 0;
                _this.height = _this.el.outerHeight() || 0;
                _this.cursor.stickForce = _this.cursor.options.stickMagneticForce;
                const y = (e.clientY - _this.y - _this.height / 2) * _this.options.y;
                const x = (e.clientX - _this.x - _this.width / 2) * _this.options.x;
                _this.move(x, y, _this.options.s);
            });
            this.el.on("mousemove", function (e) {
                const y = (e.clientY - _this.y - _this.height / 2) * _this.options.y;
                const x = (e.clientX - _this.x - _this.width / 2) * _this.options.x;
                _this.move(x, y, _this.options.s);
            });
            this.el.on("mouseleave", function (e) {
                _this.move(0, 0, _this.options.rs);
                _this.cursor.stickForce = _this.cursor.options.stickForce;
            });
        }
        move(x, y, speed) {
            gsap.to(this.el, { y: y, x: x, force3D: true, overwrite: true, duration: speed });
        }
    }
    
    const isMobile = function () {
        // @ts-ignore
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || $(window).width() <= 1024) {
            $('body').addClass("disable-cursor");
            return true
        }
        return false
    };

    if (!isMobile() || !$('body').hasClass("disable-cursor")) {

        const cursor = new UCCursor({
            container: "body:not(.disable-cursor), .enable-cursor",
            visibleTimeout: 0
        });
    
        $("[data-uc-magnetic]").each(function () {
            const $elements = this.dataset.ucMagnetic ? $(this).find(this.dataset.ucMagnetic) : $(this);
            $elements.each(function () {
                new UCMagnetic(this, cursor);
            });
        });

    }

    return { UCCursor, UCMagnetic };
})();