'use strict';

class Carousel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    get src() {
        return this.getAttribute('src').split(',');
    }

    set src(arr) {
        this.setAttribute('src', arr.join(','));
    }

    get size() {
        return this.src.length;
    }

    get interval() {
        return this.getAttribute('interval');
    }

    set interval(interval) {
        this.setAttribute('interval', interval);
    }

    stop() {
        try {
            clearInterval(this.intervalId);
        } catch (e) {
        }
    }

    start(interval = 10000) {
        if (interval < 1000)
            interval = 1000;
        let i = 0;
        const images = this.images;
        const len = images.length;
        this.intervalId = setInterval(() => {
            images[i].classList.toggle('active');
            i = (i + 1) % len;
            images[i].classList.toggle('active');
        }, interval);
    }

    restart(interval) {
        this.stop();
        init(this);
        this.start(interval);
    }

    connectedCallback() {
        init(this);
        this.start(this.interval);
    }

    push(newSource) {
        const src = this.src;
        src.push(newSource);
        this.src = newSource;
    }

    shift() {
        const src = this.src;
        src.shift();
        this.src = src;
    }

    attributeChanged() {
        this.restart(this.interval);
    }
}


function init(el) {
    const elStyle = el.style;
    const h = elStyle.height === '' ? '100px' : elStyle.height;
    const w = elStyle.width === '' ? '50px' : elStyle.width;
    const bgc = elStyle.backgroundColor === '' ? 'black' : elStyle.backgroundColor;
    const sources = this.src;

    el.shadowRoot.innerHTML = '';

    el.shadowRoot.innerHTML = `
        <style>
            .carousel { 
                position: relative;
                display: inline-block;
                height: ${h};
                width: ${w};
                overflow: hidden;
                background-color: ${bgc};
            }
            .carousel-item {
                position: absolute;
                max-height: ${h};
                width: inherit;
                line-height: ${h};
                left: ${w};
                transition-duration: 1s;
                transition-timing-function: ease-in;
                background-color: inherit;
            }
            .carousel-img {
               width: inherit;
               vertical-align: middle;
            }
            .active {
                left: 0;
                z-index: 1;
                transition-duration: 1s;
                transition-timing-function: ease-out;
            }
        </style>
    `;

    const wrapper = document.createElement('div');
    wrapper.classList.add('carousel');
    el.shadowRoot.appendChild(wrapper);

    const frg = document.createDocumentFragment();
    el.images = sources.map((src, index) => {
        const div = document.createElement('div');
        div.classList.add('carousel-item');

        const img = document.createElement('img');
        img.src = src;
        img.classList.add('carousel-img');

        if (index === 0) div.classList.add('active');
        div.appendChild(img);
        frg.appendChild(div);

        return div;
    });

    wrapper.appendChild(frg);
}

customElements.define('img-carousel', Carousel);