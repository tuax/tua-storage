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
 * @Last modified by:   steve
 * @Last modified time: 2018-Mar-13 22:31:16
 */

import { version } from '../package.json'
import {
    negate,
    checkKey,
    ERROR_MSG,
    DEFAULT_EXPIRES,
    supportArrayParam,
    getParamStrFromObj,
    DEFAULT_KEY_PREFIX,
} from './utils'

const SE_ERROR_MSG = `There is NO valid storageEngine specified!
Please use:
* wx (for miniprogram),
* localStorage (for web),
* AsyncStorage (for React Native)
as the storageEngine...
Otherwise data would be saved in cache(Memory) and lost after reload...`

console.log(`Tua-Storage Version: ${version}`)

export default class Storage {
    constructor ({
        syncFnMap = {},
        whiteList = [],
        storageEngine = null, // 可传递 wx / localStorage / AsyncStorage
        defaultExpires = DEFAULT_EXPIRES,
        storageKeyPrefix = DEFAULT_KEY_PREFIX,
    } = {}) {
        this.SE = storageEngine
        this.taskList = []
        this.whiteList = whiteList
        this.syncFnMap = syncFnMap
        this.defaultExpires = defaultExpires
        this.neverExpireMark = null // 永不超时的标志
        this.storageKeyPrefix = storageKeyPrefix

        const resolveFn = () => Promise.resolve()

        this.SEMap = this._getFormatedSE() || {
            _clear: resolveFn,
            _setItem: resolveFn,
            _getItem: resolveFn,
            _getAllKeys: () => Promise.resolve([]),
            _removeItem: resolveFn,
        }

        this._cache = Object.create(null)
        this.clear([this.storageKeyPrefix])
        this._clearExpiredData()
    }

    /* -- 各种对外暴露方法 -- */

    /**
     * 保存数据，可传递数组或单对象
     * @param {Array|Object} items
     * @param {String} items.key 前缀
     * @param {Object|String|Number} items.data 待保存数据
     * @param {Number} items.expires 超时时间（单位：秒）
     * @param {String} items.fullKey 完整关键词
     * @param {Object} items.syncParams 同步参数对象
     * @param {Boolean} items.isEnableCache 是否使用内存缓存
     * @return {Promise}
     */
    @supportArrayParam
    @checkKey
    save ({
        key: prefix = '',
        data: rawData,
        expires = this.defaultExpires,
        fullKey = '',
        syncParams = {},
        isEnableCache = true,
    }) {
        const isNeverExpired = this._isNeverExpired(expires)
        const realExpires = isNeverExpired
            // 永不超时
            ? this.neverExpireMark
            : parseInt(Date.now() / 1000) + expires

        const key = fullKey ||
            this._getQueryKeyStr({ prefix, syncParams })

        const dataToSave = { rawData, expires: realExpires }

        if (!isNeverExpired && expires <= 0) {
            // 不保存注定过期的数据
            return Promise.resolve()
        }

        if (isEnableCache) {
            this._cache[key] = dataToSave
        }

        return this.SEMap._setItem(key, dataToSave)
    }

    /**
     * 读取数据，可传递数组或单对象
     * @param {Array|Object} items
     * @param {String} items.key 前缀
     * @param {Function} items.syncFn 同步数据的方法
     * @param {Number} items.expires 超时时间（单位：秒）
     * @param {String} items.fullKey 完整关键词
     * @param {Object} items.syncParams 同步参数对象
     * @param {Boolean} items.isAutoSave 是否自动保存
     * @param {Boolean} items.isEnableCache 是否使用内存缓存
     * @return {Promise}
     */
    @supportArrayParam
    @checkKey
    load ({
        key: prefix = '',
        syncFn = this.syncFnMap[prefix],
        expires = this.defaultExpires,
        fullKey = '',
        syncParams = {},
        isAutoSave = true,
        isEnableCache = true,
    }) {
        const key = fullKey ||
            this._getQueryKeyStr({ prefix, syncParams })

        return this._findData({
            key,
            syncFn,
            expires,
            syncParams,
            isAutoSave,
            isEnableCache,
        })
    }

