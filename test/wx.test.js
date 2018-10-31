import wxCls from './wxMock'

import TuaStorage from '../src/'
import {
    TIME_OUT,
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
} from './utils'
import { DEFAULT_KEY_PREFIX } from '../src/constants'

const wx = new wxCls()

const tuaStorage = new TuaStorage({
    storageEngine: wx,
    defaultExpires: expireTime,
})

const key = 'common key'
const data = 'common data'
// const fullKey = 'common fullKey'
const syncParams = { a: 1, b: '2' }

// const targetKey = getTargetKey(key, syncParams)

let cache = tuaStorage._cache
let store = wx.store

describe('timers', () => {
    jest.useFakeTimers()

    // 专门用于测试时间相关的实例
    const tuaStorage = new TuaStorage({
        storageEngine: localStorage,
    })
    let cache = tuaStorage._cache

    afterEach(() => {
        wx._clear()
        cache = tuaStorage._cache = {}
        store = wx.store
        Date.now = jest.fn(() => +new Date)
    })

    test('setInterval to clean expired data', async () => (
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
                    expect(wx._length).toBe(2)
                    expect(cache[getTargetKey(`${key}1`)]).toBeUndefined()
                })
            })
            .then(() => {
                Date.now = jest.fn(() => TIME_OUT * 2 + (+new Date))
                jest.advanceTimersByTime(TIME_OUT * 2)

                // 因为删除是异步操作
                setImmediate(() => {
                    expect(getObjLen(cache)).toBe(1)
                    expect(wx._length).toBe(1)
                })
            })
    ))
})

describe('initial state', () => {
    afterEach(() => {
        wx._clear()
        cache = tuaStorage._cache = {}
        store = wx.store
    })

    test('clean initial expired data', () => {
        wx.store = {
            [`${DEFAULT_KEY_PREFIX}1`]: getExpectedVal(data, -10),
            [`${DEFAULT_KEY_PREFIX}2`]: JSON.stringify({}),
            [`${DEFAULT_KEY_PREFIX}3`]: 'abc',
            [`${DEFAULT_KEY_PREFIX}4`]: getExpectedVal(data, 10),
        }


        return tuaStorage._clearExpiredData()
            .then(() => {
                store = wx.store

                expect(wx._length).toBe(3)
                expect(store[`${DEFAULT_KEY_PREFIX}1`]).toBeUndefined()
            })
    })

    test('clear items not match prefix', () => {
        wx.store = {
            test: '123',
            steve: '1217',
            [DEFAULT_KEY_PREFIX]: '666',
        }

        return tuaStorage.clear(['steve', DEFAULT_KEY_PREFIX])
            .then(() => {
                store = wx.store

                expect(wx._length).toBe(2)
                expect(store['steve']).toBe('1217')
                expect(store[DEFAULT_KEY_PREFIX]).toBe('666')
            })
    })
})

describe('save/load/clear/remove/getInfo', () => {
    afterEach(() => {
        wx._clear()
        cache = tuaStorage._cache = {}
        store = wx.store
    })

    test('never save data which is destined to expired', () => (
        tuaStorage
            .save({ key, data, syncParams, expires: 0 })
            .then(() => {
                expect(getObjLen(cache)).toBe(0)
                expect(wx._length).toBe(0)
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
                    expect(wx._length).toBe(1)
                    expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
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
                expect(wx._length).toBe(1)
                expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
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
        const expectedValues = kdArr.map(({ data }) => getExpectedVal(data))

        return Promise
            .all(kdArr.map(({ key, data }) => tuaStorage.save({ key, data })))
            .then(() => tuaStorage.clear(whiteList))
            .then(() => {
                kdArr.map(({ key }, idx) => {
                    const targetKey = getTargetKey(key)
                    const expectedVal = expectedValues[idx]
                    const isInWhiteList = whiteList
                        .some(targetKey.includes.bind(targetKey))

                    // cache
                    expect(getObjLen(cache)).toBe(whiteList.length)
                    isInWhiteList
                        ? expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)
                        : expect(cache[targetKey]).toBeUndefined()

                    // storage
                    expect(wx._length).toBe(whiteList.length)

                    if (isInWhiteList) {
                        expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
                    } else {
                        expect(JSON.stringify(store[targetKey])).toBeUndefined()
                    }
                })
            })
    })

    test('get storage info', () => (
        tuaStorage.getInfo().then(({ keys, limitSize, currentSize }) => {
            expect(keys).toEqual([])
            expect(limitSize).toEqual(10240)
            expect(currentSize).toEqual(0)
        })
    ))
})

describe('saveSync/loadSync/clearSync/removeSync/getInfoSync', () => {
    afterEach(() => {
        wx._clear()
        cache = tuaStorage._cache = {}
        store = wx.store
    })

    test('never save data which is destined to expired', () => {
        tuaStorage.saveSync({ key, data, syncParams, expires: 0 })

        expect(getObjLen(cache)).toBe(0)
        expect(wx._length).toBe(0)
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
            expect(JSON.stringify(cache[targetKey])).toBeUndefined()

            // storage
            expect(wx._length).toBe(1)
            expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
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
        expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

        // storage
        expect(wx._length).toBe(1)
        expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
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

        kdArr.map(({ key, data }) => tuaStorage.saveSync({ key, data }))

        tuaStorage.clearSync(whiteList)

        kdArr.map(({ key }, idx) => {
            const targetKey = getTargetKey(key)
            const expectedVal = expectedValues[idx]
            const isInWhiteList = whiteList
                .some(targetKey.includes.bind(targetKey))

            // cache
            expect(getObjLen(cache)).toBe(whiteList.length)
            isInWhiteList
                ? expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)
                : expect(cache[targetKey]).toBeUndefined()

            // storage
            expect(wx._length).toBe(whiteList.length)

            if (isInWhiteList) {
                expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
            } else {
                expect(JSON.stringify(store[targetKey])).toBeUndefined()
            }
        })
    })

    test('get storage info', () => {
        const { keys, limitSize, currentSize } = tuaStorage.getInfoSync()

        expect(keys).toEqual([])
        expect(limitSize).toEqual(10240)
        expect(currentSize).toEqual(0)
    })
})
