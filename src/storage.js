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
 * @Last modified by:   stevezyyang
 * @Last modified time: 2018-Feb-26 16:26:46
 */

import { version } from '../package.json'
import {
    negate,
    checkKey,
    jsonParse,
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

console.log(`[TUA-STORAGE]: Version: ${version}`)

// 缩写常用函数
const pAll = Promise.all.bind(Promise)
const pRej = Promise.reject.bind(Promise)
const pRes = Promise.resolve.bind(Promise)
const stringify = JSON.stringify.bind(JSON)

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

        this.SEMap = this._getFormatedSE()

        this._cache = Object.create(null)

        const clearExpiredData = this._clearExpiredData.bind(this)
        // 轮询扫描缓存，清除过期数据
        setTimeout(clearExpiredData, 0)
        setInterval(clearExpiredData, 1000 * 60)
    }

    /* -- 各种对外暴露方法 -- */

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
     * @param {Boolean} items.isForceUpdate 是否直接调用 syncFn
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
        isForceUpdate = false,
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
            isForceUpdate,
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
            return pRes()
        }

        if (isEnableCache) {
            this._cache[key] = dataToSave
        }

        return this.SEMap._setItem(key, dataToSave)
    }

    /* -- 各种私有方法 -- */

    /**
     * 清除 cache 中非白名单中的数据
     * @param {Array} whiteList 白名单
     */
    _clearFromCache (whiteList) {
        this._getKeysByWhiteList(whiteList)(Object.keys(this._cache))
            .forEach(key => { delete this._cache[key] })
    }

    /**
     * 清除 cache 中已过期的数据
     */
    _clearExpiredDataFromCache () {
        Object.keys(this._cache)
            .filter(key => this._isDataExpired(this._cache[key]))
            .map((key) => { delete this._cache[key] })
    }

    /**
     * 清除已过期的数据
     */
    _clearExpiredData () {
        const { _getItem, _getAllKeys, _removeItem } = this.SEMap

        // 清除 cache 中过期数据
        this._clearExpiredDataFromCache()

        return _getAllKeys()
            .then(keys => keys.map(
                key => _getItem(key)
                    .then(jsonParse)
                    // 不处理 JSON.parse 的错误
                    .catch(() => {})
                    .then(this._isDataExpired.bind(this))
                    .then(isExpired => (
                        isExpired ? _removeItem(key) : pRes()
                    ))
            ))
            .then(pAll)
    }

    /**
     * 从 cache 中寻找数据，如果没寻找到则读取 storage
     * @param {Object} item
     * @param {String} item.key 前缀
     * @param {Boolean} item.isEnableCache 是否启用 cache
     * @param {Boolean} item.isForceUpdate 是否直接调用 syncFn
     * @return {Promise}
     */
    _findData ({ key, isEnableCache, isForceUpdate, ...rest }) {
        // 忽略缓存直接去同步数据
        if (isForceUpdate) {
            return this._loadData({ key, ...rest })
        }

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
     * 统一规范化 AsyncStorage 的各个方法
     * @return {Object}
     */
    _formatMethodsByAS () {
        const {
            getItem,
            setItem,
            getAllKeys,
            removeItem,
            multiRemove,
        } = this.SE

        const bindFnToSE = fn => fn.bind(this.SE)

        /**
         * 清除非白名单中的数据
         * @param {Array} whiteList 白名单
         * @return {Promise}
         */
        const _clear = (whiteList) => (
            _getAllKeys()
                .then(this._getKeysByWhiteList(whiteList))
                .then(bindFnToSE(multiRemove))
                .catch(console.error)
        )
        /**
         * 适配 AsyncStorage 读取数据
         * @param {String} key
         * @return {Promise}
         */
        const _getItem = bindFnToSE(getItem)
        /**
         * 适配 AsyncStorage 保存数据
         * @param {String} key
         * @param {String} data
         * @return {Promise}
         */
        const _setItem = bindFnToSE(setItem)
        /**
         * 返回 AsyncStorage 中的所有 key
         * @return {Promise}
         */
        const _getAllKeys = bindFnToSE(getAllKeys)
        /**
         * 适配 AsyncStorage 删除单条数据
         * @param {String} key
         * @return {Promise}
         */
        const _removeItem = bindFnToSE(removeItem)

        return { _clear, _getItem, _setItem, _getAllKeys, _removeItem }
    }

    /**
     * 统一规范化 LocalStorage 的各个方法
     * @return {Object}
     */
    _formatMethodsByLS () {
        const {
            getItem,
            setItem,
            removeItem,
        } = this.SE

        const promisify = (fn) => (...args) => pRes(
            fn.apply(this.SE, args)
        )

        /**
         * 清除非白名单中的数据
         * @param {Array} whiteList 白名单
         * @return {Promise}
         */
        const _clear = (whiteList) => {
            const mergedWhiteList = [
                ...whiteList,
                ...this.whiteList,
            ]
            const isNotInWhiteList = key => mergedWhiteList
                .every(item => !key.includes(item))

            return _getAllKeys()
                .then(keys => keys.filter(isNotInWhiteList))
                .then(keys => keys.map(k => _removeItem(k)))
                .then(pAll)
                .catch(console.error)
        }
        /**
         * 适配 localStorage 读取数据
         * @param {String} key
         * @return {Promise}
         */
        const _getItem = promisify(getItem)
        /**
         * 适配 localStorage 保存数据
         * @param {String} key
         * @param {String} data
         * @return {Promise}
         */
        const _setItem = (key, data) => promisify(setItem)(key, stringify(data))
        /**
         * 返回 localStorage 中的所有 key
         * @return {Array} keys
         */
        const _getAllKeys = () => {
            const { key: keyFn, length } = this.SE
            const keys = []

            for (let i = 0, len = length; i < len; i++) {
                const key = keyFn.call(this.SE, i)

                keys.push(key)
            }

            return pRes(keys)
        }
        /**
         * 适配 localStorage 删除单条数据
         * @param {String} key
         * @return {Promise}
         */
        const _removeItem = promisify(removeItem)

        return { _clear, _getItem, _setItem, _getAllKeys, _removeItem }
    }

    /**
     * 统一规范化小程序的各个方法
     * @return {Object}
     */
    _formatMethodsByWX () {
        const {
            getStorage,
            setStorage,
            removeStorage,
            getStorageInfo,
        } = this.SE

        const promisify = (fn) => (args = {}) => new Promise(
            (success, fail) => fn.call(
                this.SE,
                { fail, success, ...args }
            )
        )

        const rmFn = promisify(removeStorage)
        const getFn = promisify(getStorage)
        const setFn = promisify(setStorage)
        const infoFn = promisify(getStorageInfo)

        /**
         * 清除非白名单中的数据
         * @param {Array} whiteList 白名单
         * @return {Promise}
         */
        const _clear = (whiteList) => (
            _getAllKeys()
                .then(this._getKeysByWhiteList(whiteList))
                .then((keys) => keys.map(_removeItem))
                .then(pAll)
        )
        /**
         * 适配小程序读取数据
         * @param {String} key
         * @return {Promise}
         */
        const _getItem = (key) => getFn({ key }).then(({ data }) => data)
        /**
         * 适配小程序保存数据
         * @param {String} key
         * @param {String} data
         * @return {Promise}
         */
        const _setItem = (key, data) => setFn({ key, data })
        /**
         * 适配小程序删除单条数据
         * @param {String} key
         * @return {Promise}
         */
        const _removeItem = (key) => rmFn({ key })
        /**
         * 返回小程序中的所有 key
         * @return {Promise}
         */
        const _getAllKeys = () => infoFn().then(({ keys }) => keys)

        return { _clear, _getItem, _setItem, _getAllKeys, _removeItem }
    }

    /**
     * 统一规范化 wx、localStorage、AsyncStorage 三种存储引擎的调用方法
     * @return {Object | Null}
     */
    _getFormatedSE () {
        const defaultSEMap = {
            _clear: pRes,
            _setItem: pRes,
            _getItem: pRes,
            _getAllKeys: () => pRes([]),
            _removeItem: pRes,
        }

        // 未指定存储引擎
        if (!this.SE) {
            console.warn(SE_ERROR_MSG)

            return defaultSEMap
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
            return defaultSEMap
        }
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

        const syncResolveFn = () => {
            const getSameKey = ({ key: taskKey }) => taskKey === key
            const sameTask = this.taskList.find(getSameKey)
            const finallyRemoveTask = (err) => {
                err && console.error(err)

                this.taskList = this.taskList
                    .filter(negate(getSameKey))
            }

            // 如果有相同的任务，则共用该任务
            if (sameTask) return sameTask.task

            const originTask = syncFn(syncParams)
            const isPromise = !!(originTask && originTask.then)

            if (!isPromise) return pRej(ERROR_MSG.PROMISE)

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

        const syncRejectFn = () => pRej(new Error(stringify({ key, syncFn })))

        // 没有缓存数据，直接调用方法同步数据
        if (isNoCacheData) {
            return syncFn ? syncResolveFn() : syncRejectFn()
        }

        // cacheData 转为对象
        cacheData = jsonParse(cacheData)

        const { expires: cacheExpires, rawData } = cacheData
        const isDataExpired = this._isDataExpired({ expires: cacheExpires })

        // 若数据未过期，则直接用缓存数据，
        // 否则调用同步数据函数，若没有同步函数则返回错误
        return isDataExpired
            ? !syncFn
                ? syncRejectFn()
                : syncResolveFn()
            : pRes(rawData)
    }

    /**
     * 判断数据是否已过期
     * @param {Object} param
     * @param {Number} param.expires 数据的到期时间
     * @return {Boolean}
     */
    _isDataExpired (param) {
        // 不处理数据结构不匹配的数据
        if (!param) return false

        const { expires = this.neverExpireMark } = param

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
}
