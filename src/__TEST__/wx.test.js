import wxCls from './wxMock'

import Storage from '../storage'
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

describe('batch save', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        wx._clear()
    })

    test('batch save items with one key and enable cache', () => {
        const key = 'batch save items enable cache'
        const data = '0102'
        const dataArr = [
            { key, data: '+1s', expires: 10 },
            { key, data: 1217 },
            { key, data },
        ]
        const targetKey = getTargetKey(key)

        return tuaStorage
            .save(dataArr)
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store
                const expectedVal = getExpectedVal(data)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(wx._length).toBe(1)
                expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
            })
    })

    test('batch save items with one key and last one disable cache', () => {
        const key = 'batch save items last one disable cache'
        const data = 1217
        const lastData = '+2h'
        const dataArr = [
            { key, data: '+1s', expires: 10 },
            { key, data },
            { key, data: lastData, isEnableCache: false },
        ]
        const targetKey = getTargetKey(key)

        return tuaStorage
            .save(dataArr)
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store
                const expectedVal = getExpectedVal(data)
                const expectedLastVal = getExpectedVal(lastData)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(wx._length).toBe(1)
                expect(JSON.stringify(store[targetKey])).toBe(expectedLastVal)
            })
    })

    test('batch save many items with many keys and disable cache', () => {
        const kdArr = [
            { key: 'bsmm-1', data: 'string', isEnableCache: false },
            { key: 'bsmm-2', data: 1217, isEnableCache: false },
            { key: 'bsmm-3', data: null, isEnableCache: false },
            { key: 'bsmm-4', data: undefined, isEnableCache: false },
            { key: 'bsmm-5', data: { yo: 1, hey: { 876: 123 } }, isEnableCache: false },
        ]

        return tuaStorage
            .save(kdArr)
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store

                kdArr.map(({ key, data }) => {
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)

                    // cache
                    expect(getObjLen(cache)).toBe(0)
                    expect(cache[targetKey]).toBeUndefined()

                    // storage
                    expect(wx._length).toBe(kdArr.length)
                    expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
                })
            })
    })

    test('batch save many items with many keys and enable cache', () => {
        const kdArr = [
            { key: 'bsmm-1', data: 'string' },
            { key: 'bsmm-2', data: 1217 },
            { key: 'bsmm-3', data: null },
            { key: 'bsmm-4', data: undefined },
            { key: 'bsmm-5', data: { yo: 1, hey: { 876: 123 } } },
        ]

        return tuaStorage
            .save(kdArr)
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store

                kdArr.map(({ key, data }) => {
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)

                    // cache
                    expect(getObjLen(cache)).toBe(kdArr.length)
                    expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                    // storage
                    expect(wx._length).toBe(kdArr.length)
                    expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
                })
            })
    })
})

