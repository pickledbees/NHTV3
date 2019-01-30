'use strict';

//Standard Cycler
//Iterates over the set of items in a circular fashion
    function Cycler() {
        this.items = [];
        const that = this;
        this._counter = (function*() {
            let i = -1;
            let reset;
            while (true) {
                if (reset)
                    i = -1;
                i = (i + 1) % that.items.length;
                reset = yield i;
            }
        })()
    }
    Cycler.prototype.getItem = function(reset) {
        const index = this._counter.next(reset).value;
        return this.items[index];
    };


//Pages Cycler - swaps the src of the frame to different pages.
//A page is represented by a {src: 'url', delay: time in milliseconds} json.
    function PagesCycler(frame) {
        Cycler.call(this);
        this.frame = frame;
    }

    PagesCycler.prototype = {
        constructor: PagesCycler,

        set pages (pages) {
            this.items = pages;
        },

        get pages () {
            return this.items;
        },

        stop: function () {
            clearTimeout(this._tid);
        },

        cycle: function (reset) {
            clearTimeout(this._tid);
            const item = this.getItem(reset);
            const {src, delay} = item;
            this.frame.src = src;
            this._tid = setTimeout(this.cycle.bind(this), delay);
        },

        restart: function () {
            this.cycle(true);
        }
    };
    Object.setPrototypeOf(PagesCycler.prototype, Cycler.prototype);


//Fixed Cycler
    function FixedCycler(element, delay) {
        Cycler.call(this);
        this.element = element;
        this.delay = delay;
    }

    FixedCycler.prototype = {
        constructor: FixedCycler,

        stop: function () {
            clearInterval(this._tid);
        },

        cycle: function (reset) {
            this.stop();
            this._tid = setInterval(() => {
                const item = this.getItem(reset);
                this._update(item);
            }, this.delay);
        },

        _update: function (item) {
            console.log(item);
            //To be implemented by extending class
        },

        restart: function () {
            this.cycle(true);
        }
    };
    Object.setPrototypeOf(FixedCycler.prototype, Cycler.prototype);


//Text Cycler
    function TextCycler(element, delay) {
        FixedCycler.call(this, element, delay);
    }
    TextCycler.prototype = {
        constructor: TextCycler,

        _update(item) {
            this.element.innerText = item;
        }
    };
    Object.setPrototypeOf(TextCycler.prototype, FixedCycler.prototype);


//Image Cycler
    function ImgCycler(img, delay) {
        FixedCycler.call(this, img, delay);
    }
    ImgCycler.prototype = {
        constructor: ImgCycler,

        _update(item) {
            this.element.src = item;
        }
    };
    Object.setPrototypeOf(ImgCycler.prototype, FixedCycler.prototype);


//HTML Cycler
    function HTMLCycler(img, delay) {
        FixedCycler.call(this, img, delay);
    }
    HTMLCycler.prototype = {
        constructor: HTMLCycler,

        _update(item) {
            this.element.innerHTML = item;
        }
    };
    Object.setPrototypeOf(HTMLCycler.prototype, FixedCycler.prototype);





