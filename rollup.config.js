// @ts-check

import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import { eslint } from 'rollup-plugin-eslint'
import { terser } from 'rollup-plugin-terser'

import { DEFAULT_EXTENSIONS } from '@babel/core'

const pkg = require('./package.json')

const banner =
`/**
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * @license ${pkg.license}
 */
`

const extensions = [...DEFAULT_EXTENSIONS, 'ts', 'tsx']
const configMap = {
    cjs: {
        file: pkg.main,
        format: 'cjs',
        exports: 'named',
    },
    esm: {
        file: pkg.module,
        format: 'esm',
    },
    umdDev: {
        file: pkg.main,
        format: 'umd',
        env: 'development',
    },
    umdProd: {
        file: `dist/tua-storage.umd.min.js`,
        format: 'umd',
        env: 'production',
    },
    esmBrowserDev: {
        env: 'development',
        file: 'dist/tua-storage.esm.browser.js',
        format: 'esm',
    },
    esmBrowserProd: {
        env: 'production',
        file: 'dist/tua-storage.esm.browser.min.js',
        format: 'esm',
    },
}

const genConfig = (opts) => {
    const isProd = /min\.js$/.test(opts.file)

    const config = {
        input: 'src/index.js',
        plugins: [eslint({ include: '**/*.js' }), json()],
        output: {
            file: opts.file,
            name: 'TuaStorage',
            banner,
            format: opts.format,
        },
    }

    if (opts.env) {
        config.plugins.push(replace({
            'process.env.NODE_ENV': JSON.stringify(opts.env),
        }))
    }
    if (opts.transpile !== false) {
        config.plugins.push(babel({ extensions }))
    }

    if (isProd) {
        config.plugins.push(terser({
            output: {
                /* eslint-disable */
                ascii_only: true,
            },
        }))
    }

    return config
}

export default Object.keys(configMap)
    .map(key => configMap[key])
    .map(genConfig)
