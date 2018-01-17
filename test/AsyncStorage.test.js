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

describe('load', () => {
    test('reject when no data found and no sync fn', () => {
        const key = 'rejected by no data and no sync fn'
        const dataArr = [
            {
                key: 'item key to be loaded with syncFn',
                syncFn: () => Promise.resolve({ data: '+2h' })
            },
            { key },
        ]
        const targetKey = getTargetKey(key)

        return expect(tuaStorage.load(dataArr))
            .rejects.toThrow(JSON.stringify({ key: targetKey }))
    })
})

describe('remove', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        AsyncStorage.clear()
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
