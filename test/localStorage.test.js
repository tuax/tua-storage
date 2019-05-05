// @ts-check

import TuaStorage from '@/index'
import { DEFAULT_KEY_PREFIX } from '@/constants'
import {
    TIME_OUT,
    stringify,
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn,
} from './utils'

jest.spyOn(Storage.prototype, 'setItem')
jest.spyOn(Storage.prototype, 'getItem')
jest.spyOn(Storage.prototype, 'removeItem')

const key = 'common key'
const data = 'common data'
const syncParams = { a: 1, b: '2' }

const fakeVal = getExpectedValBySyncFn(data, -1)
const targetKey = getTargetKey(key, syncParams)

const tuaStorage = new TuaStorage({
    storageEngine: localStorage,
    defaultExpires: expireTime,
})

let cache = tuaStorage._cache
const store = localStorage

describe('timers', () => {
    jest.useFakeTimers()

    // 专门用于测试时间相关的实例
    const tuaStorage = new TuaStorage({
        storageEngine: localStorage,
    })
    let cache = tuaStorage._cache

    afterEach(() => {
        localStorage.clear()
        cache = tuaStorage._cache = {}
        Date.now = jest.fn(() => +new Date())
    })

    test('loadSync one exist expired item', () => {
        store[targetKey] = fakeVal
        const loadedData = tuaStorage.loadSync({ key, syncParams, isEnableCache: false })

        expect(loadedData).toBeUndefined()
    })

    test('setInterval to clean expired data', async () => {
        await tuaStorage.save([
            { key: `${key}1`, data, syncParams, expires: 10 },
            { key: `${key}2`, data, syncParams, expires: TIME_OUT * 1.5 / 1000 },
            { key: `${key}3`, data, syncParams, expires: TIME_OUT * 2.5 / 1000 },
        ])

        Date.now = jest.fn(() => TIME_OUT + (+new Date()))
        jest.advanceTimersByTime(TIME_OUT)

        // 因为删除是异步操作
        setImmediate(() => {
            expect(getObjLen(cache)).toBe(2)
            expect(store.size).toBe(2)
            expect(cache[getTargetKey(`${key}1`)]).toBeUndefined()
        })

        Date.now = jest.fn(() => TIME_OUT * 2 + (+new Date()))
        jest.advanceTimersByTime(TIME_OUT * 2)

        // 因为删除是异步操作
        setImmediate(() => {
            expect(getObjLen(cache)).toBe(1)
            expect(store.size).toBe(1)
        })
    })
})

