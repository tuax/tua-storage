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

describe('load', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        localStorage.__STORE__ = {}
    })

    test('load one exist expired item with syncFn', () => {
        const key = 'item to be loaded with syncFn'
        const data = 'item from syncFn'
        const syncParams = { a: 1, b: '2' }

        return tuaStorage
            .save({ key, data, syncParams, expires: 0 })
            .then(() => new Promise((resolve) => setTimeout(() =>
                resolve(tuaStorage.load({
                    key,
                    syncParams,
                    syncFn: () => Promise.resolve(data)
                })),
                1000
            )))
            .then((loadedData) => {
                const cache = tuaStorage._cache
                const store = localStorage.__STORE__
                const targetKey = getTargetKey(key, syncParams)
                const expectedVal = getExpectedValBySyncFn(data)
                const { rawData: { data: storeData } } = JSON.parse(store[targetKey])

                expect(loadedData.data).toBe(data)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(cache[targetKey].rawData.data).toBe(data)

                // storage
                expect(storeData).toBe(data)
                expect(getObjLen(store)).toBe(1)
            })
    })

    test('load one exist expired item without syncFn', () => {
        const key = 'item to be loaded without syncFn'
        const data = 'item from without syncFn'
        const syncParams = { a: 1, b: '2' }
        const targetKey = getTargetKey(key, syncParams)

        const loadExpiredItemWithoutSyncFn = tuaStorage
            .save({ key, data, syncParams, expires: 0 })
            .then(() => new Promise((resolve) => setTimeout(() =>
                resolve(tuaStorage.load({ key, syncParams })),
                1000
            )))

        return expect(loadExpiredItemWithoutSyncFn)
            .rejects.toThrow(JSON.stringify({ key: targetKey }))
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
})

describe('remove', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        localStorage.__STORE__ = {}
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
})

describe('clear', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        localStorage.__STORE__ = {}
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
