import Storage, { MSG_KEY, DEFAULT_EXPIRES } from '../src/storage'
import {
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn,
} from './utils'

const tuaStorage = new Storage()

describe('save', () => {
    test('save one item without key', () => {
        const data = 'item'

        return expect(tuaStorage.save({ data })).rejects.toThrow(MSG_KEY)
    })
})

describe('load', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
    })

    test('load one item without key', () => {
        const data = 'item'

        return expect(tuaStorage.load({ data })).rejects.toThrow(MSG_KEY)
    })

    test('reject when no data found and no sync fn', () => {
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
        const targetKey = getTargetKey(key)

        return expect(tuaStorage.load(dataArr))
            .rejects.toThrow(JSON.stringify({ key: targetKey }))
    })
})

describe('remove', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
    })

    test('remove one item without key', () => {
        const data = 'item'

        return expect(tuaStorage.remove()).rejects.toThrow(MSG_KEY)
    })

    test('remove all exist items', () => {
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

                kdArr.map(({ key, data }) => {
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data, DEFAULT_EXPIRES)

                    // cache
                    expect(getObjLen(cache)).toBe(0)
                    expect(cache[targetKey]).toBeUndefined()
                })
            })
    })
})

