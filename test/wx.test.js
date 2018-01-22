import wxCls from './wxMock'

import Storage from '../src/storage'
import {
    getObjLen,
    expireTime,
    getTargetKey,
    getExpectedVal,
    getExpectedValBySyncFn,
} from './utils'

const wx = new wxCls()

const tuaStorage = new Storage({
    storageEngine: wx,
    defaultExpires: expireTime,
})

describe('save/load/clear/remove', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        wx._clear()
    })

    test('load some exist items with one key and disable cache', () => {
        const key = 'item to be loaded without cache'
        const data = 'item from wx'
        const dataArr = [
            { key, data: '+1s', expires: 10, isEnableCache: false },
            { key, data: 1217, isEnableCache: false },
            { key, data, isEnableCache: false },
        ]

        return tuaStorage
            .save(dataArr)
            .then(() => tuaStorage.load(dataArr))
            .then((loadedItems) => {
                const cache = tuaStorage._cache
                const store = wx.store

                loadedItems.map((loadedItem) => {
                    // load function returns rawData
                    expect(loadedItem).toBe(data)
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)

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
        const key = 'key to be saved'
        const data = 'item to be removed'
        const keyArr = ['item key1', 'item key2', 'item key3']

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.remove(keyArr))
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store
                const targetKey = getTargetKey(key)
                const expectedVal = getExpectedVal(data)

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

        return Promise
            .all(kdArr.map(({ key, data }) => tuaStorage.save({ key, data })))
            .then(() => tuaStorage.clear(whiteList))
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store

                kdArr.map(({ key, data }) => {
                    const deltaLen = kdArr.length - whiteList.length
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)
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
})
