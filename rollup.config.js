import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import { eslint } from 'rollup-plugin-eslint'
import { uglify } from 'rollup-plugin-uglify'

import pkg from './package.json'

const input = `src/index.js`
const banner = `/* ${pkg.name} version ${pkg.version} */`

const output = {
    cjs: {
        file: pkg.main,
        banner,
        format: 'cjs',
        exports: 'named',
    },
    esm: {
        file: pkg.module,
        banner,
        format: 'esm',
    },
    umd: {
        file: pkg.unpkg,
        name: 'TuaStorage',
        banner,
        format: 'umd',
        exports: 'named',
    },
}
const plugins = [
    eslint(),
    json(),
    babel(),
]
const env = 'process.env.NODE_ENV'

export default [{
    input,
    output: [ output.cjs, output.esm ],
    plugins,
}, {
    input,
    output: output.umd,
    plugins: [
        ...plugins,
        replace({ [env]: '"development"' }),
    ],
}, {
    input,
    output: {
        ...output.umd,
        file: 'dist/TuaStorage.umd.min.js',
    },
    plugins: [
        ...plugins,
        replace({ [env]: '"production"' }),
        uglify(),
    ],
}]
