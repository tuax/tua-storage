// @ts-check

/**
 * 统一的日志输出函数，在测试环境时不输出
 * @param {string} type 输出类型 log|warn|error
 */
const logByType = (type) => (...out) => {
    const env = process.env.NODE_ENV
    /* istanbul ignore next */
    if (env === 'test' || env === 'production') return

    /* istanbul ignore next */
    console[type](`[TUA-STORAGE]:`, ...out)
}

export const logger = {
    log: logByType('log'),
    warn: logByType('warn'),
    error: logByType('error'),
}