describe('initial state', () => {
    afterEach(() => {
        localStorage.clear()
        cache = tuaStorage._cache = {}
    })

    test('clean initial expired data', async () => {
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}1`, getExpectedVal(data, -10))
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}2`, stringify({}))
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}3`, 'abc')
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}4`, getExpectedVal(data, 10))

        await tuaStorage._clearExpiredData()

        expect(getObjLen(store)).toBe(3)
        expect(store[`${DEFAULT_KEY_PREFIX}1`]).toBeUndefined()
    })

    test('disable auto clean initial expired data', () => {
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}1`, getExpectedVal(data, -10))
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}2`, stringify({}))
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}3`, 'abc')
        localStorage.setItem(`${DEFAULT_KEY_PREFIX}4`, getExpectedVal(data, 10))

        /* eslint-disable no-new */
        new TuaStorage({
            storageEngine: localStorage,
            isEnableAutoClear: false,
        })

        expect(getObjLen(store)).toBe(4)
        expect(store[`${DEFAULT_KEY_PREFIX}1`]).toBeDefined()
    })

    test('clear items not match prefix', async () => {
        localStorage.setItem('b', '666')
        localStorage.setItem('steve', '1217')
        localStorage.setItem(DEFAULT_KEY_PREFIX, '666')

        await tuaStorage.clear(['steve', DEFAULT_KEY_PREFIX])

        expect(getObjLen(store)).toBe(2)
        expect(store['steve']).toBe('1217')
        expect(store[DEFAULT_KEY_PREFIX]).toBe('666')
    })
})

describe('async methods', () => {
    afterEach(() => {
        localStorage.clear()
        cache = tuaStorage._cache = {}
    })

    test('never save data which is destined to expired', async () => {
        await tuaStorage.save({ key, data, syncParams, expires: 0 })

        expect(getObjLen(cache)).toBe(0)
        expect(getObjLen(store)).toBe(0)
    })

    test('concurrent load one inexistent item with syncFn', async () => {
        const itemTobeLoaded = {
            key,
            syncFn: () => Promise.resolve({ data }),
        }
        const targetKey = getTargetKey(itemTobeLoaded.key)
        const expectedVal = getExpectedValBySyncFn(data)

        const loadedItems = await Promise.all([
            tuaStorage.load(itemTobeLoaded),
            tuaStorage.load(itemTobeLoaded),
            tuaStorage.load(itemTobeLoaded),
        ])

        loadedItems.forEach(({ code, data: loadedData }) => {
            expect(code).toBe(0)
            expect(loadedData).toBe(data)
        })

        // cache
        expect(getObjLen(cache)).toBe(1)
        expect(stringify(cache[targetKey])).toBe(expectedVal)

        // storage
        expect(getObjLen(store)).toBe(1)
        expect(store[targetKey]).toBe(expectedVal)
        expect(localStorage.setItem).toBeCalledWith(targetKey, expectedVal)

        expect(localStorage.setItem).toHaveBeenCalledTimes(1)
    })

    test('syncFn fail', () => {
        const promise = tuaStorage.load({
            key: 'inexistent data',
            syncFn: () => Promise.reject(Error(data)),
        })

        expect(promise).rejects.toThrowError(data)
    })

    test('load some exist items with one key and disable cache', async () => {
        const dataArr = [
            { key, data: '+1s', expires: 10, isEnableCache: false },
            { key, data: 1217, isEnableCache: false },
            { key, data, isEnableCache: false },
        ]
        const targetKey = getTargetKey(key)
        const expectedVal = getExpectedVal(data)

        await tuaStorage.save(dataArr)
        const loadedItems = await tuaStorage.load(dataArr)

        loadedItems.forEach((loadedItem) => {
            // load function returns rawData
            expect(loadedItem).toBe(data)

            // cache
            expect(getObjLen(cache)).toBe(0)
            expect(stringify(cache[targetKey])).toBeUndefined()

            // storage
            expect(getObjLen(store)).toBe(1)
            expect(store[targetKey]).toBe(expectedVal)
            expect(localStorage.setItem).lastCalledWith(targetKey, expectedVal)
        })
    })

    test('remove some undefined items', async () => {
        const keyArr = ['item key1', 'item key2', 'item key3']
        const targetKey = getTargetKey(key)
        const expectedVal = getExpectedVal(data)

        await tuaStorage.save({ key, data })
        await tuaStorage.remove(keyArr)

        // cache
        expect(getObjLen(cache)).toBe(1)
        expect(stringify(cache[targetKey])).toBe(expectedVal)

        // storage
        expect(getObjLen(store)).toBe(1)
        expect(store[targetKey]).toBe(expectedVal)
        expect(localStorage.setItem).toBeCalledWith(targetKey, expectedVal)
        keyArr
            .map(getTargetKey)
            .forEach((targetKey) => {
                expect(localStorage.removeItem).toBeCalledWith(targetKey)
            })
    })

    test('clear some items by whiteList', async () => {
        const kdArr = [
            { key: 'cmm-1', data: 'string' },
            { key: 'cmm-2', data: 1217 },
            { key: 'cmm-3', data: null },
            { key: 'cmm-4', data: undefined },
            { key: 'cmm-5', data: { yo: 1, hey: { 876: 123 } } },
        ]
        const whiteList = ['3', '4', '5']
        const expectedValues = kdArr.map(({ data }) => getExpectedVal(data))

        await Promise.all(kdArr.map(tuaStorage.save.bind(tuaStorage)))
        await tuaStorage.clear(whiteList)

        kdArr.forEach(({ key }, idx) => {
            const targetKey = getTargetKey(key)
            const expectedVal = expectedValues[idx]
            const isInWhiteList = whiteList
                .some(targetKey.includes.bind(targetKey))

            // cache
            expect(getObjLen(cache)).toBe(whiteList.length)
            isInWhiteList
                ? expect(stringify(cache[targetKey])).toBe(expectedVal)
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

    test('get storage info', async () => {
        await tuaStorage.save({ key, data })
        const { keys } = await tuaStorage.getInfo()

        expect(keys).toEqual([`TUA_STORAGE_PREFIX: ${key}`])
    })
})

describe('sync methods', () => {
    afterEach(() => {
        localStorage.clear()
        cache = tuaStorage._cache = {}
    })

    test('never save data which is destined to expired', () => {
        tuaStorage.saveSync({ key, data, syncParams, expires: 0 })

        expect(getObjLen(cache)).toBe(0)
        expect(store.length).toBe(0)
    })

    test('load some exist items with one key and disable cache', () => {
        const dataArr = [
            { key, data: '+1s', expires: 10, isEnableCache: false },
            { key, data: 1217, isEnableCache: false },
            { key, data, isEnableCache: false },
        ]
        const targetKey = getTargetKey(key)
        const expectedVal = getExpectedVal(data)
        tuaStorage.saveSync(dataArr)
        const loadedItems = tuaStorage.loadSync(dataArr)

        loadedItems.map((loadedItem) => {
            // load function returns rawData
            expect(loadedItem).toBe(data)

            // cache
            expect(getObjLen(cache)).toBe(0)
            expect(stringify(cache[targetKey])).toBeUndefined()

            // storage
            expect(store.length).toBe(1)
            expect(store[targetKey]).toBe(expectedVal)
        })
    })

    test('remove some undefined items', () => {
        const keyArr = ['item key1', 'item key2', 'item key3']
        const targetKey = getTargetKey(key)
        const expectedVal = getExpectedVal(data)

        tuaStorage.saveSync({ key, data })
        tuaStorage.removeSync(keyArr)

        // cache
        expect(getObjLen(cache)).toBe(1)
        expect(stringify(cache[targetKey])).toBe(expectedVal)

        // storage
        expect(store.length).toBe(1)
        expect(store[targetKey]).toBe(expectedVal)
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
        const expectedValues = kdArr.map(({ data }) => getExpectedVal(data))
        kdArr.map(tuaStorage.saveSync.bind(tuaStorage))
        tuaStorage.clearSync(whiteList)

        kdArr.map(({ key }, idx) => {
            const targetKey = getTargetKey(key)
            const expectedVal = expectedValues[idx]
            const isInWhiteList = whiteList
                .some(targetKey.includes.bind(targetKey))

            // cache
            expect(getObjLen(cache)).toBe(whiteList.length)
            isInWhiteList
                ? expect(stringify(cache[targetKey])).toBe(expectedVal)
                : expect(cache[targetKey]).toBeUndefined()

            // storage
            expect(store.length).toBe(whiteList.length)

            if (isInWhiteList) {
                expect(store[targetKey]).toBe(expectedVal)
            } else {
                expect(store[targetKey]).toBeUndefined()
            }
        })
    })

    test('get storage info', () => {
        const { keys } = tuaStorage.getInfoSync()

        expect(keys).toEqual([])
    })
})
