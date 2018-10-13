import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import { eslint } from 'rollup-plugin-eslint'

export default {
    input: 'src/storage.js',
    output: [{
        file: 'dist/umd.js',
        name: 'TuaStorage',
        format: 'umd',
        exports: 'named',
    }, {
        file: 'dist/es.js',
        format: 'es',
    }],
    plugins: [
        eslint(),
        json(),
        babel(),
    ],
}
