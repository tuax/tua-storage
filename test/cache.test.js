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

    test('setInterval to clean expired data', () => (
        tuaStorage
            .save([
                { key: `${key}1`, data, syncParams, expires: 10 },
                { key: `${key}2`, data, syncParams, expires: TIME_OUT * 1.5 / 1000 },
                { key: `${key}3`, data, syncParams, expires: TIME_OUT * 2.5 / 1000 },
            ])
            .then(() => {
                Date.now = jest.fn(() => TIME_OUT + (+new Date()))
                jest.advanceTimersByTime(TIME_OUT)

                // 清除内存中的数据是同步操作
                expect(getObjLen(cache)).toBe(2)
                expect(cache[getTargetKey(`${key}1`)]).toBeUndefined()

                Date.now = jest.fn(() => TIME_OUT * 2 + (+new Date()))
                jest.advanceTimersByTime(TIME_OUT * 2)

                expect(getObjLen(cache)).toBe(1)
            })
    ))

    test('save and load one item which will never expire', () => (
        tuaStorage
            .save({ key, data, syncParams, expires: null })
            .then(() => new Promise((resolve) => {
                Date.now = jest.fn(() => TIME_OUT + (+new Date()))

                setTimeout(
                    () => resolve(tuaStorage.load({ key, syncParams })),
                    TIME_OUT
                )

                jest.advanceTimersByTime(TIME_OUT)
            }))
            .then((loadedData) => {
                expect(loadedData).toBe(data)
                expect(getObjLen(cache)).toBe(1)
                expect(cache[targetKey].rawData).toBe(data)
            })
    ))

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

    test('save and load one expired item without syncFn', () => {
        const loadExpiredItemWithoutSyncFn = tuaStorage
            .save({ key, data, syncParams })
            .then(() => new Promise((resolve) => {
                Date.now = jest.fn(() => TIME_OUT + (+new Date()))

                setTimeout(
                    () => resolve(tuaStorage.load({ key, syncParams })),
                    TIME_OUT
                )

                jest.advanceTimersByTime(TIME_OUT)
            }))

        const str = stringify({ key: targetKey })

        expect(loadExpiredItemWithoutSyncFn)
            .rejects.toEqual(Error(str))
    })

    test('save and load one exist expired item with syncFn', () => (
        tuaStorage
            .save({ key, data, syncParams })
            .then(() => new Promise((resolve) => {
                Date.now = jest.fn(() => TIME_OUT + (+new Date()))

                setTimeout(() => resolve(
                    tuaStorage.load({
                        key,
                        syncParams,
                        syncFn: () => Promise.resolve(data),
                    })),
                TIME_OUT
                )

                jest.advanceTimersByTime(TIME_OUT)
            }))
            .then((loadedData) => {
                expect(loadedData.data).toBe(data)
                expect(getObjLen(cache)).toBe(1)
                expect(cache[targetKey].rawData.data).toBe(data)
            })
    ))
})

describe('error handling', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
    })

    test('load one expired item without syncFn', () => {
        tuaStorage._cache[targetKey] = fakeVal

        const str = stringify({ key: targetKey })

        expect(tuaStorage.load({ key, syncParams }))
            .rejects.toEqual(Error(str))
    })

    test('save/load/remove one item without key or fullKey', () => {
        expect(tuaStorage.save()).rejects.toEqual(Error(ERROR_MSGS.key))
        expect(tuaStorage.load({})).rejects.toEqual(Error(ERROR_MSGS.key))
        expect(tuaStorage.remove()).rejects.toEqual(Error(ERROR_MSGS.key))
    })

    test('no data found and no syncFn', () => {
        const syncFn = () => Promise.resolve({ data: '+2h' })

        const dataArr = [
            { key: 'item key1', syncFn },
            { key: 'item key2', syncFn },
            { key },
        ]

        const str = stringify({ key: getTargetKey(key) })

        expect(tuaStorage.load(dataArr))
            .rejects
            .toEqual(Error(str))
    })

    test('syncFn does not return a promise', () => {
        const loadParam = {
            key,
            data: '1217',
            syncParams,
            syncFn: () => {},
        }

        expect(tuaStorage.load(loadParam))
            .rejects.toEqual(Error(ERROR_MSGS.promise))
    })
})

