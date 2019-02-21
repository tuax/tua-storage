import { createLocalVue } from '@vue/test-utils'

import TuaStorage from '@/index'
import { getObjLen } from './utils'

describe('vue-plugin', () => {
    test('should have an install method', () => {
        expect(typeof TuaStorage.install).toBe('function')
    })

    test('should have an install method', () => {
        const localVue = createLocalVue()
        localVue.use(TuaStorage)

        expect(localVue.prototype.$tuaStorage instanceof TuaStorage).toBe(true)
    })

    test('should works fine', () => {
        const localVue = createLocalVue()
        localVue.use(TuaStorage)

        const cache = localVue.prototype.$tuaStorage._cache
        expect(getObjLen(cache)).toBe(0)

        const params = { key: 'key', data: 'data' }
        localVue.prototype.$tuaStorage.saveSync(params)
        expect(getObjLen(cache)).toBe(1)
    })
})
