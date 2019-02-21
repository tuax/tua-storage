/**
 * @file: 对外暴露以下方法：
 *   1.构造函数：用于初始化 TuaStorage
 *
 * 异步函数，返回 Promise
 *   2.save: 保存函数
 *   3.load: 读取函数
 *   4.clear: 清除函数
 *   5.remove: 删除函数
 *   6.getInfo: 获取信息函数
 *
 * 同步函数
 *   7.saveSync: 保存函数
 *   8.loadSync: 读取函数
 *   9.clearSync: 清除函数
 *   10.removeSync: 删除函数
 *   11.getInfoSync: 获取信息函数
 */

import { version } from '../package.json'
import {
    pAll,
    pRej,
    pRes,
    logger,
    negate,
    checkKey,
    jsonParse,
    stringify,
    getFullKey,
    getDataToSave,
    supportArrayParam,
    getParamStrFromObj,
} from './utils'
import {
    ERROR_MSGS,
    DEFAULT_EXPIRES,
    DEFAULT_KEY_PREFIX,
    REQUIRED_SE_METHODS,
} from './constants'
import formatMethodsByAS from './storageEngines/asyncStorage'
import formatMethodsByLS from './storageEngines/localStorage'
import formatMethodsByWX from './storageEngines/wxStorage'

logger.log(`Version: ${version}`)

class TuaStorage {
    constructor ({
        whiteList = [],
        syncFnMap = Object.create(null),
        storageEngine = null,
        defaultExpires = DEFAULT_EXPIRES,
        neverExpireMark = null,
        storageKeyPrefix = DEFAULT_KEY_PREFIX,

        // auto clear
        autoClearTime = 60, // 默认1分钟，以秒为单位
        isEnableAutoClear = true,
    } = {}) {
        this.SE = storageEngine
        this.taskList = []
        this.whiteList = whiteList
        this.syncFnMap = syncFnMap
        this.defaultExpires = defaultExpires
        this.neverExpireMark = neverExpireMark
        this.storageKeyPrefix = storageKeyPrefix

        // 内存缓存
        this._cache = Object.create(null)

        // 根据 SE 获取各种适配好的方法对象
        this.SEMethods = this._getSEMethods()

        // 轮询扫描缓存，清除过期数据
        if (isEnableAutoClear) {
            const clearExpiredData = this._clearExpiredData.bind(this)
            setTimeout(clearExpiredData, 0)
            setInterval(clearExpiredData, autoClearTime * 1000)
        }
    }

    /* -- 各种对外暴露方法 -- */

    /**
     * 异步保存数据，可传递数组或单对象
     * @param {Array|Object} items
     * @param {String} items.key 前缀
     * @param {Object|String|Number} items.data 待保存数据
     * @param {Number} items.expires 超时时间（单位：秒）
     * @param {String} items.fullKey 完整关键词
     * @param {Object} items.syncParams 同步参数对象
     * @param {Boolean} items.isEnableCache 是否使用内存缓存
     * @return {Promise}
     */
    @supportArrayParam()
    @checkKey
    @getFullKey
    @getDataToSave
    save ({
        key,
        dataToSave,
        isEnableCache = true,
    }) {
        if (isEnableCache) {
            this._cache[key] = dataToSave
        }

        return this.SEMethods._setItem(key, dataToSave)
    }

    /**
     * 同步保存数据，可传递数组或单对象
     * @param {Array|Object} items
     * @param {String} items.key 前缀
     * @param {Object|String|Number} items.data 待保存数据
     * @param {Number} items.expires 超时时间（单位：秒）
     * @param {String} items.fullKey 完整关键词
     * @param {Object} items.syncParams 同步参数对象
     * @param {Boolean} items.isEnableCache 是否使用内存缓存
     * @return {Promise}
     */
    @supportArrayParam()
    @checkKey
    @getFullKey
    @getDataToSave
    saveSync ({
        key,
        dataToSave,
        isEnableCache = true,
    }) {
        try {
            if (isEnableCache) {
                this._cache[key] = dataToSave
            }

            this.SEMethods._setItemSync(key, dataToSave)
        } catch (err) {
            delete this._cache[key]

            throw err
        }
    }

    /**
     * 异步读取数据，可传递数组或单对象
     * @param {Array|Object} items
     * @param {String} items.key 前缀
     * @param {Function} items.syncFn 同步数据的方法
     * @param {String} items.fullKey 完整关键词
     * @param {Object} items.syncParams 同步参数对象
     * @param {Number} items.expires 超时时间（单位：秒）
     * @param {Boolean} items.isAutoSave 是否自动保存
     * @param {Boolean} items.isEnableCache 是否使用内存缓存
     * @param {Boolean} items.isForceUpdate 是否直接调用 syncFn
     * @return {Promise}
     */
    @supportArrayParam()
    @checkKey
    @getFullKey
    load ({
        key,
        prefix,
        syncFn = this.syncFnMap[prefix],
        syncParams,
        ...rest
    }) {
        return this._findData({ key, syncFn, syncParams, ...rest })
    }