describe('batch load', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        wx._clear()
    })

    test('batch load some exist items with one key and enable cache', () => {
        const key = 'item to be batch loaded with cache'
        const data = 'item from cache'
        const dataArr = [
            { key, data: '+1s', expires: 10 },
            { key, data: 1217 },
            { key, data },
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
                    expect(getObjLen(cache)).toBe(1)
                    expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                    // storage
                    expect(wx._length).toBe(1)
                    expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
                })
            })
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

    test('load some inexistent items with syncFn', () => {
        const data = 'item from wx'
        const dataArr = [
            {
                key: 'item key1 to be loaded with syncFn',
                syncFn: () => Promise.resolve({ data }),
            },
            {
                key: 'item key2 to be loaded with syncFn',
                syncFn: () => Promise.resolve({ data }),
            },
        ]

        return tuaStorage
            .load(dataArr)
            .then((loadedItems) => {
                const cache = tuaStorage._cache
                const store = wx.store

                loadedItems.map(({ code, data: loadedData }, idx) => {
                    expect(code).toBe(0)
                    expect(loadedData).toBe(data)

                    const targetKey = getTargetKey(dataArr[idx].key)
                    const expectedVal = getExpectedValBySyncFn(data)

                    // cache
                    expect(getObjLen(cache)).toBe(2)
                    expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                    // storage
                    expect(wx._length).toBe(2)
                    expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
                })
            })
    })

    test('load one inexistent item with syncFn and non-zero code', () => {
        const data = 'item from wx'
        const dataArr = [
            {
                key: 'item key1 to be loaded with syncFn and non-zero code',
                syncFn: () => Promise.resolve({ code: 66, data }),
            },
            {
                key: 'item key2 to be loaded with syncFn and non-zero code',
                syncFn: () => Promise.resolve({ code: 66, data }),
            },
        ]

        return tuaStorage
            .load(dataArr)
            .then((loadedItems) => {
                const cache = tuaStorage._cache
                const store = wx.store

                loadedItems.map(({ code, data: loadedData }, idx) => {
                    expect(code).toBe(66)
                    expect(loadedData).toBe(data)

                    const targetKey = getTargetKey(dataArr[idx].key)

                    // cache
                    expect(getObjLen(cache)).toBe(0)
                    expect(JSON.stringify(cache[targetKey])).toBeUndefined()

                    // storage
                    expect(wx._length).toBe(0)
                    expect(JSON.stringify(store[targetKey])).toBeUndefined()
                })
            })
    })

    test('load inexistent items with syncFn and not autoSave', () => {
        const data = 'item from wx'
        const dataArr = [
            {
                key: 'item key1 to be loaded with syncFn',
                syncFn: () => Promise.resolve({ code: '0', data }),
                isAutoSave: false,
            },
            {
                key: 'item key2 to be loaded with syncFn',
                syncFn: () => Promise.resolve({ code: 0, data }),
                isAutoSave: true,
            },
        ]

        return tuaStorage
            .load(dataArr)
            .then((loadedItems) => {
                const cache = tuaStorage._cache
                const store = wx.store

                loadedItems.map(({ code, data: loadedData }, idx) => {
                    expect(code).toBe(0)
                    expect(loadedData).toBe(data)

                    const { key, isAutoSave } = dataArr[idx]

                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedValBySyncFn(data)
                    const strCacheData = JSON.stringify(cache[targetKey])

                    // cache
                    expect(getObjLen(cache)).toBe(1)
                    isAutoSave
                        ? expect(strCacheData).toBe(expectedVal)
                        : expect(strCacheData).toBeUndefined()

                    // storage
                    expect(wx._length).toBe(1)
                    isAutoSave
                        ? expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
                        : expect(JSON.stringify(store[targetKey])).toBeUndefined()
                })
            })
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

describe('batch remove', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        wx._clear()
    })

    test('batch remove all exist items', () => {
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
                const store = wx.store

                kdArr.map(({ key, data }) => {
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)

                    // cache
                    expect(getObjLen(cache)).toBe(0)
                    expect(cache[targetKey]).toBeUndefined()

                    // storage
                    expect(wx._length).toBe(0)
                    expect(JSON.stringify(store[targetKey])).toBeUndefined()
                })
            })
    })

    test('batch remove some exist items', () => {
        const kdArr = [
            { key: 'brmm-1', data: 'string' },
            { key: 'brmm-2', data: 1217 },
            { key: 'brmm-3', data: null },
            { key: 'brmm-4', data: undefined },
            { key: 'brmm-5', data: { yo: 1, hey: { 876: 123 } } },
        ]
        const keyArr = ['brmm-3', 'brmm-5']

        return tuaStorage
            .save(kdArr)
            .then(() => tuaStorage.remove(keyArr))
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store

                kdArr.map(({ key, data }) => {
                    const deltaLen = kdArr.length - keyArr.length
                    const isRemoved = keyArr.includes(key)
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)

                    // cache
                    expect(getObjLen(cache)).toBe(deltaLen)
                    isRemoved
                        ? expect(cache[targetKey]).toBeUndefined()
                        : expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                    // storage
                    expect(wx._length).toBe(deltaLen)

                    if (isRemoved) {
                        expect(JSON.stringify(store[targetKey])).toBeUndefined()
                    } else {
                        expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
                    }
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
})

describe('save', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        wx._clear()
    })

    test('save one item and enable cache', () => {
        const key = 'save one item'
        const data = 'item'
        const targetKey = getTargetKey(key)

        return tuaStorage
            .save({ key, data })
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store
                const expectedVal = getExpectedVal(data)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(wx._length).toBe(1)
                expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
            })
    })

    test('save one item and disable cache', () => {
        const key = 'save one item'
        const data = 'item'
        const targetKey = getTargetKey(key)

        return tuaStorage
            .save({ key, data, isEnableCache: false })
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store
                const expectedVal = getExpectedVal(data)

                // cache
                expect(getObjLen(cache)).toBe(0)
                expect(cache[targetKey]).toBeUndefined()

                // storage
                expect(wx._length).toBe(1)
                expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
            })
    })

    test('save many items with one key', () => {
        const key = 'only key'
        const dataArr = ['bar', 123, null, { a: 1, b: 2 }]

        return Promise
            .all(dataArr.map(data => tuaStorage.save({ key, data })))
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store
                const targetKey = getTargetKey(key)
                // last value
                const expectedVal = getExpectedVal(dataArr.slice().pop())

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(wx._length).toBe(1)
                expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
            })
    })

    test('save many items with many keys and disable cache', () => {
        const kdArr = [
            { key: 'smm-1', data: 'string' },
            { key: 'smm-2', data: 1217 },
            { key: 'smm-3', data: null },
            { key: 'smm-4', data: undefined },
            { key: 'smm-5', data: { yo: 1, hey: { 876: 123 } } },
        ]

        return Promise
            .all(kdArr.map(({ key, data }) =>
                tuaStorage.save({ key, data, isEnableCache: false })
            ))
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store

                kdArr.map(({ key, data }) => {
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)

                    // cache
                    expect(getObjLen(cache)).toBe(0)
                    expect(cache[targetKey]).toBeUndefined()

                    // storage
                    expect(wx._length).toBe(kdArr.length)
                    expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
                })
            })
    })
})