    /**
     * 删除数据，可传递数组或字符串或单对象(fullKey)
     * @param {Array|String|Object} items
     * @param {String|Object} items.prefix 数据前缀
     * @param {String} items.prefix.fullKey 完整的数据前缀
     * @return {Promise}
     */
    @supportArrayParam
    @checkKey
    remove (prefix) {
        const fullKey = typeof prefix === 'object'
            ? prefix.fullKey
            : ''

        const key = fullKey || this.storageKeyPrefix + prefix

        delete this._cache[key]

        return this.SEMap._removeItem(key)
    }

    /**
     * 清除非白名单中的所有缓存数据
     * @param {Array} whiteList 白名单
     * @return {Promise}
     */
    clear (whiteList = []) {
        // 首先清除缓存
        this._clearFromCache(whiteList)

        return this.SEMap._clear(whiteList)
    }

    /* -- 各种私有方法 -- */

    /**
     * 判断数据是否已过期
     * @param {Object} item
     * @param {Number} item.expires 数据的到期时间
     * @return {Boolean}
     */
    _isDataExpired ({ expires = this.neverExpireMark }) {
        return this._isNeverExpired(expires)
            // 永不超时
            ? false
            : +expires < parseInt(Date.now() / 1000)
    }

    /**
     * 判断是否永不超时
     * @param {Number} expires
     * @return {Boolean}
     */
    _isNeverExpired (expires) {
        return expires === this.neverExpireMark
    }

    /**
     * 清除非白名单中的数据
     * @param {Array} whiteList 白名单
     */
    _clearFromCache (whiteList) {
        this._getKeysByWhiteList(whiteList)(Object.keys(this._cache))
            .forEach(key => { delete this._cache[key] })
    }

    /**
     * 清除已过期的数据
     */
    _clearExpiredData () {
        const { _getItem, _getAllKeys, _removeItem } = this.SEMap

        return _getAllKeys()
            .then(keys => keys.map(
                key => _getItem(key)
                    .then(item => JSON.parse(item))
                    .then(this._isDataExpired.bind(this))
                    .then(isExpired => (
                        isExpired ? _removeItem(key) : Promise.resolve()
                    ))
                    .catch(console.error)
            ))
            .then(Promise.all.bind(Promise))
    }

    /**
     * 根据前缀和同步参数，获取完整请求关键词字符串
     * @param {String} prefix 前缀
     * @param {Object} syncParams 同步参数对象
     * @return {String} 完整请求关键词字符串
     */
    _getQueryKeyStr ({ prefix, syncParams }) {
        return this.storageKeyPrefix + (
            Object.keys(syncParams).length === 0
                ? prefix
                : `${prefix}?${getParamStrFromObj(syncParams)}`
        )
    }

    /**
     * 获取过滤白名单后的 keys
     * @param {Array} whiteList 白名单
     * @return {Function}
     */
    _getKeysByWhiteList (whiteList) {
        const mergedWhiteList = [
            ...whiteList,
            ...this.whiteList,
        ]

        return keys => keys.filter(
            key => mergedWhiteList
                .every(item => !key.includes(item))
        )
    }

    /**
     * 统一规范化 wx、localStorage、AsyncStorage 三种存储引擎的调用方法
     * @return {Object | Null}
     */
    _getFormatedSE () {
        // 未指定存储引擎
        if (!this.SE) {
            console.warn(SE_ERROR_MSG)

            return null
        }

        const SEMethods = {
            wx: [
                'setStorage',
                'getStorage',
                'removeStorage',
                'getStorageInfo',
            ],
            ls: ['getItem', 'setItem', 'removeItem'],
            as: ['getItem', 'setItem', 'multiRemove'],
        }

        const isSEHasThisProp = p => !!this.SE[p]

        const isWX = SEMethods.wx.every(isSEHasThisProp)

        // 当前是支持所有必需小程序 api 的环境
        if (isWX) return this._formatMethodsByWX()

        // 部分必需 api 不存在
        const missedLSApis = SEMethods.ls.filter(negate(isSEHasThisProp))
        const missedASApis = SEMethods.as.filter(negate(isSEHasThisProp))
        const missedWXApis = SEMethods.wx.filter(negate(isSEHasThisProp))

        const requiredApisNotFound =
            missedLSApis.length &&
            missedASApis.length &&
            missedWXApis.length

        if (requiredApisNotFound) {
            const displayMissingApis = (apis) =>
                console.warn(`Missing required apis:\n* ${apis.join('\n* ')}`)

            missedLSApis.length && displayMissingApis(missedLSApis)
            missedASApis.length && displayMissingApis(missedASApis)
            missedWXApis.length && displayMissingApis(missedWXApis)

            console.warn(SE_ERROR_MSG)
        }

        try {
            const promiseTest = this.SE.setItem('test', 'test')
            this.SE.removeItem('test')
            const isPromise = !!(promiseTest && promiseTest.then)

            return isPromise
                ? this._formatMethodsByAS()
                : this._formatMethodsByLS()
        } catch (e) {
            return null
        }
    }

