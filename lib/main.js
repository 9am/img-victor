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
        }
        path {
            stroke: var(--victor-stroke, dimgray);
            stroke-width: var(--victor-stroke-width, 0.2%);
            stroke-linecap: var(--victor-stroke-linecap, round);
        }
        .loading {
            position: absolute;
            background-color: lightgray;
            width: 100%;
            height: 100%;
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
        <path id="path" fill="none" stroke="grey" stroke-width="2" stroke-linecap="round" />
    </svg>
`;


const getComponent = ({
    pool,
    e = 50e5,
    duration = 5000,
}) => class ImageVictor extends HTMLElement {
    static get observedAttributes() {
        return ['src', 'title'];
    }

    static loadImage(url = '') {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.crossOrigin = 'anonymous';
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
                    resolve(ctx.getImageData(0, 0, width, height));
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
                    this._img = await ImageVictor.loadImage(this.src);
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
        this._$path.style.strokeDasharray = len;
        this._$path.animate(
            [
                { strokeDashoffset: len },
                { strokeDashoffset: 0 },
            ],
            {
                duration: duration,
                // iterations: Infinity,
            },
        );
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
    duration = 5000,
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
            duration,
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
