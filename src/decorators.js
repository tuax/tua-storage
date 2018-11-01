import { ERROR_MSG } from './constants'
import { pAll, pRej, pRes } from './utils'

/**
 * 生成装饰器的辅助函数
 */
const getDecorator = (fn) => (_, __, descriptor) => {
    const method = descriptor.value
    descriptor.value = fn(method)
    return descriptor
}

/**
 * 检查 key 是否传递
 */
const checkKey = getDecorator((method) =>
    /**
     * 必须先传递 key 或 fullKey
     */
    function (params = '') {
        const paramsObj = typeof params === 'string'
            ? { key: params }
            : params
        const { key = '', fullKey = '' } = paramsObj

        if (key === '' && fullKey === '') {
            return pRej(Error(ERROR_MSG.KEY))
        }

        return method.call(this, params)
    }
)

/**
 * 根据 key、fullKey、syncParams 生成完整的 key
 */
const getFullKey = getDecorator((method) =>
    /**
     * 优先使用 fullKey，如果没有就根据 key 和 syncParams 生成
     */
    function ({
        key: prefix = '',
        fullKey = '',
        syncParams = {},
        ...rest
    }) {
        // 生成完整的 key
        const key = fullKey || this._getQueryKeyStr({ prefix, syncParams })

        return method.call(this, { ...rest, key, prefix, syncParams })
    }
)

/**
 * 让函数支持数组参数的装饰器
 */
const supportArrayParam = (isAsync = true) => getDecorator((method) =>
    /**
     * 参数是数组，则使用 Promise.all 并发调用原函数
     */
    function (items) {
        if (!Array.isArray(items)) return method.call(this, items)

        const mapResult = items.map(item => method.call(this, item))

        return isAsync ? pAll(mapResult) : mapResult
    }
)

/**
 * 保存数据时获取将被保存的数据
 */
const getDataToSave = getDecorator((method) =>
    /**
     * 不保存注定过期的数据，根据原始数据和过期时间生成将被保存的数据
     */
    function ({
        data: rawData,
        expires = this.defaultExpires,
        ...rest
    }) {
        const isNeverExpired = this._isNeverExpired(expires)

        if (!isNeverExpired && expires <= 0) return pRes()

        const realExpires = isNeverExpired
            // 永不超时
            ? this.neverExpireMark
            : parseInt(Date.now() / 1000) + expires
        const dataToSave = { rawData, expires: realExpires }

        return method.call(this, { ...rest, dataToSave })
    }
)

export {
    checkKey,
    getFullKey,
    getDataToSave,
    supportArrayParam,
}
