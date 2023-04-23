<div align="center">
	<img src="https://user-images.githubusercontent.com/1435457/159866255-e15e4d8c-437d-48aa-a27e-a751cc02e7c2.svg" alt="img-victor" width="180" height="180" />
	<h1>&lt;img-victor&gt;</h1>
	<p>A web component converting &lt;img&gt; to SVG &lt;path&gt; with a drawing effect</p>
    <p>
        <a href="https://github.com/9am/img-victor/blob/main/LICENSE">
            <img alt="GitHub" src="https://img.shields.io/github/license/9am/img-victor?style=flat-square&color=success">
        </a>
        <a href="https://www.npmjs.com/package/@9am/img-victor">
            <img alt="npm" src="https://img.shields.io/npm/v/@9am/img-victor?style=flat-square&color=orange">
        </a>
        <a href="https://www.npmjs.com/package/@9am/img-victor">
            <img allt="npm" src="https://img.shields.io/npm/dt/@9am/img-victor?style=flat-square&color=blue">
        </a>
        <a href="https://bundlephobia.com/package/@9am/img-victor@latest">
            <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/@9am/img-victor?style=flat-square">
        </a>
    </p>
</div>

## Demo
<img src="https://user-images.githubusercontent.com/1435457/233823342-d76e050e-e52c-4270-9009-e67d6b91ff3a.gif" alt="img-victor-demo-manual" />

## Usage
1. Installation

	```
	npm install @9am/img-victor
	```
2. ESM

	```js
	import { register } from '@9am/img-victor';
	register({/* options */})

	// html
	<img-victor src="/img.png"></img-victor>
	```

## Documentation

### Attributes

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|`src`|{String}|**Required** if `data-src` unset|The image URL|
|`data-src`|{String}|**Required** if `src` unset|The lazy-loading `src`|
|`title`|{String}|`''`|For screen readers|
|`ratio`|{String}|`'1:1'`|`${width}:${height}` to prevent reflow before iamge loading|
|`manual`|{Boolean}|`false`|When `manual` is true, img-victor will not draw automatically, it could be done by toggle the className `active`|

### CSS property

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|`--victor-stroke`|css \<color>|`dimgray`|svg path stroke color|
|`--victor-stroke-width`|css \<length>|`0.3%`|svg path stroke width|
|`--victor-stroke-linecap`|`{butt\|round\|square\|inherit}`|`round`|svg path stroke linecap|
|`--victor-stroke-linejoin`|`{arcs\|bevel\|miter\|miter-clip\|round}`|`round`|svg path stroke linejoin |
|`--victor-duration`|`css <transition-duration>`|`3200ms`|transition duration|
|`--victor-timing-function`|`css <transition-timing-function>`|`ease-in-out`|transition timing function|
|`--victor-filter`|`css <filter>`|`custom brush`|path filter|

### Register Options

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|`tagName`|{String}|`img-victor`|Change tag name of the web component|
|`worker`|{Worker}|`LSD worker`|The worker plugin.</br>1. Write your own worker.js like:</br>```onmessage({ data:ImageData }) => postMessage([, groupOfLines])```</br>2. Using a faster version LSD worker, example can be found in `index.html`</br>*Notice: you need to bundle and serve `fastWorker.js` and  `fastWorker.wasm`.*|
|`poolSize`|{Number}|`2`|Worker pool size|

## Development
1. Install dependencies

	`npm install`
2. Install `emcc`

	[emscripten.org](https://emscripten.org/docs/getting_started/downloads.html)
3. Build worker

	`npm run build:all`
4. Start dev server

	`npm run dev`
5. Put images under `./demo/img`, replace image URL in `index.html`
6. Open `localhost:3000` in browser

## References
The LSD worker in this component is compiled from the C version of [LSD: a Line Segment Detector
Rafael Grompone von Gioi, Jérémie Jakubowicz, Jean-Michel Morel, Gregory Randall](http://www.ipol.im/pub/art/2012/gjmr-lsd/) by [Emscripten](https://emscripten.org/index.html).

## License
[MIT](LICENSE)
