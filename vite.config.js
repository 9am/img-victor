import path from 'path'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(
                dirname(fileURLToPath(import.meta.url)),
                'lib/main.js'
            ),
            name: 'img-victor',
            formats: ['es'],
            emitAssets: true,
        },
        rollupOptions: {
            output: {
                exports: 'named'
            }
        }
    },
    plugins: [
        viteStaticCopy({
            targets: [
                { src: './lib/workers/lsd/fastWorker.*', dest: './' }
            ]
        })
    ]
})