describe('load', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        wx._clear()
    })

    test('load one exist item with cache', () => {
        const key = 'item to be loaded with cache'
        const data = 'item from cache'

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.load({ key }))
            .then((loadedData) => {
                // load function returns rawData
                expect(loadedData).toBe(data)

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

    test('load one exist item without cache', () => {
        const key = 'item to be loaded without cache'
        const data = 'item from wx'

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.load({ key, isEnableCache: false }))
            .then((loadedData) => {
                // load function returns rawData
                expect(loadedData).toBe(data)

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

    test('load one inexistent item with syncFn', () => {
        const key = 'item to be loaded with syncFn'
        const data = 'item from wx'

        return tuaStorage
            .load({ key, syncFn: () => Promise.resolve({ data }) })
            .then(({ code, data: loadedData }) => {
                expect(code).toBe(0)
                expect(loadedData).toBe(data)

                const cache = tuaStorage._cache
                const store = wx.store
                const targetKey = getTargetKey(key)
                const expectedVal = getExpectedValBySyncFn(data)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(wx._length).toBe(1)
                expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
            })
    })

    test('load one inexistent item with syncFn and non-zero code', () => {
        const key = 'item to be loaded with syncFn and non-zero code'
        const data = 'item from wx'

        return tuaStorage
            .load({ key, syncFn: () => Promise.resolve({ code: 66, data }) })
            .then(({ code, data: loadedData }) => {
                expect(code).toBe(66)
                expect(loadedData).toBe(data)

                const cache = tuaStorage._cache
                const store = wx.store
                const targetKey = getTargetKey(key)
                const expectedVal = getExpectedValBySyncFn(data)

                // cache
                expect(getObjLen(cache)).toBe(0)
                expect(JSON.stringify(cache[targetKey])).toBeUndefined()

                // storage
                expect(wx._length).toBe(0)
                expect(JSON.stringify(store[targetKey])).toBeUndefined()
            })
    })

    test('load one inexistent item with syncFn and not autoSave', () => {
        const key = 'item to be loaded with syncFn and not autoSave'
        const data = 'item from wx'

        return tuaStorage
            .load({
                key,
                isAutoSave: false,
                syncFn: () => Promise.resolve({ data }) }
            )
            .then(({ code, data: loadedData }) => {
                expect(code).toBe(0)
                expect(loadedData).toBe(data)

                const cache = tuaStorage._cache
                const store = wx.store
                const targetKey = getTargetKey(key)
                const expectedVal = getExpectedValBySyncFn(data)

                // cache
                expect(getObjLen(cache)).toBe(0)
                expect(JSON.stringify(cache[targetKey])).toBeUndefined()

                // storage
                expect(wx._length).toBe(0)
                expect(JSON.stringify(store[targetKey])).toBeUndefined()
            })
    })

    test('reject when no data found and no sync fn', () => {
        const key = 'rejected by no data and no sync fn '
        const targetKey = getTargetKey(key)

        return expect(tuaStorage.load({ key }))
            .rejects.toThrow(JSON.stringify({ key: targetKey }))
    })
})

describe('remove', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        wx._clear()
    })

    test('remove one exist item', () => {
        const key = 'item key to be removed'
        const data = 'item to be removed'

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.remove(key))
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store
                const targetKey = getTargetKey(key)
                const expectedVal = getExpectedVal(data)

                // cache
                expect(getObjLen(cache)).toBe(0)
                expect(cache[targetKey]).toBeUndefined()

                // storage
                expect(wx._length).toBe(0)
                expect(JSON.stringify(store[targetKey])).toBeUndefined()
            })
    })

    test('remove one undefined item', () => {
        const key = 'item key to be removed'
        const data = 'item to be removed'
        const anotherKey = 'an undefined key'

        return tuaStorage
            .save({ key, data })
            .then(() => tuaStorage.remove(anotherKey))
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store
                const targetKey = getTargetKey(key)
                const expectedVal = getExpectedVal(data)
                const anotherTargetKey = getTargetKey(anotherKey)

                // cache
                expect(getObjLen(cache)).toBe(1)
                expect(JSON.stringify(cache[targetKey])).toBe(expectedVal)

                // storage
                expect(wx._length).toBe(1)
                expect(JSON.stringify(store[targetKey])).toBe(expectedVal)
            })
    })

    test('remove many items', () => {
        const kdArr = [
            { key: 'rmm-1', data: 'string' },
            { key: 'rmm-2', data: 1217 },
            { key: 'rmm-3', data: null },
            { key: 'rmm-4', data: undefined },
            { key: 'rmm-5', data: { yo: 1, hey: { 876: 123 } } },
        ]

        return Promise
            .all([
                ...kdArr.map(({ key, data }) => tuaStorage.save({ key, data })),
                ...kdArr.map(({ key }) => tuaStorage.remove(key)),
            ])
            .then(() => {
                const cache = tuaStorage._cache
                const store = wx.store

                kdArr.map(({ key, data }) => {
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)

                    // cache
                    expect(getObjLen(cache)).toBe(0)
                    expect(cache[targetKey]).toBeUndefined()

                    // storage
                    expect(wx._length).toBe(0)
                    expect(JSON.stringify(store[targetKey])).toBeUndefined()
                })
            })
    })
})

describe('clear', () => {
    beforeEach(() => {
        tuaStorage._cache = {}
        wx._clear()
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
                const store = wx.store

                kdArr.map(({ key, data }) => {
                    const targetKey = getTargetKey(key)
                    const expectedVal = getExpectedVal(data)

                    // cache
                    expect(getObjLen(cache)).toBe(0)
                    expect(cache[targetKey]).toBeUndefined()

                    // storage
                    expect(wx._length).toBe(0)
                    expect(JSON.stringify(store[targetKey])).toBeUndefined()
                })
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
