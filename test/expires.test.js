import Storage from '../src/storage'
import {
    getObjLen,
    getTargetKey,
} from './utils'

const tuaStorage = new Storage({
    storageEngine: {},
    defaultExpires: -1,
})

describe('defaultExpires 0', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
    })

    test('feat[1.4]: save and load one item which will never expire', () => {
        const key = 'item never expire'
        const data = '1217'
        const syncParams = { a: 1, b: '2' }

        return tuaStorage
            .save({ key, data, syncParams, expires: null })
            .then(() => new Promise((resolve) => (
                setTimeout(() =>
                    resolve(tuaStorage.load({ key, syncParams })
                ),
                0
            )
            )))
            .then((loadedData) => {
                const cache = tuaStorage._cache
                const targetKey = getTargetKey(key, syncParams)

                expect(loadedData).toBe(data)
                expect(getObjLen(cache)).toBe(1)
                expect(cache[targetKey].rawData).toBe(data)
            })
    })

    test('load one expired item without syncFn', () => {
        const key = 'item to be loaded without syncFn'
        const data = 'item from without syncFn'
        const syncParams = { a: 1, b: '9' }
        const targetKey = getTargetKey(key, syncParams)

        const loadExpiredItemWithoutSyncFn = tuaStorage
            .save({ key, data, syncParams, expires: -1 })
            .then(() => new Promise((resolve) => setTimeout(
                () => resolve(tuaStorage.load({ key, syncParams })),
                0
            )))

        return expect(loadExpiredItemWithoutSyncFn)
            .rejects.toThrow(JSON.stringify({ key: targetKey }))
    })

    test('load one exist expired item with syncFn', () => {
        const key = 'item to be loaded with syncFn'
        const data = 'item from syncFn'
        const syncParams = { a: 1, b: '2' }

        return tuaStorage
            .save({ key, data, syncParams, expires: -1 })
            .then(() => new Promise((resolve) => setTimeout(() =>
                resolve(tuaStorage.load({
                    key,
                    syncParams,
                    syncFn: () => Promise.resolve(data),
                })),
                0
            )))
            .then((loadedData) => {
                const cache = tuaStorage._cache
                const targetKey = getTargetKey(key, syncParams)

                expect(loadedData.data).toBe(data)
                expect(getObjLen(cache)).toBe(1)
                expect(cache[targetKey].rawData.data).toBe(data)
            })
    })
})
