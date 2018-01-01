// 该函数用于将谓词函数取反，以便用于各种高阶函数中
// negate :: Function -> a -> Boolean
export const negate = (fn) => (...args) => !fn(...args)

/**
 * 将对象序列化为querystring的形式
 * @param data
 * @returns {string}
 * @desc 每个字段的值都会经过url编码
 */
export const getParamStrFromObj = (data = {}) => Object.keys(data)
    .map(key => `${key}=${encodeURIComponent(data[key])}`).join('&')
