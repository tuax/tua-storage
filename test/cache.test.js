import TuaStorage from '@/index'
import { ERROR_MSGS, DEFAULT_EXPIRES } from '@/constants'
import {
    TIME_OUT,
    stringify,
    getObjLen,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn,
} from './utils'

const tuaStorage = new TuaStorage()

const key = 'common key'
const data = 'common data'
const syncFn = () => Promise.resolve(data)
const fullKey = 'common fullKey'
const syncParams = { a: 1, b: '2' }

const fakeVal = getExpectedValBySyncFn(data, -1)
const targetKey = getTargetKey(key, syncParams)

let cache = tuaStorage._cache

describe('timers', () => {
    jest.useFakeTimers()

    // 专门用于测试时间相关的实例
    const tuaStorage = new TuaStorage({ storageEngine: {} })
    let cache = tuaStorage._cache

    afterEach(() => {
        cache = tuaStorage._cache = {}
        Date.now = jest.fn(() => +new Date())
    })

    test('setInterval to clean expired data', async () => {
        await tuaStorage.save([
            { key: `${key}1`, data, syncParams, expires: 10 },
            { key: `${key}2`, data, syncParams, expires: TIME_OUT * 1.5 / 1000 },
            { key: `${key}3`, data, syncParams, expires: TIME_OUT * 2.5 / 1000 },
        ])

        Date.now = jest.fn(() => TIME_OUT + (+new Date()))
        jest.advanceTimersByTime(TIME_OUT)

        // 清除内存中的数据是同步操作
        expect(getObjLen(cache)).toBe(2)
        expect(cache[getTargetKey(`${key}1`)]).toBeUndefined()

        Date.now = jest.fn(() => TIME_OUT * 2 + (+new Date()))
        jest.advanceTimersByTime(TIME_OUT * 2)

        expect(getObjLen(cache)).toBe(1)
    })

    test('save and load one item which will never expire', async () => {
        await tuaStorage.save({ key, data, syncParams, expires: null })
        const loadedData = await new Promise((resolve) => {
            Date.now = jest.fn(() => TIME_OUT + (+new Date()))
            const callback = () => resolve(tuaStorage.load({ key, syncParams }))

            setTimeout(callback, TIME_OUT)
            jest.advanceTimersByTime(TIME_OUT)
        })

        expect(loadedData).toBe(data)
        expect(getObjLen(cache)).toBe(1)
        expect(cache[targetKey].rawData).toBe(data)
    })

    test('saveSync and loadSync one item which will never expire', () => {
        tuaStorage.saveSync({ key, data, syncParams, expires: null })

        Date.now = jest.fn(() => TIME_OUT + (+new Date()))
        setTimeout(timeoutFn, TIME_OUT)
        jest.advanceTimersByTime(TIME_OUT)

        function timeoutFn () {
            const loadedData = tuaStorage.loadSync({ key, syncParams })

            expect(loadedData).toBe(data)
            expect(getObjLen(cache)).toBe(1)
            expect(cache[targetKey].rawData).toBe(data)
        }
    })

    test('save and load one expired item without syncFn', async () => {
        const str = stringify({ key: targetKey })
        await tuaStorage.save({ key, data, syncParams })
        const promise = new Promise((resolve) => {
            Date.now = jest.fn(() => TIME_OUT + (+new Date()))
            const callback = () => resolve(tuaStorage.load({ key, syncParams }))

            setTimeout(callback, TIME_OUT)
            jest.advanceTimersByTime(TIME_OUT)
        })

        expect(promise).rejects.toEqual(Error(str))
    })

    test('save and load one exist expired item with syncFn', async () => {
        await tuaStorage.save({ key, data, syncParams })
        const loadedData = await new Promise((resolve) => {
            Date.now = jest.fn(() => TIME_OUT + (+new Date()))
            const callback = () => resolve(tuaStorage.load({ key, syncParams, syncFn }))

            setTimeout(callback, TIME_OUT)
            jest.advanceTimersByTime(TIME_OUT)
        })

        expect(loadedData.data).toBe(data)
        expect(getObjLen(cache)).toBe(1)
        expect(cache[targetKey].rawData.data).toBe(data)
    })
})

