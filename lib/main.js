import Pool from './pool.js';

const createWorker = async () => {
    const slowWorker = await import('./workers/lsd/slowWorker.js?raw');
    return new Worker(
        URL.createObjectURL(new Blob(
            [slowWorker.default],
            {type: 'application/script'},
        )),
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
            --victor-img-filter: opacity(0) brightness(20) blur(4px);
            --victor-img-hover-filter: opacity(1) brightness(1) blur(0);
            --victor-transition: 3200ms ease-in-out;
        }
        :host(:hover) img {
            filter: var(--victor-img-hover-filter);
        }
        :host(:hover) path {
            stroke-dashoffset: var(--dashoffset);
        }
        svg {
            position: relative;
            z-index: 1;
            --dasharray: 0;
            --dashoffset: 0;
        }
        path {
            will-change: stroke-dashoffset;
            fill: none;
            stroke: var(--victor-stroke);
            stroke-width: var(--victor-stroke-width);
            stroke-linecap: var(--victor-stroke-linecap);
            stroke-linejoin: var(--victor-stroke-linejoin);
            stroke-dasharray: var(--dasharray);
            stroke-dashoffset: var(--dashoffset);
        }
        path.ready {
            stroke-dashoffset: 0;
            transition: stroke-dashoffset var(--victor-transition);
        }
        img {
            will-change: filter;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            left: 0;
            width: 100%;
            z-index: 0;
            filter: var(--victor-img-filter);
            transition: filter var(--victor-transition);
        }
        .loading {
            position: absolute;
            background-color: lightgray;
            width: 100%;
            height: 100%;
            z-index: 2;
        }
        .loading::after {
            display: block;
            content: "";
            position: absolute;
            width: 100%;
            height: 100%;
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
    <section id="loading"></section>
    <svg id="svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" role="img" aria-labelledby="title">
        <title id="title"></title>
        <path id="path" />
    </svg>
    <img id="img" />
`;


const getComponent = ({
    pool,
    e = 50e5,
}) => class ImageVictor extends HTMLElement {
    static get observedAttributes() {
        return ['src', 'title'];
    }

    static loadImage(url = '') {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.crossOrigin = 'anonymous';
            img.id = 'img';
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
            img.onerror = error => reject(error);
            img.src = url;
        });
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._$svg = this.shadowRoot.querySelector('#svg');
        this._$img = this.shadowRoot.querySelector('#img');
        this._$path = this.shadowRoot.querySelector('#path');
        this._$loading = this.shadowRoot.querySelector('#loading');
        this._$title = this.shadowRoot.querySelector('#title');
        this._img = {};
        this._dList = [];
    }

    async attributeChangedCallback(name, prev, next) {
        if (prev === next) {
            return;
        }
        switch (name) {
            case 'src':
                if (!this.src) {
                    break;
                }
                try {
                    this._$loading.className = 'loading';
                    const { img, imgData } = await ImageVictor.loadImage(this.src);
                    this._$img.parentNode.replaceChild(img, this._$img);
                    this._$img = img;
                    this._img = imgData;
                    await this._renderPath();
                } finally {
                    this._$loading.className = '';
                }
                break;
            case 'title':
                this._renderTitle();
                break;
            default:
                break;
        }
    }

    _renderTitle() {
        this._$title.textContent = this.title;
    }

    async _renderPath() {
        if (!this._img.data) {
            return;
        }
        const [lines, groups] = await pool.addTask(this._img);
        this._dList = groups.map(
            group => 'M' + group.map(([x1, y1, x2, y2]) => `${x1},${y1} L${x2},${y2} `).join('L'),
        );
        this._$path.setAttribute('d', this._dList.join(''));
        this._$svg.setAttribute('viewBox', `0 0 ${this._img.width} ${this._img.height}`);
        this.draw();
    }

    draw() {
        const len = Math.max.apply(null, this._dList.map(
            d => {
                const ele = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                ele.setAttribute('d', d);
                return ele.getTotalLength();
            },
        ));
        this._$path.classList.remove('ready');
        this._$svg.style.setProperty('--dasharray', len);
        this._$svg.style.setProperty('--dashoffset', len);
        this._$path.getBoundingClientRect();
        this._$path.classList.add('ready');
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

    connectedCallback() {
        if (!this.hasAttribute('src')) {
            this.setAttribute('src', '');
        }
    }

    disconnectedCallback() {
        this._$svg = null;
        this._$path = null;
        this._$loading = null;
        this._$title = null;
        this._$img = null;
        this._img = null;
        this._dList = null;
    }
}

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
            size: window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency > 1
                ? Math.max(1, poolSize)
                : 1,
        });
        const Component = getComponent({
            pool,
        });
        window.customElements.define(
            tagName,
            Component,
        );
    } catch (err) {
        window.customElements.define(
            tagName,
            Fallback,
        );
    }
};

export default null;
