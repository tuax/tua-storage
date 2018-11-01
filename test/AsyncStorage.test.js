import AsyncStorageCls from 'mock-async-storage'

import TuaStorage from '../src/'
import { ERROR_MSG, DEFAULT_KEY_PREFIX } from '../src/constants'
import {
    TIME_OUT,
    stringify,
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
} from './utils'

const AsyncStorage = new AsyncStorageCls()

const tuaStorage = new TuaStorage({
    storageEngine: AsyncStorage,
    defaultExpires: expireTime,
})

const key = 'common key'
const data = 'common data'
const syncParams = { a: 1, b: '2' }

const targetKey = getTargetKey(key)

let cache = tuaStorage._cache

describe('timers', () => {
    jest.useFakeTimers()

    // 专门用于测试时间相关的实例
    let tuaStorage = new TuaStorage({
        storageEngine: AsyncStorage,
    })
    let cache = tuaStorage._cache

    afterEach(() => {
        AsyncStorage.clear()
        cache = tuaStorage._cache = {}
        Date.now = jest.fn(() => +new Date)
    })

    test('setInterval to clean expired data', () => (
        tuaStorage
            .save([
                { key: `${key}1`, data, syncParams, expires: 10 },
                { key: `${key}2`, data, syncParams, expires: TIME_OUT * 1.5 / 1000 },
                { key: `${key}3`, data, syncParams, expires: TIME_OUT * 2.5 / 1000 },
            ])
            .then(() => {
                Date.now = jest.fn(() => TIME_OUT + (+new Date))
                jest.advanceTimersByTime(TIME_OUT)

                // 因为删除是异步操作
                setImmediate(() => {
                    expect(getObjLen(cache)).toBe(2)
                    expect(store.size).toBe(2)
                    expect(store.get(getTargetKey(`${key}1`))).toBeUndefined()
                })
            })
            .then(() => {
                Date.now = jest.fn(() => TIME_OUT * 2 + (+new Date))
                jest.advanceTimersByTime(TIME_OUT * 2)

                // 因为删除是异步操作
                setImmediate(() => {
                    expect(getObjLen(cache)).toBe(1)
                    expect(store.size).toBe(1)
                })
            })
    ))
})

describe('initial state', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
        AsyncStorage.clear()
    })

    test('clean initial expired data', () => (
        Promise
            .all([
                AsyncStorage.setItem(`${DEFAULT_KEY_PREFIX}1`, getExpectedVal(data, -10)),
                AsyncStorage.setItem(`${DEFAULT_KEY_PREFIX}2`, stringify({})),
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

    test('never save data which is destined to expired', () => (
        tuaStorage
            .save({ key, data, syncParams, expires: 0 })
            .then(() => {
                const store = AsyncStorage.getStore()

                expect(getObjLen(cache)).toBe(0)
                expect(store.size).toBe(0)
            })
    ))

    test('load one exist item without cache', () => {
        const expectedVal = getExpectedVal(data)

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.load({ key, isEnableCache: false }))
            .then((loadedData) => {
                // load function returns rawData
                expect(loadedData).toBe(data)

                const store = AsyncStorage.getStore()

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(store.size).toBe(1)
                expect(stringify(store.get(targetKey))).toBe(expectedVal)
            })
    })

    test('remove some undefined items', () => {
        const expectedVal = getExpectedVal(data)
        const keyArr = ['item key1', 'item key2', 'item key3']

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.remove(keyArr))
            .then(() => {
                const store = AsyncStorage.getStore()

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(store.size).toBe(1)
                expect(stringify(store.get(targetKey))).toBe(expectedVal)
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

describe('error handling', () => {
    afterEach(() => {
        cache = tuaStorage._cache = {}
        AsyncStorage.clear()
    })

    test('throw error when invoke sync methods', () => {
        expect(() => tuaStorage.clearSync()).toThrow(Error(ERROR_MSG.SYNC_METHOD))
        expect(() => tuaStorage.saveSync({ key, data })).toThrow(Error(ERROR_MSG.SYNC_METHOD))
        expect(() => tuaStorage.loadSync({ key })).toThrow(Error(ERROR_MSG.SYNC_METHOD))
        expect(() => tuaStorage.removeSync({ key })).toThrow(Error(ERROR_MSG.SYNC_METHOD))
        expect(() => tuaStorage.getInfoSync({ key })).toThrow(Error(ERROR_MSG.SYNC_METHOD))
    })
})
