import Storage, { MSG_KEY, DEFAULT_EXPIRES } from '../src/storage'
import {
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn,
} from './utils'

const tuaStorage = new Storage({
    storageEngine: {}
})

describe('save', () => {
    test('save one item and enable cache', () => {
        const key = 'save one item'
        const data = 'item'
        const targetKey = getTargetKey(key)

        return tuaStorage
            .save({ key, data })
            .then(() => {
                const cache = tuaStorage._cache
                const expectedVal = getExpectedVal(data, DEFAULT_EXPIRES)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)
            })
    })
})


