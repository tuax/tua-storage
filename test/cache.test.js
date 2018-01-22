import Storage, { ERROR_MSG, DEFAULT_EXPIRES } from '../src/storage'
import {
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn,
} from './utils'

const tuaStorage = new Storage()

describe('advanced features', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
    })

    test('feat[1.5]: save, load and remove one item with fullKey', () => {
        const fullKey = 'item fullKey'
        const data = 'item'
        const expectedVal = getExpectedVal(data, DEFAULT_EXPIRES)

        return Promise.all([
                tuaStorage.save({ key: fullKey, data }),
                tuaStorage.save({ fullKey, data }),
            ])
            .then(() => tuaStorage.load({ fullKey }))
            .then(() => {
                const cache = tuaStorage._cache

                expect(JSON.stringify(cache[fullKey])).toBe(expectedVal)
            })
            .then(() => tuaStorage.remove({ fullKey }))
            .then(() => {
                const cache = tuaStorage._cache

                expect(cache[fullKey]).toBeUndefined()
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[getTargetKey(fullKey)]))
                    .toBe(expectedVal)
            })
    })
})

describe('error handling', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
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
        const key = 'rejected by no data and no sync fn'
        const dataArr = [
            {
                key: 'item key1 to be loaded with syncFn',
                syncFn: () => Promise.resolve({ data: '+2h' })
            },
            {
                key: 'item key2 to be loaded with syncFn',
                syncFn: () => Promise.resolve({ data: '+2h' })
            },
            { key },
        ]

        return expect(tuaStorage.load(dataArr))
            .rejects.toThrow(JSON.stringify({ key: getTargetKey(key) }))
    })

    test('syncFn does not return a promise', () => {
        const key = 'syncFn does not return a promise'
        const syncParams = { a: 1, b: '2' }
        const targetKey = getTargetKey(key, syncParams)

        const loadParam = {
            key,
            data: '1217',
            syncParams,
            syncFn: () => {},
        }

        return expect(tuaStorage.load(loadParam))
            .rejects.toThrow(ERROR_MSG.PROMISE)
    })
})

describe('save/load/remove', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
    })

    test('load one inexistent item with syncFn and non-zero code', () => {
        const data = 'item from wx'
        const dataArr = [
            {
                key: 'item key1 with non-zero code',
                syncFn: () => Promise.resolve({ code: 66, data }),
            },
            {
                key: 'item key2 with non-zero code',
                syncFn: () => Promise.resolve({ code: 66, data }),
            },
        ]

        return tuaStorage
            .load(dataArr)
            .then((loadedItems) => {
                const cache = tuaStorage._cache

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
                const cache = tuaStorage._cache

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
            .all(kdArr.map(({ key, data }) => tuaStorage.save({ key, data })))
            .then(() => tuaStorage.clear())
            .then(() => {
                const cache = tuaStorage._cache

                expect(getObjLen(cache)).toBe(0)

                kdArr
                    .map(({ key }) => cache[getTargetKey(key)])
                    .map(val => expect(val).toBeUndefined())
            })
    })
})
