import Storage, { MSG_KEY } from '../src/storage'
import { DEFAULT_KEY_PREFIX } from '../src/utils'
import {
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn,
} from './utils'

const key = 'common key'
const data = 'common data'
const fullKey = 'common fullKey'
const syncParams = { a: 1, b: '2' }

const targetKey = getTargetKey(key, syncParams)

const tuaStorage = new Storage({
    storageEngine: localStorage,
    defaultExpires: expireTime,
})

let cache = tuaStorage._cache
let store = localStorage.__STORE__

describe('initial state', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
        localStorage.clear()
        store = localStorage.__STORE__
    })

    test('feat[8.2]: clean initial expired data', () => {
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}1`, getExpectedVal(data, -10))
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}2`, JSON.stringify({}))
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}3`, 'abc')
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}4`, getExpectedVal(data, 10))

        return tuaStorage._clearExpiredData()
            .then(() => {
                expect(getObjLen(store)).toBe(3)
                expect(store[`${DEFAULT_KEY_PREFIX}1`]).toBeUndefined()
            })
    })

    test('clear items not match prefix', () => {
        localStorage.setItem('b', '666')
        localStorage.setItem('steve', '1217')
        localStorage.setItem(DEFAULT_KEY_PREFIX, '666')

        return tuaStorage.clear(['steve', DEFAULT_KEY_PREFIX])
            .then(() => {
                expect(getObjLen(store)).toBe(2)
                expect(store['steve']).toBe('1217')
                expect(store[DEFAULT_KEY_PREFIX]).toBe('666')
            })
    })
})

describe('advanced features', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
        localStorage.clear()
        store = localStorage.__STORE__
    })

    test('feat[7]: concurrent load one inexistent item with syncFn', () => {
        const itemTobeLoaded = {
            key,
            syncFn: () => Promise.resolve({ data }),
        }
        const targetKey = getTargetKey(itemTobeLoaded.key)
        const expectedVal = getExpectedValBySyncFn(data)

        return Promise.all([
            tuaStorage.load(itemTobeLoaded),
            tuaStorage.load(itemTobeLoaded),
            tuaStorage.load(itemTobeLoaded),
        ]).then((loadedItems) => {
            loadedItems.map(({ code, data: loadedData }) => {
                expect(code).toBe(0)
                expect(loadedData).toBe(data)
            })

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
    afterEach(() => {
        cache = tuaStorage._cache = {}
        localStorage.clear()
        store = localStorage.__STORE__
    })

    test('feat[8.1]: never save data which is destined to expired', () => (
        tuaStorage
            .save({ key, data, syncParams, expires: 0 })
            .then(() => {
                expect(getObjLen(cache)).toBe(0)
                expect(getObjLen(store)).toBe(0)
            })
    ))

    test('load some exist items with one key and disable cache', () => {
        const dataArr = [
            { key, data: '+1s', expires: 10, isEnableCache: false },
            { key, data: 1217, isEnableCache: false },
            { key, data, isEnableCache: false },
        ]
        const targetKey = getTargetKey(key)
        const expectedVal = getExpectedVal(data)

        return tuaStorage
            .save(dataArr)
            .then(() => tuaStorage.load(dataArr))
            .then((loadedItems) => {
                loadedItems.map((loadedItem) => {
                    // load function returns rawData
                    expect(loadedItem).toBe(data)

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
        const keyArr = ['item key1', 'item key2', 'item key3']
        const targetKey = getTargetKey(key)
        const expectedVal = getExpectedVal(data)

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.remove(keyArr))
            .then(() => {
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
        const expectedVals = kdArr.map(({ data }) => getExpectedVal(data))

        return Promise
            .all(kdArr.map(({ key, data }) => tuaStorage.save({ key, data })))
            .then(() => tuaStorage.clear(whiteList))
            .then(() => {
                kdArr.map(({ key, data }, idx) => {
                    const deltaLen = kdArr.length - whiteList.length
                    const targetKey = getTargetKey(key)
                    const expectedVal = expectedVals[idx]
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
