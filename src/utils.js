// @ts-check

// 该函数用于将谓词函数取反，以便用于各种高阶函数中
// negate :: Function -> a -> Boolean
const negate = (fn) => (...args) => !fn(...args)

/**
 * 将对象序列化为 queryString 的形式
 * @param {object} data
 * @returns {string}
 */
const getParamStrFromObj = (data = {}) => (
    Object.keys(data)
        .map(key => `${key}=${encodeURIComponent(data[key])}`)
        .join('&')
)

/**
 * 若参数为字符串则调用 JSON.parse 进行转换
 * @param {object|string} data
 * @returns {object}
 */
const jsonParse = (data) => (
    typeof data === 'string' ? JSON.parse(data) : data
)

const stringify = JSON.stringify.bind(JSON)

const pAll = Promise.all.bind(Promise)
const pRej = Promise.reject.bind(Promise)
const pRes = Promise.resolve.bind(Promise)

export * from './logger'
export * from './decorators'
export {
    pAll,
    pRej,
    pRes,
    negate,
    jsonParse,
    stringify,
    getParamStrFromObj,
}
