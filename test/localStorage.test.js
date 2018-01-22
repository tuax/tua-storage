import Storage, { MSG_KEY } from '../src/storage'
import {
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn,
} from './utils'

const tuaStorage = new Storage({
    storageEngine: localStorage,
    defaultExpires: expireTime,
})

describe('advanced features', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        localStorage.__STORE__ = {}
    })

    test('feat[1.6]: concurrent load one inexistent item with syncFn', () => {
        const data = '1217'
        const itemTobeLoaded = {
            key: 'item key to be loaded with syncFn',
            syncFn: () => Promise.resolve({ data }),
        }
        const targetKey = getTargetKey(itemTobeLoaded.key)

        return Promise.all([
            tuaStorage.load(itemTobeLoaded),
            tuaStorage.load(itemTobeLoaded),
            tuaStorage.load(itemTobeLoaded),
        ]).then((loadedItems) => {
            const cache = tuaStorage._cache
            const store = localStorage.__STORE__

            loadedItems.map(({ code, data: loadedData }) => {
                expect(code).toBe(0)
                expect(loadedData).toBe(data)
            })

            const expectedVal = getExpectedValBySyncFn(data)

            // cache
            expect(getObjLen(cache)).toBe(1)
            expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

            // storage
            expect(getObjLen(store)).toBe(1)
            expect(store[targetKey]).toBe(expectedVal)
            expect(localStorage.setItem).toBeCalledWith(targetKey, expectedVal)

            expect(localStorage.setItem).toHaveBeenCalledTimes(1)
        })
    })
})

describe('save/load/clear/remove', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        localStorage.__STORE__ = {}
    })

    test('load some exist items with one key and disable cache', () => {
        const key = 'item to be loaded without cache'
        const data = 'item from localStorage'
        const dataArr = [
            { key, data: '+1s', expires: 10, isEnableCache: false },
            { key, data: 1217, isEnableCache: false },
            { key, data, isEnableCache: false },
        ]

        return tuaStorage
            .save(dataArr)
            .then(() => tuaStorage.load(dataArr))
            .then((loadedItems) => {
                const cache = tuaStorage._cache
                const store = localStorage.__STORE__

                loadedItems.map((loadedItem) => {
                    // load function returns rawData
                    expect(loadedItem).toBe(data)
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)

                    // cache
                    expect(getObjLen(cache)).toBe(0)
                    expect(JSON.stringify(cache[targetKey])).toBeUndefined()

                    // storage
                    expect(getObjLen(store)).toBe(1)
                    expect(store[targetKey]).toBe(expectedVal)
                    expect(localStorage.setItem).lastCalledWith(targetKey, expectedVal)
                })
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
                const store = localStorage.__STORE__
                const targetKey = getTargetKey(key)
                const expectedVal = getExpectedVal(data)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(getObjLen(store)).toBe(1)
                expect(store[targetKey]).toBe(expectedVal)
                expect(localStorage.setItem).toBeCalledWith(targetKey, expectedVal)
                keyArr.forEach(key =>
                    expect(localStorage.removeItem).toBeCalledWith(getTargetKey(key))
                )
            })
    })

    test('clear some items by whiteList', () => {
        const kdArr = [
            { key: 'cmm-1', data: 'string' },
            { key: 'cmm-2', data: 1217 },
            { key: 'cmm-3', data: null },
            { key: 'cmm-4', data: undefined },
            { key: 'cmm-5', data: { yo: 1, hey: { 876: 123 } } },
        ]
        const whiteList = ['3', '4', '5']

        return Promise
            .all(kdArr.map(({ key, data }) => tuaStorage.save({ key, data })))
            .then(() => tuaStorage.clear(whiteList))
            .then(() => {
                const cache = tuaStorage._cache
                const store = localStorage.__STORE__

                kdArr.map(({ key, data }) => {
                    const deltaLen = kdArr.length - whiteList.length
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)
                    const isInWhiteList = whiteList
                        .some(targetKey.includes.bind(targetKey))

                    // cache
                    expect(getObjLen(cache)).toBe(whiteList.length)
                    isInWhiteList
                        ? expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)
                        : expect(cache[targetKey]).toBeUndefined()

                    // storage
                    expect(getObjLen(store)).toBe(whiteList.length)
                    expect(localStorage.setItem).toBeCalledWith(targetKey, expectedVal)

                    if (isInWhiteList) {
                        expect(store[targetKey]).toBe(expectedVal)
                    } else {
                        expect(store[targetKey]).toBeUndefined()
                        expect(localStorage.removeItem).toBeCalledWith(targetKey)
                    }
                })
            })
    })
})