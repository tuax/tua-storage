/**
 * @file: 使用 Promise 封装存储层，对外暴露以下方法：
 *   1.构造函数：初始化 storage，建议挂载到全局变量上
 *   2.save：保存函数
 *   3.load：读取函数
 *   4.remove：删除函数
 *   5.clear：清除函数
 *
 * @Author: StEve Young
 * @Date:   2017-Dec-06 11:37:27
 * @Last modified by:   steve young
 * @Last modified time: 2017-Dec-08 12:55:00
 */

import { negate, getParamStrFromObj } from './utils'

export const DEFAULT_EXPIRES = 30 // 默认 30s，采用秒作为单位方便测试
export const DEFAULT_KEY_PREFIX = 'TUA_STORAGE_PREFIX: '
export const MSG_KEY = '请输入参数 key!'

export default class Storage {
    constructor ({
        syncFnMap = {},
        whiteList = [],
        storageEngine = null, // 可传递 wx / localStorage / AsyncStorage
        defaultExpires = DEFAULT_EXPIRES,
        storageKeyPrefix = DEFAULT_KEY_PREFIX,
    } = {}) {
        this.whiteList = whiteList
        this.syncFnMap = syncFnMap
        this.storageEngine = storageEngine
        this.defaultExpires = defaultExpires
        this.storageKeyPrefix = storageKeyPrefix

        this.SEMap = this._getFormatedSE()

        this._cache = {}
        this.clear([ this.storageKeyPrefix ])
    }

    /* -- 各种对外暴露方法 -- */

    load (itemsToBeLoaded) {
        return Array.isArray(itemsToBeLoaded)
            ? Promise.all(
                itemsToBeLoaded.map(item => this._loadOneItem(item))
            )
            : this._loadOneItem(itemsToBeLoaded)
    }

    save (itemsToBeSaved) {
        return Array.isArray(itemsToBeSaved)
            ? Promise.all(
                itemsToBeSaved.map(item => this._saveOneItem(item))
            )
            : this._saveOneItem(itemsToBeSaved)
    }

    /**
     * 删除数据
     * @param {Array|String} itemsToBeRemoved
     */
    remove (itemsToBeRemoved) {
        return Array.isArray(itemsToBeRemoved)
            ? Promise.all(
                itemsToBeRemoved.map(item => this._removeOneItem(item))
            )
            : this._removeOneItem(itemsToBeRemoved)
    }

    /**
     * 清除非白名单中的所有缓存数据
     * @param {Array} whiteList 白名单
     * @return {Promise}
     */
    clear (whiteList = []) {
        // 首先清除缓存
        this._clearFromCache(whiteList)

        return this.SEMap
            ? this.SEMap._clear(whiteList)
            : Promise.resolve()
    }

    /* -- 各种私有方法 -- */

    _saveOneItem ({
        key: prefix = '',
        data: rawData,
        expires = this.defaultExpires,
        syncParams = {},
        isEnableCache = true,
    }) {
        if (prefix === '') return Promise.reject(MSG_KEY)

        const key = this.storageKeyPrefix + (Object.keys(syncParams).length === 0
            ? prefix
            : `${prefix}?${getParamStrFromObj(syncParams)}`
        )

        const dataToSave = {
            rawData,
            expires: parseInt(Date.now() / 1000) + expires,
        }

        if (isEnableCache) {
            this._cache[key] = dataToSave
        }

        return this._setItem(key, dataToSave)
    }

    _loadOneItem ({
        key: prefix = '',
        syncFn = this.syncFnMap[prefix],
        expires = this.defaultExpires,
        syncParams = {},
        isAutoSave = true,
        isEnableCache = true,
    }) {
        if (prefix === '') return Promise.reject(MSG_KEY)

        const key = this.storageKeyPrefix + (Object.keys(syncParams).length === 0
            ? prefix
            : `${prefix}?${getParamStrFromObj(syncParams)}`
        )

        return this._findData({ key, syncFn, expires, syncParams, isAutoSave, isEnableCache })
    }

    /**
     * 删除单条数据
     * @param {String} key
     */
    _removeOneItem (key = '') {
        if (key === '') return Promise.reject(MSG_KEY)

        delete this._cache[this.storageKeyPrefix + key]

        return this.SEMap
            ? this.SEMap._removeItem(this.storageKeyPrefix + key)
            : Promise.resolve()
    }

