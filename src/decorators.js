import { ERROR_MSG } from './constants'

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
            return Promise.reject(Error(ERROR_MSG.KEY))
        }

        return method.call(this, params)
    }

    return descriptor
}

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
