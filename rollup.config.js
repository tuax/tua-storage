import buble from 'rollup-plugin-buble'
import eslint from 'rollup-plugin-eslint'
import uglify from 'rollup-plugin-uglify'

export default {
    input: 'src/storage.js',
    output: {
        file: 'dist/storage.js',
        name: 'TuaStorage',
        format: 'umd',
        exports: 'named',
    },
    plugins: [
        eslint(),
        buble({
            objectAssign: 'Object.assign',
        }),
        uglify(),
    ]
}