    /**
     * 统一规范化 wx、localStorage、AsyncStorage 三种存储引擎的调用方法
     */
    _getFormatedSE () {
        // 未指定存储引擎
        if (!this.storageEngine) {
            console.warn(`There is NO valid storageEngine specified!\n Please use localStorage(for web), wx(for miniprogram) or AsyncStorage(for React Native) as the storageEngine...\nOtherwise data would be saved in cache(Memory) and lost after reload...`)

            return null
        }

        const getMapByPostfix = (postfix) => ({
            [postfix]: {
                _clear: this[`_clearBy${postfix.toUpperCase()}`].bind(this),
                _setItem: this[`_setItemBy${postfix.toUpperCase()}`].bind(this),
                _getItem: this[`_getItemBy${postfix.toUpperCase()}`].bind(this),
                _removeItem: this[`_removeItemBy${postfix.toUpperCase()}`].bind(this),
            },
        })

        const validSEMap = {
            ...getMapByPostfix('wx'),
            ...getMapByPostfix('ls'),
            ...getMapByPostfix('as'),
        }

        const SEMethods = {
            wx: ['getStorageInfo', 'removeStorageSync', 'setStorage', 'getStorage', 'removeStorage'],
            ls: ['getItem', 'setItem', 'removeItem'],
            as: ['getItem', 'setItem', 'multiRemove'],
        }

        const isSEHasThisProp = p => !!this.storageEngine[p]

        const isWX = SEMethods.wx.every(isSEHasThisProp)

        // 当前是小程序环境
        if (isWX) return validSEMap.wx

        // 部分指定 api 不存在
        const requiredApisNotFound =
            !SEMethods.ls.every(isSEHasThisProp) &&
            !SEMethods.as.every(isSEHasThisProp) &&
            !SEMethods.wx.every(isSEHasThisProp)

        if (requiredApisNotFound) {
            const missedLSApis = SEMethods.ls.filter(negate(isSEHasThisProp))
            const missedASApis = SEMethods.as.filter(negate(isSEHasThisProp))
            const missedWXApis = SEMethods.wx.filter(negate(isSEHasThisProp))

            missedLSApis.length &&
                console.warn(`Missing localStorage's required apis: ${missedLSApis.join(', ')}!`)
            missedASApis.length &&
                console.warn(`Missing AsyncStorage's required apis: ${missedASApis.join(', ')}!`)
            missedWXApis.length &&
                console.warn(`Missing wx's required apis: ${missedWXApis.join(', ')}!`)

            console.warn(`There is NO valid storageEngine specified!\n Please use localStorage(for web), wx(for miniprogram) or AsyncStorage(for React Native) as the storageEngine...\nOtherwise data would be saved in cache(Memory) and would be lost after reload...`)
        }

        try {
            const promiseTest = this.storageEngine.setItem('test', 'test')
            this.storageEngine.removeItem('test')
            const isPromise = !!(promiseTest && promiseTest.then)

            return isPromise ? validSEMap.as : validSEMap.ls
        } catch (e) {
            this.storageEngine = null
            return null
        }
    }

    /**
     * 获取过滤白名单后的 keys
     * @param {Array} whiteList 白名单
     * @return {Function}
     */
    _getFilteredKeys (whiteList) {
        const mergedWhiteList = [
            ...whiteList,
            ...this.whiteList,
        ]

        return keys => keys.filter(key => mergedWhiteList
            .every(item => !key.includes(item))
        )
    }

    /**
     * 清除非白名单中的数据
     * @param {Array} whiteList 白名单
     */
    _clearFromCache (whiteList) {
        this._getFilteredKeys(whiteList)(Object.keys(this._cache))
            .forEach(key => { delete this._cache[key] })
    }

    /**
     * 清除非白名单中的数据
     * @param {Array} whiteList 白名单
     */
    _clearByWX (whiteList) {
        return new Promise((resolve, reject) => this.storageEngine
            .getStorageInfo({
                fail: reject,
                success: ({ keys }) => {
                    this._getFilteredKeys(whiteList)(keys)
                        .forEach(key => this.storageEngine
                            .removeStorageSync(key)
                        )

                    return resolve()
                },
            })
        )
    }

    /**
     * 清除非白名单中的数据
     * @param {Array} whiteList 白名单
     */
    _clearByAS (whiteList) {
        return this.storageEngine
            .getAllKeys()
            .then(this._getFilteredKeys(whiteList))
            .then(keys => this.storageEngine.multiRemove(keys))
            .catch(console.error)
    }

    /**
     * 清除非白名单中的数据
     * @param {Array} whiteList 白名单
     */
    _clearByLS (whiteList) {
        const mergedWhiteList = [
            ...whiteList,
            ...this.whiteList,
        ]
        let notInWhiteListKeys = []

        for (let i = 0, len = this.storageEngine.length; i < len; i++) {
            const targetKey = this.storageEngine.key(i)
            const isNotInWhiteList = mergedWhiteList
                .every(item => !targetKey.includes(item))

            isNotInWhiteList &&
                notInWhiteListKeys.push(targetKey)
        }

        return Promise
            .all(notInWhiteListKeys.map(key => this.storageEngine.removeItem(key)))
            .catch(console.error)
    }

