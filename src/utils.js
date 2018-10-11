// 该函数用于将谓词函数取反，以便用于各种高阶函数中
// negate :: Function -> a -> Boolean
const negate = (fn) => (...args) => !fn(...args)

/**
 * 将对象序列化为 queryString 的形式
 * @param {Object} data
 * @returns {String}
 */
const getParamStrFromObj = (data = {}) => (
    Object.entries(data)
        .map(([ key, val ]) => `${key}=${encodeURIComponent(val)}`)
        .join('&')
)

/**
 * 若参数为字符串则调用 JSON.parse 进行转换
 * @param {Object|String} data
 * @returns {Object}
 */
const jsonParse = (data) => (
    typeof data === 'string' ? JSON.parse(data) : data
)

export * from './logger'
export * from './decorators'
export {
    negate,
    jsonParse,
    getParamStrFromObj,
}