describe('save/load/remove', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
    })

    test('force update data when isForceUpdate is true', () => (
        tuaStorage
            .load({
                key,
                expires: 999,
                syncParams,
                syncFn: () => Promise.resolve(data),
            })
            .then(() => tuaStorage.load({
                key,
                syncParams,
                isForceUpdate: true,
                syncFn: () => Promise.resolve('force update data'),
            }))
            .then((loadedData) => {
                expect(loadedData.data).toBe('force update data')
                expect(getObjLen(cache)).toBe(1)
                expect(cache[targetKey].rawData.data).toBe('force update data')
            })
    ))

    test('never save data which is destined to expired', () => (
        tuaStorage
            .save({ key, data, syncParams, expires: 0 })
            .then(() => {
                expect(getObjLen(cache)).toBe(0)
            })
    ))

    test('save, load and remove one item with fullKey', () => {
        const expectedVal = getExpectedVal(data, DEFAULT_EXPIRES)

        return Promise.all([
            tuaStorage.save({ key: fullKey, data }),
            tuaStorage.save({ fullKey, data }),
        ])
            .then(() => tuaStorage.load({ fullKey }))
            .then(() => {
                expect(stringify(cache[fullKey])).toBe(expectedVal)
            })
            .then(() => tuaStorage.remove({ fullKey }))
            .then(() => {
                expect(cache[fullKey]).toBeUndefined()
                expect(getObjLen(cache)).toBe(1)
                expect(stringify(cache[getTargetKey(fullKey)]))
                    .toBe(expectedVal)
            })
    })

    test('load one exist expired item with syncFn', () => {
        tuaStorage._cache[targetKey] = fakeVal

        return tuaStorage
            .load({
                key,
                syncParams,
                syncFn: () => Promise.resolve(data),
            })
            .then((loadedData) => {
                expect(loadedData.data).toBe(data)
                expect(getObjLen(cache)).toBe(1)
                expect(cache[targetKey].rawData.data).toBe(data)
            })
    })

    test('loadSync one exist expired item', () => {
        tuaStorage._cache[targetKey] = fakeVal

        const cacheData = tuaStorage.loadSync({ key, syncParams })
        const loadedData = tuaStorage.loadSync({ key, syncParams, isEnableCache: false })

        expect(cacheData).toBeUndefined()
        expect(loadedData).toBeUndefined()
    })

    test('load inexistent items with syncFn and non-zero code', () => {
        const syncFn = () => Promise.resolve({ code: 66, data })
        const dataArr = [
            { key: 'item key1', syncFn },
            { key: 'item key2', syncFn },
        ]

        return tuaStorage
            .load(dataArr)
            .then((loadedItems) => {
                loadedItems.map(({ code, data: loadedData }, idx) => {
                    const targetKey = getTargetKey(dataArr[idx].key)

                    expect(code).toBe(66)
                    expect(loadedData).toBe(data)
                    expect(getObjLen(cache)).toBe(0)
                    expect(stringify(cache[targetKey])).toBeUndefined()
                })
            })
    })

    test('save and remove all exist items', () => {
        const kdArr = [
            { key: 'brmm-1', data: 'string' },
            { key: 'brmm-2', data: 1217 },
            { key: 'brmm-3', data: null },
            { key: 'brmm-4', data: undefined },
            { key: 'brmm-5', data: { yo: 1, hey: { 876: 123 } } },
        ]
        const keyArr = kdArr.map(({ key }) => key)

        return tuaStorage
            .save(kdArr)
            .then(() => tuaStorage.remove(keyArr))
            .then(() => {
                expect(getObjLen(cache)).toBe(0)

                kdArr
                    .map(({ key }) => cache[getTargetKey(key)])
                    .map(val => expect(val).toBeUndefined())
            })
    })

    test('clear all items', () => {
        const kdArr = [
            { key: 'cmm-1', data: 'string' },
            { key: 'cmm-2', data: 1217 },
            { key: 'cmm-3', data: null },
            { key: 'cmm-4', data: undefined },
            { key: 'cmm-5', data: { yo: 1, hey: { 876: 123 } } },
        ]

        return Promise
            .all(kdArr.map(
                ({ key, data }) => tuaStorage.save({ key, data })
            ))
            .then(() => tuaStorage.clear())
            .then(() => {
                expect(getObjLen(cache)).toBe(0)

                kdArr
                    .map(({ key }) => cache[getTargetKey(key)])
                    .map(val => expect(val).toBeUndefined())
            })
    })

    test('get storage info', () => (
        tuaStorage
            .save({ key, data })
            .then(tuaStorage.getInfo.bind(tuaStorage))
            .then(({ keys }) => {
                expect(keys).toEqual([`TUA_STORAGE_PREFIX: ${key}`])
            })
    ))
})

describe('saveSync/loadSync/clearSync/removeSync/getInfoSync', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
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
