import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import { eslint } from 'rollup-plugin-eslint'
import { uglify } from 'rollup-plugin-uglify'

const output = {
    es: {
        file: 'dist/TuaStorage.es.js',
        format: 'es',
    },
    umd: {
        file: 'dist/TuaStorage.umd.js',
        name: 'TuaStorage',
        format: 'umd',
        exports: 'named',
    },
}
const plugins = [
    eslint(),
    json(),
    babel(),
]

export default [{
    input: 'src/index.js',
    output: [ output.es, output.umd ],
    plugins,
}, {
    input: 'src/index.js',
    output: {
        ...output.umd,
        file: 'dist/TuaStorage.umd.min.js',
    },
    plugins: [ ...plugins, uglify() ],
}]