describe('error handling', () => {
    const str = stringify({ key: targetKey })

    afterEach(() => {
        cache = tuaStorage._cache = {}
    })

    test('load one expired item without syncFn', () => {
        tuaStorage._cache[targetKey] = fakeVal
        const promise = tuaStorage.load({ key, syncParams })

        expect(promise).rejects.toEqual(Error(str))
    })

    test('save/load/remove one item without key or fullKey', () => {
        expect(tuaStorage.save()).rejects.toEqual(Error(ERROR_MSGS.key))
        expect(tuaStorage.load({})).rejects.toEqual(Error(ERROR_MSGS.key))
        expect(tuaStorage.remove()).rejects.toEqual(Error(ERROR_MSGS.key))
    })

    test('no data found and no syncFn', () => {
        const str = stringify({ key: getTargetKey(key) })
        const syncFn = () => Promise.resolve({ data: '+2h' })
        const dataArr = [
            { key: 'item key1', syncFn },
            { key: 'item key2', syncFn },
            { key },
        ]

        expect(tuaStorage.load(dataArr)).rejects.toEqual(Error(str))
    })

    test('syncFn does not return a promise', () => {
        const promise = tuaStorage.load({
            key,
            data: '1217',
            syncParams,
            syncFn: () => {},
        })

        expect(promise).rejects.toEqual(Error(ERROR_MSGS.promise))
    })
})

describe('async methods', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
    })

    describe('save only', () => {
        test('never save data which is destined to expired', async () => {
            await tuaStorage.save({ key, data, syncParams, expires: 0 })

            expect(getObjLen(cache)).toBe(0)
        })
    })

    describe('load only', () => {
        describe('syncOptions', () => {
            const syncFn = (...args) => Promise.resolve(args)

            test('should pass syncOptions', async () => {
                const syncOptions = 'syncOptions'
                const params = { key, syncFn, syncOptions }
                const { data } = await tuaStorage.load(params)

                expect(data.length).toBe(2)
                expect(data[1]).toBe(syncOptions)
            })

            test('should apply syncOptions when it is an array', async () => {
                const syncOptions = [1, 2, 3]
                const params = { key, syncFn, syncOptions }
                const { data } = await tuaStorage.load(params)

                expect(data.length).toBe(syncOptions.length + 1)
                expect(data.slice(1)).toEqual(syncOptions)
            })
        })

        test('force update data when isForceUpdate is true', async () => {
            const syncFn = () => Promise.resolve('force update data')
            await tuaStorage.load({ key, syncFn, expires: 999, syncParams })
            const loadedData = await tuaStorage.load({ key, syncFn, syncParams, isForceUpdate: true })

            expect(loadedData.data).toBe('force update data')
            expect(getObjLen(cache)).toBe(1)
            expect(cache[targetKey].rawData.data).toBe('force update data')
        })

        test('load one exist expired item with syncFn', async () => {
            tuaStorage._cache[targetKey] = fakeVal
            const loadedData = await tuaStorage.load({ key, syncFn, syncParams })

            expect(loadedData.data).toBe(data)
            expect(getObjLen(cache)).toBe(1)
            expect(cache[targetKey].rawData.data).toBe(data)
        })

        test('load inexistent items with syncFn and non-zero code', async () => {
            const syncFn = () => Promise.resolve({ code: 66, data })
            const dataArr = [
                { key: 'item key1', syncFn },
                { key: 'item key2', syncFn },
            ]
            const loadedItems = await tuaStorage.load(dataArr)

            loadedItems.forEach(({ code, data: loadedData }, idx) => {
                const targetKey = getTargetKey(dataArr[idx].key)

                expect(code).toBe(66)
                expect(loadedData).toBe(data)
                expect(getObjLen(cache)).toBe(0)
                expect(stringify(cache[targetKey])).toBeUndefined()
            })
        })

        test('load data except code/data', async () => {
            const msg = 'this is msg'
            const syncFn = () => Promise.resolve({ code: 1, data, msg })
            const loadedData = await tuaStorage.load({ key, syncFn })

            expect(loadedData.code).toBe(1)
            expect(loadedData.data).toEqual(data)
            expect(loadedData.msg).toEqual(msg)
        })
    })

    describe('remove and clear only', () => {
        test('clear all items', async () => {
            const kdArr = [
                { key: 'cmm-1', data: 'string' },
                { key: 'cmm-2', data: 1217 },
                { key: 'cmm-3', data: null },
                { key: 'cmm-4', data: undefined },
                { key: 'cmm-5', data: { yo: 1, hey: { 876: 123 } } },
            ]

            await Promise.all(kdArr.map(tuaStorage.save.bind(tuaStorage)))
            await tuaStorage.clear()

            expect(getObjLen(cache)).toBe(0)
            kdArr
                .map(({ key }) => cache[getTargetKey(key)])
                .forEach(val => expect(val).toBeUndefined())
        })
    })

    describe('mixed', () => {
        test('save, load and remove one item with fullKey', async () => {
            const expectedVal = getExpectedVal(data, DEFAULT_EXPIRES)

            await Promise.all([
                tuaStorage.save({ key: fullKey, data }),
                tuaStorage.save({ fullKey, data }),
            ])
            await tuaStorage.load({ fullKey })

            expect(stringify(cache[fullKey])).toBe(expectedVal)

            await tuaStorage.remove({ fullKey })

            expect(cache[fullKey]).toBeUndefined()
            expect(getObjLen(cache)).toBe(1)
            expect(stringify(cache[getTargetKey(fullKey)])).toBe(expectedVal)
        })

        test('save and remove all exist items', async () => {
            const kdArr = [
                { key: 'brmm-1', data: 'string' },
                { key: 'brmm-2', data: 1217 },
                { key: 'brmm-3', data: null },
                { key: 'brmm-4', data: undefined },
                { key: 'brmm-5', data: { yo: 1, hey: { 876: 123 } } },
            ]
            const keyArr = kdArr.map(({ key }) => key)

            await tuaStorage.save(kdArr)
            await tuaStorage.remove(keyArr)

            expect(getObjLen(cache)).toBe(0)
            kdArr
                .map(({ key }) => cache[getTargetKey(key)])
                .forEach(val => expect(val).toBeUndefined())
        })

        test('get storage info', async () => {
            await tuaStorage.save({ key, data })
            const { keys } = await tuaStorage.getInfo()

            expect(keys).toEqual([`TUA_STORAGE_PREFIX: ${key}`])
        })
    })
})

