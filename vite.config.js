const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'lib/main.js'),
            name: 'img-victor',
            fileName: (format) => `img-victor.${format}.js`,
            emitAssets: true,
        },
        rollupOptions: {
            output: {
                exports: 'named'
            }
        }
    },
})
