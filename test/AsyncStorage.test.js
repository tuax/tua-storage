import AsyncStorageCls from 'mock-async-storage'

import Storage from '../src/storage'
import {
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn,
} from './utils'

const AsyncStorage = new AsyncStorageCls()

const tuaStorage = new Storage({
    storageEngine: AsyncStorage,
    defaultExpires: expireTime,
})

describe('save/load/remove', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        AsyncStorage.clear()
    })

    test('load one exist item without cache', () => {
        const key = 'item to be loaded without cache'
        const data = 'item from AsyncStorage'

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.load({ key, isEnableCache: false }))
            .then((loadedData) => {
                // load function returns rawData
                expect(loadedData).toBe(data)

                const cache = tuaStorage._cache
                const store = AsyncStorage.getStore()
                const targetKey = getTargetKey(key)
                const expectedVal = getExpectedVal(data)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(store.size).toBe(1)
                expect(JSON.stringify(store.get(targetKey))).toBe(expectedVal)
            })
    })

    test('remove some undefined items', () => {
        const key = 'key to be saved'
        const data = 'item to be removed'
        const keyArr = ['item key1', 'item key2', 'item key3']

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.remove(keyArr))
            .then(() => {
                const cache = tuaStorage._cache
                const store = AsyncStorage.getStore()
                const targetKey = getTargetKey(key)
                const expectedVal = getExpectedVal(data)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(store.size).toBe(1)
                expect(JSON.stringify(store.get(targetKey))).toBe(expectedVal)
            })
    })
})