    /**
     * 同步读取数据，可传递数组或单对象
     * @param {Array|Object} items
     * @param {String} items.key 前缀
     * @param {String} items.fullKey 完整关键词
     * @param {Object} items.syncParams 同步参数对象
     * @return {Promise}
     */
    @supportArrayParam(false)
    @checkKey
    @getFullKey
    loadSync ({ key, isEnableCache = true }) {
        const cacheData = this._cache[key]
        const loadedData = (isEnableCache && cacheData)
            ? cacheData
            : this.SEMethods._getItemSync(key)

        // 没有数据直接返回 undefined
        if (!loadedData) return undefined

        // 数据未过期才返回数据
        const { expires, rawData } = jsonParse(loadedData)
        if (!this._isDataExpired({ expires })) return rawData
    }

    /**
     * 异步清除非白名单中的所有缓存数据
     * @param {String[]} whiteList 白名单
     * @return {Promise}
     */
    clear (whiteList = []) {
        // 首先清除缓存
        this._clearFromCache(whiteList)

        return this.SEMethods._clear(whiteList)
    }

    /**
     * 同步清除非白名单中的所有缓存数据
     * @param {String[]} whiteList 白名单
     * @return {Promise}
     */
    clearSync (whiteList = []) {
        // 首先清除缓存
        this._clearFromCache(whiteList)
        this.SEMethods._clearSync(whiteList)
    }

    /**
     * 异步删除数据，可传递数组或字符串或单对象(fullKey)
     * @param {String[]|String|Object} items
     * @param {String|Object} items.prefix 数据前缀
     * @param {String} items.prefix.fullKey 完整的数据前缀
     * @return {Promise}
     */
    @supportArrayParam()
    @checkKey
    remove (prefix) {
        const fullKey = typeof prefix === 'object'
            ? prefix.fullKey
            : ''

        const key = fullKey || this.storageKeyPrefix + prefix
        delete this._cache[key]

        return this.SEMethods._removeItem(key)
    }

    /**
     * 同步删除数据，可传递数组或字符串或单对象(fullKey)
     * @param {String[]|String|Object} items
     * @param {String|Object} items.prefix 数据前缀
     * @param {String} items.prefix.fullKey 完整的数据前缀
     * @return {Promise}
     */
    @supportArrayParam()
    @checkKey
    removeSync (prefix) {
        const fullKey = typeof prefix === 'object'
            ? prefix.fullKey
            : ''
        const key = fullKey || this.storageKeyPrefix + prefix

        delete this._cache[key]
        this.SEMethods._removeItemSync(key)
    }

    /**
     * 异步获取当前 storage 的相关信息
     * @return {Promise}
     */
    getInfo () {
        return this.SEMethods._getInfo()
    }

    /**
     * 同步获取当前 storage 的相关信息
     * @return {Promise}
     */
    getInfoSync () {
        return this.SEMethods._getInfoSync()
    }

    /* -- 各种私有方法 -- */

    _getAllCacheKeys () {
        return Object.keys(this._cache)
    }

    /**
     * 清除 cache 中非白名单中的数据
     * @param {String[]} whiteList 白名单
     */
    _clearFromCache (whiteList) {
        const allCacheKeys = this._getAllCacheKeys()

        this._getKeysByWhiteList(whiteList)(allCacheKeys)
            .forEach(key => { delete this._cache[key] })
    }

    /**
     * 清除 cache 中已过期的数据
     */
    _clearExpiredDataFromCache () {
        this._getAllCacheKeys()
            .filter(key => this._isDataExpired(this._cache[key]))
            .map(key => { delete this._cache[key] })
    }

