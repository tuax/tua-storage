import AsyncStorageCls from 'mock-async-storage'

import Storage from '../src/storage'
import { DEFAULT_KEY_PREFIX } from '../src/utils'
import {
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
} from './utils'

const AsyncStorage = new AsyncStorageCls()

const tuaStorage = new Storage({
    storageEngine: AsyncStorage,
    defaultExpires: expireTime,
})

const key = 'common key'
const data = 'common data'
const syncParams = { a: 1, b: '2' }

const targetKey = getTargetKey(key)
const expectedVal = getExpectedVal(data)

let cache = tuaStorage._cache

describe('initial state', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
        AsyncStorage.clear()
    })

    test('feat[8.2]: clean initial expired data', () => (
        Promise
            .all([
                AsyncStorage.setItem(`${DEFAULT_KEY_PREFIX}1`, getExpectedVal(data, -10)),
                AsyncStorage.setItem(`${DEFAULT_KEY_PREFIX}2`, JSON.stringify({})),
                AsyncStorage.setItem(`${DEFAULT_KEY_PREFIX}3`, 'abc'),
                AsyncStorage.setItem(`${DEFAULT_KEY_PREFIX}4`, getExpectedVal(data, 10)),
            ])
            .then(tuaStorage._clearExpiredData.bind(tuaStorage))
            .then(() => {
                const store = AsyncStorage.getStore()

                expect(store.size).toBe(3)
                expect(store.get(`${DEFAULT_KEY_PREFIX}1`)).toBeUndefined()
            })
    ))

    test('clear items not match prefix', () => (
        Promise
            .all([
                AsyncStorage.setItem('b', '666'),
                AsyncStorage.setItem('steve', '1217'),
                AsyncStorage.setItem(DEFAULT_KEY_PREFIX, '666'),
            ])
            .then(() => (
                tuaStorage.clear(['steve', DEFAULT_KEY_PREFIX])
            ))
            .then(() => {
                const store = AsyncStorage.getStore()

                expect(store.size).toBe(2)
                expect(store.get('steve')).toBe('1217')
                expect(store.get(DEFAULT_KEY_PREFIX)).toBe('666')
            })
    ))
})

describe('save/load/remove', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
        AsyncStorage.clear()
    })

    test('feat[8.1]: never save data which is destined to expired', () => (
        tuaStorage
            .save({ key, data, syncParams, expires: 0 })
            .then(() => {
                const store = AsyncStorage.getStore()

                expect(getObjLen(cache)).toBe(0)
                expect(store.size).toBe(0)
            })
    ))

    test('load one exist item without cache', () => (
        tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.load({ key, isEnableCache: false }))
            .then((loadedData) => {
                // load function returns rawData
                expect(loadedData).toBe(data)

                const store = AsyncStorage.getStore()

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(store.size).toBe(1)
                expect(JSON.stringify(store.get(targetKey))).toBe(expectedVal)
            })
    ))

    test('remove some undefined items', () => {
        const keyArr = ['item key1', 'item key2', 'item key3']

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.remove(keyArr))
            .then(() => {
                const store = AsyncStorage.getStore()

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(store.size).toBe(1)
                expect(JSON.stringify(store.get(targetKey))).toBe(expectedVal)
            })
    })
})
