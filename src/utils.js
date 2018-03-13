export const ERROR_MSG = {
    KEY: '请输入参数 key 或 fullKey!',
    PROMISE: 'syncFn 请返回 Promise!',
}

export const DEFAULT_EXPIRES = 30 // 默认 30s，采用秒作为单位方便测试
export const DEFAULT_KEY_PREFIX = 'TUA_STORAGE_PREFIX: '

// 该函数用于将谓词函数取反，以便用于各种高阶函数中
// negate :: Function -> a -> Boolean
export const negate = (fn) => (...args) => !fn(...args)

/**
 * 将对象序列化为 queryString 的形式
 * @param {Object} data
 * @returns {String}
 */
export const getParamStrFromObj = (data = {}) => Object.keys(data)
    .map(key => `${key}=${encodeURIComponent(data[key])}`).join('&')

/**
 * 让函数支持数组参数的装饰器（原函数返回 Promise）
 */
export const supportArrayParam = (_, __, descriptor) => {
    const method = descriptor.value

    /**
     * 使得原函数支持数组参数
     * @param {Array|Any} items 待处理的数据，可能是数组
     * @return {Promise}
     */
    descriptor.value = function (items) {
        return Array.isArray(items)
            ? Promise.all(items.map(item => method.call(this, item)))
            : method.call(this, items)
    }

    return descriptor
}

/**
 * 帮函数检查 key 相关参数的装饰器（必需有 key 或 fullKey）
 */
export const checkKey = (_, __, descriptor) => {
    const method = descriptor.value

    descriptor.value = function (params = '') {
        const paramsObj = typeof params === 'string'
            ? { key: params }
            : params

        const { key = '', fullKey = '' } = paramsObj

        if (key === '' && fullKey === '') {
            return Promise.reject(ERROR_MSG.KEY)
        }

        return method.call(this, params)
    }

    return descriptor
}
