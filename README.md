<div align="center">
	<img src="https://user-images.githubusercontent.com/1435457/159866255-e15e4d8c-437d-48aa-a27e-a751cc02e7c2.svg" alt="img-victor" width="180" height="180" />
	<h1>&lt;img-victor&gt;</h1>
	<p>a web component converting &lt;img&gt; to SVG &lt;path&gt; with a drawing effect</p>
</div>

## Demo
<img src="https://user-images.githubusercontent.com/1435457/159872173-1cafc5ed-24e7-4ff7-8e2f-ee4232a40719.gif" alt="img-victor-demo" />

## Usage
1. Installation

	```
	npm install @9am/img-victor
	```
2. ESM

	```js
	import { register } from '@9am/img-victor';
	register({})
	```
	or try it with skypack without installation

	```
	import { register } from 'https://cdn.skypack.dev/@9am/img-victor';
	register({})
	```

3. HTML

	```html
	<img-victor src="/url.png"></img-victor>
	```

## API
1. < img-victor > attributes

	|Name|Type|Default|Description|
	|:--:|:--:|:-----:|:----------|
	|`src`|{String}|**Required**|The image URL|
	|`title`|{String}|`''`|For screen readers|
2. < img-victor > css custom property

	|Name|Type|Default|Description|
	|:--:|:--:|:-----:|:----------|
	|`--victor-stroke`|css \<color>|`dimgray`|svg path stroke color|
	|`--victor-stroke-width`|css \<length>|`0.2%`|svg path stroke width|
	|`--victor-stroke-linecap`|`{butt|round|square|inherit}`|`round`|svg path stroke linecap|
3. register options

	|Name|Type|Default|Description|
	|:--:|:--:|:-----:|:----------|
	|`tagName`|{String}|`img-victor`|Change tag name of the web component|
	|`worker`|{Worker}|`LSD worker`|The worker plugin.</br>1. Write your own worker.js like:</br>```onmessage({ data:ImageData }) => postMessage([, groupOfLines])```</br>2. Using a faster version LSD worker, example can be found in `index.html`</br>*Notice: you need to bundle and serve `fastWorker.js` and  `fastWorker.wasm`.*|
	|`poolSize`|{Number}|`2`|Worker pool size|
	|`duration`|{Number}|`5000`|Drawing animation duration in ms|

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

## Testing
TBD

## References
The LSD worker in this component is compiled from the C version of [LSD: a Line Segment Detector
Rafael Grompone von Gioi, Jérémie Jakubowicz, Jean-Michel Morel, Gregory Randall](http://www.ipol.im/pub/art/2012/gjmr-lsd/) by [Emscripten](https://emscripten.org/index.html).

## License
[MIT](LICENSE)
