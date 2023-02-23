import Pool from './pool.js';

const createWorker = async () => {
    const slowWorker = await import('./workers/lsd/slowWorker.js?raw');
    return new Worker(
        URL.createObjectURL(
            new Blob([slowWorker.default], { type: 'application/script' })
        )
    );
};

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: inline-block;
            position: relative;
            font-size: 0;
            overflow: hidden;
            --victor-stroke: dimgray;
            --victor-stroke-width: 0.3%;
            --victor-stroke-linecap: round;
            --victor-stroke-linejoin: round;
            --victor-duration: 3200ms;
            --victor-timing-function: ease-in-out;
            --victor-filter: url(#brush);
        }
        @media (hover) {
            :host(:hover) #img {
                filter: opacity(1) brightness(1) blur(0);
            }
            :host(.active:hover) #path.ready {
                stroke-dashoffset: var(--dashoffset);
            }
        }
        #svg {
            position: absolute;
            z-index: 1;
            --dasharray: 0;
            --dashoffset: 0;
        }
        #path {
            will-change: stroke-dashoffset;
            fill: none;
            stroke: var(--victor-stroke);
            stroke-width: var(--victor-stroke-width);
            stroke-linecap: var(--victor-stroke-linecap);
            stroke-linejoin: var(--victor-stroke-linejoin);
            stroke-dasharray: var(--dasharray);
            stroke-dashoffset: var(--dashoffset);
            filter: var(--victor-filter);
        }
        #path.ready {
            transition: stroke-dashoffset var(--victor-duration) var(--victor-timing-function);
        }
        :host(.active) #path.ready {
            stroke-dashoffset: 0;
        }
        :host(:not(.active)) #path.ready {
            stroke-dashoffset: var(--dashoffset);
        }
        #img {
            width: 100%;
            height: 100%;
            object-position: center;
            object-fit: contain;
            will-change: filter;
            filter: opacity(0) brightness(20) blur(4px);
            transition: filter var(--victor-duration) var(--victor-timing-function);
        }
        :host(.loading)::before {
            display: block;
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
            background-color: lightgray;
        }
        :host(.loading)::after {
            display: block;
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 3;
            transform: translateX(-100%);
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            animation: loading 1.2s infinite;
        }
        @keyframes loading {
            100% {
                transform: translateX(100%);
            }
        }
    </style>
    <svg id="svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" role="img" aria-labelledby="title">
        <defs>
            <filter id="brush">
                <feTurbulence
                    baseFrequency="0.08"
                    numOctaves="2"
                    seed="2"
                    result="turbulence"
                />
                <feDisplacementMap
                    in="SourceGraphic"
                    in2="turbulence"
                    scale="6"
                />
            </filter>
        </defs>
        <title id="title"></title>
        <path id="path" />
    </svg>
    <image id="img" src="" part="img" crossorigin="anonymous" />
