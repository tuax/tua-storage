import {
    getParamStrFromObj,
    DEFAULT_KEY_PREFIX,
} from '../src/utils'

export const expireTime = 3

export const TIME_OUT = 999999

export const getObjLen = obj => Object.keys(obj).length

export const getTargetKey = (prefix, syncParams = {}) =>
    DEFAULT_KEY_PREFIX + (Object.keys(syncParams).length === 0
        ? prefix
        : `${prefix}?${getParamStrFromObj(syncParams)}`
    )

export const getExpectedVal =
    (rawData, et = expireTime) => JSON.stringify({
        rawData,
        expires: parseInt(Date.now() / 1000) + et,
    })

export const getExpectedValBySyncFn = (rawData, et = expireTime) => JSON.stringify({
    rawData: { code: 0, data: rawData },
    expires: parseInt(Date.now() / 1000) + et,
})