    /**
     * 保存数据
     * @param {String} key
     * @param {String} data
     */
    _setItem (key, data) {
        return this.SEMap
            ? this.SEMap._setItem(key, data)
            : Promise.resolve()
    }

    /**
     * 保存数据
     * @param {String} key
     * @param {String} data
     */
    _setItemByWX (key, data) {
        return new Promise(
            (success, fail) => this.storageEngine.setStorage({ key, data, fail, success })
        )
    }

    /**
     * 保存数据
     * @param {String} key
     * @param {String} data
     */
    _setItemByAS (key, data) {
        return this.storageEngine.setItem(key, data)
    }

    /**
     * 保存数据
     * @param {String} key
     * @param {String} data
     */
    _setItemByLS (key, data) {
        return Promise.resolve(
            this.storageEngine.setItem(key, JSON.stringify(data))
        )
    }

    /**
     * 获取数据
     * @param {String} key
     */
    _getItem (key) {
        return this.SEMap
            ? this.SEMap._getItem(key)
            : Promise.resolve()
    }

    /**
     * 获取数据
     * @param {String} key
     */
    _getItemByWX (key) {
        return new Promise(
            (success, fail) => this.storageEngine.getStorage({
                key,
                fail,
                success: ({ data }) => success(data),
            })
        )
    }

    /**
     * 获取数据
     * @param {String} key
     */
    _getItemByAS (key) {
        return this.storageEngine.getItem(key)
    }

    /**
     * 获取数据
     * @param {String} key
     */
    _getItemByLS (key) {
        return Promise.resolve(this.storageEngine.getItem(key))
    }

    /**
     * 删除单条数据
     * @param {String} key
     */
    _removeItemByWX (key) {
        return new Promise(
            (success, fail) => this.storageEngine.removeStorage({ key, fail, success })
        )
    }

    /**
     * 删除单条数据
     * @param {String} key
     */
    _removeItemByAS (key) {
        return this.storageEngine.removeItem(key)
    }

    /**
     * 删除单条数据
     * @param {String} key
     */
    _removeItemByLS (key) {
        return Promise.resolve(this.storageEngine.removeItem(key))
    }

    /**
     * 从 cache 中寻找数据，如果没寻找到则读取 storage
     * @param {String} key
     * @param {Boolean} isEnableCache 是否启用 cache
     */
    _findData ({ key, isEnableCache, ...rest }) {
        const cacheData = this._cache[key]

        return (isEnableCache && cacheData)
            // 返回 cache 数据
            ? this._loadData({ key, cacheData, ...rest })
            // 读取 storage
            : this._getItem(key)
                // 如果有缓存则返回 cacheData
                .then(cacheData => this._loadData({ key, cacheData, ...rest }))
                // 没有缓存则不传 cacheData，执行同步数据逻辑（请求接口等）
                .catch(() => this._loadData({ key, ...rest }))
    }

    /**
     * 读取数据函数：
     * 1.如果参数中传了 cacheData，且数据未过期则返回缓存数据（可能来自 cache 或者 storage）
     * 2.如果没有缓存数据或已过期，同时也没有对应的同步数据的方法，那么抛出错误
     * 3.调用同步数据方法
     * @param {String} key
     * @param {Function} syncFn 同步数据的方法
     */
    _loadData ({
        key,
        syncFn,
        reject,
        resolve,
        expires,
        cacheData,
        syncParams,
        isAutoSave,
    }) {
        const isCacheDataStr = typeof cacheData === 'string'
        const isNoCacheData = cacheData === null || cacheData === undefined

        const syncResolveFn = () => syncFn(syncParams)
            // 格式化数据结构
            .then(data => (data.code == null && data.data == null) ? { data } : data)
            // 格式化数据类型
            .then(({ code = 0, data }) => ({ code: +code, data }))
            .then(({ code, data }) => {
                if (code !== 0 || !isAutoSave) return { code, data }

                this.save({
                    key: key.replace(this.storageKeyPrefix, ''),
                    data: { code, data },
                    expires,
                }).catch(console.warn)

                return { code, data }
            })

        const syncRejectFn = () => Promise.reject(
            new Error(JSON.stringify({ key, syncFn }))
        )

        // 没有缓存数据，直接调用方法同步数据
        if (isNoCacheData) {
            return syncFn ? syncResolveFn() : syncRejectFn()
        }

        // cacheData 转为对象
        cacheData = isCacheDataStr ? JSON.parse(cacheData) : cacheData

        const { expires: cacheExpires, rawData } = cacheData
        const isDataFresh = cacheExpires >= parseInt(Date.now() / 1000)

        return isDataFresh
            ? Promise.resolve(rawData)
            : !syncFn
                ? syncRejectFn()
                : syncResolveFn()
    }
}