`;

const getComponent = ({ pool, e = 50e5 }) =>
    class ImageVictor extends HTMLElement {
        #svg;
        #img;
        #path;
        #title;
        #imgData;
        #dList;
        #io;

        static loadImage(url = '') {
            return new Promise((resolve, reject) => {
                let img = new Image();
                img.crossOrigin = 'anonymous';
                img.id = 'img';
                img.part = 'img';
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d', { alpha: false });
                        const scale = Math.round(Math.sqrt(e / img.width / img.height));
                        const width = img.width * scale;
                        const height = img.height * scale;
                        ctx.imageSmoothingEnabled = false;
                        canvas.width = width;
                        canvas.height = height;
                        ctx.filter = 'grayscale(1)';
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve({
                            img,
                            imgData: ctx.getImageData(0, 0, width, height),
                        });
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = (error) => reject(error);
                img.src = url;
            });
        }

        static get observedAttributes() {
            return ['src', 'title'];
        }

        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            this.#svg = this.shadowRoot.querySelector('#svg');
            this.#img = this.shadowRoot.querySelector('#img');
            this.#path = this.shadowRoot.querySelector('#path');
            this.#title = this.shadowRoot.querySelector('#title');
            this.#imgData = {};
            this.#dList = [];
            this.#preserveRatio();
        }

        async attributeChangedCallback(name, prev, next) {
            if (prev === next) {
                return;
            }
            switch (name) {
                case 'src': {
                    if (!this.src) {
                        break;
                    }
                    try {
                        this.shadowRoot.host.classList.add('loading');
                        this.#preserveRatio();
                        const { img, imgData } = await ImageVictor.loadImage(this.src);
                        this.#img.parentNode.replaceChild(img, this.#img);
                        this.#img = img;
                        this.#imgData = imgData;
                        await this.#renderPath();
                    } finally {
                        this.shadowRoot.host.classList.remove('loading');
                    }
                    break;
                }
                case 'title':
                    this.#title.textContent = this.title;
                    break;
                default:
                    break;
            }
        }

        #preserveRatio() {
            const [width, height] = this.ratio?.split(':') || [];
            if (width && height) {
                this.#img.setAttribute(
                    'src',
                    `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"%3E%3C/svg%3E`
                );
            }
        }

        async #renderPath() {
            if (!this.#imgData.data) {
                return;
            }
            const [lines, groups] = await pool.addTask(this.#imgData);
            this.#dList = groups.map(
                (group) =>
                    'M' +
                    group
                        .map(
                            ([x1, y1, x2, y2]) =>
                                `${x1 | 0},${y1 | 0} L${x2 | 0},${y2 | 0} `
                        )
                        .join('L')
            );
            this.#path.setAttribute('d', this.#dList.join(''));
            this.#svg.setAttribute(
                'viewBox',
                `0 0 ${this.#imgData.width} ${this.#imgData.height}`
            );
            this.draw();
        }

        draw() {
            const len = Math.max.apply(
                null,
                this.#dList.map((d) => {
                    const ele = document.createElementNS(
                        'http://www.w3.org/2000/svg',
                        'path'
                    );
                    ele.setAttribute('d', d);
                    return ele.getTotalLength();
                })
            );
            this.#path.classList.remove('ready');
            this.#svg.style.setProperty('--dasharray', len);
            this.#svg.style.setProperty('--dashoffset', len);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.#path.classList.add('ready');
                });
            });
        }

        get src() {
            return this.getAttribute('src');
        }

        set src(val = '') {
            this.setAttribute('src', val);
        }

        get title() {
            return this.getAttribute('title');
        }

        set title(val = '') {
            this.setAttribute('title', val);
        }

        get ratio() {
            return this.getAttribute('ratio');
        }

        set ratio(val = '') {
            this.setAttribute('ratio', val);
        }

        get manual() {
            return this.hasAttribute('manual');
        }

        set manual(val = false) {
            if (val) {
                this.setAttribute('maual', '');
            } else {
                this.removeAttribute('maual');
            }
        }

        connectedCallback() {
            if (!this.src) {
                this.src = '';
            }

            this.#io = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const visible = entry.intersectionRatio > 0;
                        if (visible) {
                            entry.target.src =
                                entry.target.dataset?.src || entry.target.src;
                        }
                        if (!this.manual) {
                            entry.target.classList.toggle('active', visible);
                        }
                    });
                },
                {
                    threshold: [0.0, 0.5],
                }
            );
            this.#io.observe(this.shadowRoot.host);
        }

        disconnectedCallback() {
            this.#io.unobserve(this.shadowRoot.host);
            this.#io = null;
            this.#svg = null;
            this.#img.onload = null;
            this.#img.onerror = null;
            this.#img = null;
            this.#path = null;
            this.#title = null;
            this.#imgData = null;
            this.#dList = null;
        }
    };

class Fallback extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        const svg = this.shadowRoot.querySelector('#svg');
        const img = document.createElement('img');
        Array.from(this.attributes).forEach(({ name, value }) => {
            img.setAttribute(name, value);
        });
        svg.replaceWith(img);
    }
}

export const register = async ({
    worker = createWorker,
    poolSize = 2,
    tagName = 'img-victor',
}) => {
    try {
        const pool = new Pool({
            worker,
            size:
                window.navigator.hardwareConcurrency &&
                window.navigator.hardwareConcurrency > 1
                    ? Math.max(1, poolSize)
                    : 1,
        });
        const Component = getComponent({
            pool,
        });
        window.customElements.define(tagName, Component);
    } catch (err) {
        window.customElements.define(tagName, Fallback);
    }
};

export default null;