    /**
     * 统一规范化小程序的各个方法
     * @return {Object}
     */
    _formatMethodsByWX () {
        const {
            setStorage,
            getStorage,
            removeStorage,
            getStorageInfo,
        } = this.SE

        const promisifyWxApi = (fn) => (args = {}) => new Promise(
            (success, fail) => fn.call(
                this.SE,
                { fail, success, ...args }
            )
        )

        const rmPromise = promisifyWxApi(removeStorage)
        const setPromise = promisifyWxApi(setStorage)
        const getPromise = promisifyWxApi(getStorage)
        const infoPromise = promisifyWxApi(getStorageInfo)

        const _setItem = (key, data) => setPromise({ key, data })
        const _getItem = (key) => getPromise({ key }).then(({ data }) => data)
        const _removeItem = (key) => rmPromise({ key })
        const _getAllKeys = () => infoPromise().then(({ keys }) => keys)

        return {
            /**
             * 清除非白名单中的数据
             * @param {Array} whiteList 白名单
             * @return {Promise}
             */
            _clear: (whiteList) => (
                _getAllKeys()
                    .then(this._getKeysByWhiteList(whiteList))
                    .then((keys) => keys.map(_removeItem))
                    .then(Promise.all.bind(Promise))
            ),
            /**
             * 适配小程序保存数据
             * @param {String} key
             * @param {String} data
             * @return {Promise}
             */
            _setItem,
            /**
             * 适配小程序读取数据
             * @param {String} key
             * @return {Promise}
             */
            _getItem,
            /**
             * 返回小程序中的所有 key
             * @return {Promise}
             */
            _getAllKeys,
            /**
             * 适配小程序删除单条数据
             * @param {String} key
             * @return {Promise}
             */
            _removeItem,
        }
    }

    /**
     * 统一规范化 AsyncStorage 的各个方法
     * @return {Object}
     */
    _formatMethodsByAS () {
        const {
            setItem,
            getItem,
            removeItem,
            getAllKeys,
            multiRemove,
        } = this.SE

        const bindFnToSE = fn => fn.bind(this.SE)
        const _setItem = bindFnToSE(setItem)
        const _getItem = bindFnToSE(getItem)
        const _removeItem = bindFnToSE(removeItem)
        const _getAllKeys = bindFnToSE(getAllKeys)
        const _multiRemove = bindFnToSE(multiRemove)

        return {
            /**
             * 清除非白名单中的数据
             * @param {Array} whiteList 白名单
             * @return {Promise}
             */
            _clear: (whiteList) => (
                _getAllKeys()
                    .then(this._getKeysByWhiteList(whiteList))
                    .then(_multiRemove)
                    .catch(console.error)
            ),
            /**
             * 适配 AsyncStorage 保存数据
             * @param {String} key
             * @param {String} data
             * @return {Promise}
             */
            _setItem,
            /**
             * 适配 AsyncStorage 读取数据
             * @param {String} key
             * @return {Promise}
             */
            _getItem,
            /**
             * 返回 AsyncStorage 中的所有 key
             * @return {Promise}
             */
            _getAllKeys,
            /**
             * 适配 AsyncStorage 删除单条数据
             * @param {String} key
             * @return {Promise}
             */
            _removeItem,
        }
    }