describe('sync methods', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
    })

    test('loadSync one exist expired item', () => {
        tuaStorage._cache[targetKey] = fakeVal

        const cacheData = tuaStorage.loadSync({ key, syncParams })
        const loadedData = tuaStorage.loadSync({ key, syncParams, isEnableCache: false })

        expect(cacheData).toBeUndefined()
        expect(loadedData).toBeUndefined()
    })

    test('never save data which is destined to expired', () => {
        tuaStorage.saveSync({ key, data, syncParams, expires: 0 })

        expect(getObjLen(cache)).toBe(0)
    })

    test('load some exist items with one key and disable cache', () => {
        const dataArr = [
            { fullKey: 'cache key', data, isEnableCache: true },
            { key, data: '+1s', expires: 10, isEnableCache: false },
            { key, data: 1217, isEnableCache: false },
            { key, data, isEnableCache: false },
        ]
        const targetKey = getTargetKey(key)
        const expectedVal = getExpectedVal(data, 30)
        tuaStorage.saveSync(dataArr)
        const [loadedItem, ...rest] = tuaStorage.loadSync(dataArr)

        expect(loadedItem).toBe(data)
        expect(rest).toEqual([undefined, undefined, undefined])
        expect(getObjLen(cache)).toBe(1)
        expect(stringify(cache[targetKey])).toBeUndefined()
        expect(stringify(cache['cache key'])).toEqual(expectedVal)
    })

    test('remove some undefined items', () => {
        const keyArr = ['item key1', 'item key2', 'item key3']
        const targetKey = getTargetKey(key)
        const expectedVal = getExpectedVal(data, 30)
        tuaStorage.saveSync({ key, data })
        tuaStorage.removeSync(keyArr)

        expect(getObjLen(cache)).toBe(1)
        expect(stringify(cache[targetKey])).toBe(expectedVal)
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
        const expectedValues = kdArr.map(({ data }) => getExpectedVal(data, 30))
        kdArr.map(({ key, data }) => tuaStorage.saveSync({ key, data }))
        tuaStorage.clearSync(whiteList)

        kdArr.map(({ key }, idx) => {
            const targetKey = getTargetKey(key)
            const expectedVal = expectedValues[idx]
            const isInWhiteList = whiteList
                .some(targetKey.includes.bind(targetKey))

            expect(getObjLen(cache)).toBe(whiteList.length)
            isInWhiteList
                ? expect(stringify(cache[targetKey])).toBe(expectedVal)
                : expect(cache[targetKey]).toBeUndefined()
        })
    })

    test('get storage info sync', () => {
        tuaStorage.saveSync({ key, data })

        const { keys } = tuaStorage.getInfoSync()

        expect(keys).toEqual([`TUA_STORAGE_PREFIX: ${key}`])
    })
})
