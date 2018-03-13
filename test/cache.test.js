import Storage from '../src/storage'
import { ERROR_MSG, DEFAULT_EXPIRES } from '../src/utils'
import {
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn
} from './utils'

const TIME_OUT = 999999

const tuaStorage = new Storage()

// 为了测试 api 不全部分的代码
new Storage({ storageEngine: {} })

const key = 'common key'
const data = 'common data'
const fullKey = 'common fullKey'
const syncParams = { a: 1, b: '2' }

const fakeVal = getExpectedValBySyncFn(data, -1)
const targetKey = getTargetKey(key, syncParams)
const expectedVal = getExpectedVal(data, DEFAULT_EXPIRES)

let cache = tuaStorage._cache

describe('expires', () => {
    jest.useFakeTimers()

    afterEach(() => {
        cache = tuaStorage._cache = {}
        Date.now = jest.fn(() => +new Date)
    })

    test('feat[8.1]: never save data which is destined to expired', () => (
        tuaStorage
            .save({ key, data, syncParams, expires: 0 })
            .then(() => {
                expect(getObjLen(cache)).toBe(0)
            })
    ))

    test('feat[5]: save and load one item which will never expire', () => (
        tuaStorage
            .save({ key, data, syncParams, expires: null })
            .then(() => new Promise((resolve) => {
                Date.now = jest.fn(() => TIME_OUT + (+new Date))

                setTimeout(
                    () => resolve(tuaStorage.load({ key, syncParams })),
                    TIME_OUT
                )

                jest.runAllTimers()
            }))
            .then((loadedData) => {
                expect(loadedData).toBe(data)
                expect(getObjLen(cache)).toBe(1)
                expect(cache[targetKey].rawData).toBe(data)
            })
    ))

    test('save and load one expired item without syncFn', () => {
        const loadExpiredItemWithoutSyncFn = tuaStorage
            .save({ key, data, syncParams })
            .then(() => new Promise((resolve) => {
                Date.now = jest.fn(() => TIME_OUT + (+new Date))

                setTimeout(
                    () => resolve(tuaStorage.load({ key, syncParams })),
                    TIME_OUT
                )

                jest.runAllTimers()
            }))

        expect(loadExpiredItemWithoutSyncFn)
            .rejects.toThrow(JSON.stringify({ key: targetKey }))
    })

    test('load one expired item without syncFn', () => {
        cache[targetKey] = fakeVal

        expect(tuaStorage.load({ key, syncParams }))
            .rejects.toThrow(JSON.stringify({ key: targetKey }))
    })

    test('save and load one exist expired item with syncFn', () => (
        tuaStorage
            .save({ key, data, syncParams })
            .then(() => new Promise((resolve) => {
                Date.now = jest.fn(() => TIME_OUT + (+new Date))

                setTimeout(() => resolve(
                    tuaStorage.load({
                        key,
                        syncParams,
                        syncFn: () => Promise.resolve(data),
                    })),
                    TIME_OUT
                )

                jest.runAllTimers()
            }))
            .then((loadedData) => {
                expect(loadedData.data).toBe(data)
                expect(getObjLen(cache)).toBe(1)
                expect(cache[targetKey].rawData.data).toBe(data)
            })
    ))

    test('load one exist expired item with syncFn', () => {
        cache[targetKey] = fakeVal

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
})

describe('error handling', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
    })

    test('save/load/remove one item without key or fullKey', () => {
        expect(tuaStorage.save({}))
            .rejects.toThrow(ERROR_MSG.KEY)
        expect(tuaStorage.load({}))
            .rejects.toThrow(ERROR_MSG.KEY)
        expect(tuaStorage.remove())
            .rejects.toThrow(ERROR_MSG.KEY)
    })

    test('no data found and no syncFn', () => {
        const syncFn = () => Promise.resolve({ data: '+2h' })

        const dataArr = [
            { key: 'item key1', syncFn },
            { key: 'item key2', syncFn },
            { key },
        ]

        expect(tuaStorage.load(dataArr))
            .rejects
            .toThrow(JSON.stringify({ key: getTargetKey(key) }))
    })

    test('syncFn does not return a promise', () => {
        const loadParam = {
            key,
            data: '1217',
            syncParams,
            syncFn: () => {},
        }

        expect(tuaStorage.load(loadParam))
            .rejects.toThrow(ERROR_MSG.PROMISE)
    })
})

describe('save/load/remove', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
    })

    test('feat[6]: save, load and remove one item with fullKey', () => {
        const expectedVal = getExpectedVal(data, DEFAULT_EXPIRES)

        return Promise.all([
                tuaStorage.save({ key: fullKey, data }),
                tuaStorage.save({ fullKey, data }),
            ])
            .then(() => tuaStorage.load({ fullKey }))
            .then(() => {
                expect(JSON.stringify(cache[fullKey])).toBe(expectedVal)
            })
            .then(() => tuaStorage.remove({ fullKey }))
            .then(() => {
                expect(cache[fullKey]).toBeUndefined()
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[getTargetKey(fullKey)]))
                    .toBe(expectedVal)
            })
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
                    expect(JSON.stringify(cache[targetKey])).toBeUndefined()
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
})