    /**
     * 统一规范化 LocalStorage 的各个方法
     * @return {Object}
     */
    _formatMethodsByLS () {
        const {
            setItem,
            getItem,
            removeItem,
        } = this.SE

        const promisifyByResolve = (fn) => (...args) => Promise.resolve(
            fn.apply(this.SE, args)
        )

        const _setItem = promisifyByResolve(setItem)
        const _getItem = promisifyByResolve(getItem)
        const _removeItem = promisifyByResolve(removeItem)

        const _getAllKeys = () => {
            const { key: keyFn, length } = this.SE
            const keys = []

            for (let i = 0, len = length; i < len; i++) {
                const key = keyFn.call(this.SE, i)

                keys.push(key)
            }

            return Promise.resolve(keys)
        }

        return {
            /**
             * 清除非白名单中的数据
             * @param {Array} whiteList 白名单
             * @return {Promise}
             */
            _clear: (whiteList) => {
                const mergedWhiteList = [
                    ...whiteList,
                    ...this.whiteList,
                ]
                const filterNotInWhiteList = key => mergedWhiteList
                    .every(item => !key.includes(item))

                return _getAllKeys()
                    .then(keys => keys.filter(filterNotInWhiteList))
                    .then(keys => keys.map(k => _removeItem(k)))
                    .then(Promise.all.bind(Promise))
                    .catch(console.error)
            },
            /**
             * 适配 localStorage 保存数据
             * @param {String} key
             * @param {String} data
             * @return {Promise}
             */
            _setItem: (key, data) => (
                _setItem(
                    key,
                    JSON.stringify(data)
                )
            ),
            /**
             * 适配 localStorage 读取数据
             * @param {String} key
             * @return {Promise}
             */
            _getItem,
            /**
             * 返回 localStorage 中的所有 key
             * @return {Array} keys
             */
            _getAllKeys,
            /**
             * 适配 localStorage 删除单条数据
             * @param {String} key
             * @return {Promise}
             */
            _removeItem,
        }
    }

    /**
     * 从 cache 中寻找数据，如果没寻找到则读取 storage
     * @param {Object} item
     * @param {String} item.key 前缀
     * @param {Boolean} item.isEnableCache 是否启用 cache
     * @return {Promise}
     */
    _findData ({ key, isEnableCache, ...rest }) {
        const cacheData = this._cache[key]

        return (isEnableCache && cacheData)
            // 返回 cache 数据
            ? this._loadData({ key, cacheData, ...rest })
            // 读取 storage
            : this.SEMap._getItem(key)
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
     * @param {Object} item
     * @param {String} item.key 前缀
     * @param {Function} item.syncFn 同步数据的方法
     * @param {Number} item.expires 超时时间（单位：秒）
     * @param {Object} item.cacheData 缓存数据
     * @param {Object} item.syncParams 同步参数对象
     * @param {Boolean} item.isAutoSave 是否自动保存
     * @return {Promise}
     */
    _loadData ({
        key,
        syncFn,
        expires,
        cacheData,
        syncParams,
        isAutoSave,
    }) {
        const isNoCacheData = cacheData === null || cacheData === undefined
        const isCacheDataStr = typeof cacheData === 'string'

        const syncResolveFn = () => {
            const getSameKey = ({ key: taskKey }) => taskKey === key
            const sameTask = this.taskList.find(getSameKey)
            const finallyRemoveTask = () => {
                this.taskList = this.taskList
                    .filter(negate(getSameKey))
            }

            // 如果有相同的任务，则共用该任务
            if (sameTask) return sameTask.task

            const originTask = syncFn(syncParams)
            const isPromise = !!(originTask && originTask.then)

            if (!isPromise) return Promise.reject(ERROR_MSG.PROMISE)

            const task = originTask
                // 格式化数据结构
                .then(data => (data.code == null && data.data == null)
                    ? { data }
                    : data
                )
                // 格式化数据类型
                .then(({ code = 0, data }) => ({ code: +code, data }))
                .then(({ code, data }) => {
                    // 应该首先删除任务
                    finallyRemoveTask()

                    if (code !== 0 || !isAutoSave) return { code, data }

                    this.save({
                        // 防止无限添加前缀
                        key: key.replace(this.storageKeyPrefix, ''),
                        data: { code, data },
                        expires,
                    }).catch(console.warn)

                    return { code, data }
                })
                .catch(finallyRemoveTask)

            this.taskList.push({ key, task })

            return task
        }

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
        const isDataExpired = this._isDataExpired({ expires: cacheExpires })

        // 若数据未过期，则直接用缓存数据，
        // 否则调用同步数据函数，若没有同步函数则返回错误
        return isDataExpired
            ? !syncFn
                ? syncRejectFn()
                : syncResolveFn()
            : Promise.resolve(rawData)
    }
}