    /**
     * 清除已过期的数据
     */
    _clearExpiredData () {
        const { _getItem, _getAllKeys, _removeItem } = this.SEMethods

        // 清除 cache 中过期数据
        this._clearExpiredDataFromCache()

        return _getAllKeys()
            .then((keys) => keys
                .map((key) => _getItem(key)
                    .then(jsonParse)
                    // 不处理 JSON.parse 的错误
                    .catch(() => {})
                    .then(this._isDataExpired.bind(this))
                    .then(isExpired => isExpired ? _removeItem(key) : pRes())
                )
            )
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
    _findData ({
        key,
        isEnableCache = true,
        isForceUpdate = false,
        ...rest
    }) {
        // 忽略缓存直接去同步数据
        if (isForceUpdate) {
            return this._loadData({ key, ...rest })
        }

        const cacheData = this._cache[key]

        return (isEnableCache && cacheData)
            // 返回 cache 数据
            ? this._loadData({ key, cacheData, ...rest })
            // 读取 storage
            : this.SEMethods._getItem(key)
                // 如果有缓存则返回 cacheData
                .then(cacheData => this._loadData({ key, cacheData, ...rest }))
                // 没有缓存则不传 cacheData，执行同步数据逻辑（请求接口等）
                .catch(() => this._loadData({ key, ...rest }))
    }

    /**
     * 统一规范化 wx、localStorage、AsyncStorage 三种存储引擎的调用方法
     * @return {Object | Null}
     */
    _getSEMethods () {
        const noop = () => {}
        const _getInfoSync = () => ({ keys: this._getAllCacheKeys() })

        const defaultSEMap = {
            _clear: pRes,
            _setItem: pRes,
            _getItem: pRes,
            _getInfo: () => pRes(_getInfoSync()),
            _getAllKeys: () => pRes([]),
            _removeItem: pRes,

            _clearSync: noop,
            _getInfoSync,
            _getItemSync: noop,
            _setItemSync: noop,
            _removeItemSync: noop,
        }

        // 未指定存储引擎，默认使用内存
        if (!this.SE) {
            logger.warn(ERROR_MSGS.storageEngine)

            return defaultSEMap
        }

        const isSEHasThisProp = p => !!this.SE[p]
        const isWX = REQUIRED_SE_METHODS.wx.every(isSEHasThisProp)

        // 当前是支持所有必需小程序 api 的环境
        if (isWX) return formatMethodsByWX.call(this)

        // 部分必需 api 不存在
        const missedLSApis = REQUIRED_SE_METHODS.ls.filter(negate(isSEHasThisProp))
        const missedASApis = REQUIRED_SE_METHODS.as.filter(negate(isSEHasThisProp))
        const missedWXApis = REQUIRED_SE_METHODS.wx.filter(negate(isSEHasThisProp))

        const requiredApisNotFound =
            missedLSApis.length &&
            missedASApis.length &&
            missedWXApis.length

        // 当前传入的存储引擎在各种场景下，必须方法有缺失
        if (requiredApisNotFound) {
            // 传入空对象时不展示提示
            if (JSON.stringify(this.SE) !== '{}') {
                const displayMissingApis = (apis, se) =>
                    logger.warn(`Missing required apis for ${se}:\n* ${apis.join('\n* ')}`)

                displayMissingApis(missedLSApis, 'localStorage')
                displayMissingApis(missedASApis, 'AsyncStorage')
                displayMissingApis(missedWXApis, 'wx')

                logger.warn(ERROR_MSGS.storageEngine)
            }

            return defaultSEMap
        }

        const promiseTest = this.SE.setItem('test', 'test')
        this.SE.removeItem('test')
        const isPromise = !!(promiseTest && promiseTest.then)

        return isPromise
            ? formatMethodsByAS.call(this)
            : formatMethodsByLS.call(this)
    }

    /**
     * 获取过滤白名单后的 keys
     * @param {String[]} whiteList 白名单
     * @return {Function}
     */
    _getKeysByWhiteList (whiteList) {
        const mergedWhiteList = [
            ...whiteList,
            ...this.whiteList,
        ]

        return keys => keys.filter(
            key => mergedWhiteList
                .every(item => key.indexOf(item) === -1)
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
        isAutoSave = true,
    }) {
        const isNoCacheData = cacheData === null || cacheData === undefined

        const syncResolveFn = () => {
            const getSameKey = ({ key: taskKey }) => taskKey === key
            const sameTask = this.taskList.find(getSameKey)
            const finallyRemoveTask = (err) => {
                this.taskList = this.taskList.filter(negate(getSameKey))

                if (err) {
                    logger.error(err)

                    return pRej(err)
                }
            }

            // 如果有相同的任务，则共用该任务
            if (sameTask) return sameTask.task

            const originTask = syncFn(syncParams)
            const isPromise = !!(originTask && originTask.then)

            if (!isPromise) return pRej(Error(ERROR_MSGS.promise))

            // 格式化数据结构
            const formatDataStructure = (data) => (data.code == null && data.data == null)
                ? { data }
                : data

            // 格式化数据类型
            const formatDataType = ({ code = 0, data }) => ({ code: +code, data })

            const task = originTask
                .then(formatDataStructure)
                .then(formatDataType)
                .then(({ code, data }) => {
                    // 应该首先删除任务
                    finallyRemoveTask()

                    if (code !== 0 || !isAutoSave) return { code, data }

                    this.save({
                        // 防止无限添加前缀
                        key: key.replace(this.storageKeyPrefix, ''),
                        data: { code, data },
                        expires,
                    }).catch(logger.error)

                    return { code, data }
                })
                .catch(finallyRemoveTask)

            this.taskList.push({ key, task })

            return task
        }

        const syncRejectFn = () => pRej(Error(stringify({ key, syncFn })))

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

TuaStorage.install = (Vue, options) => {
    Vue.prototype.$tuaStorage = new TuaStorage(options)
}

export default TuaStorage
