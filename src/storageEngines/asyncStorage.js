// @ts-check

import { logger, stringify } from '../utils'
import { ERROR_MSGS } from '../constants'

/**
 * 统一规范化 AsyncStorage 的各个方法
 * @return {Object}
 */
export default function formatMethodsByAS () {
    const {
        getItem,
        setItem,
        getAllKeys,
        removeItem,
        multiRemove,
    } = this.SE

    const bindFnToSE = fn => fn.bind(this.SE)
    const throwSyncError = () => {
        throw Error(ERROR_MSGS.syncMethod)
    }

    const _clear = (whiteList) => (
        _getAllKeys()
            .then(this._getKeysByWhiteList(whiteList))
            .then(bindFnToSE(multiRemove))
            .catch(logger.error)
    )
    const _getItem = bindFnToSE(getItem)
    const _setItem = (key, data) => bindFnToSE(setItem)(key, stringify(data))
    const _getAllKeys = bindFnToSE(getAllKeys)
    const _removeItem = bindFnToSE(removeItem)
    const _getInfo = () => _getAllKeys().then(keys => ({ keys }))

    const _clearSync = throwSyncError
    const _getItemSync = throwSyncError
    const _setItemSync = throwSyncError
    const _getInfoSync = throwSyncError
    const _removeItemSync = throwSyncError

    return { _clear, _getItem, _setItem, _getInfo, _getAllKeys, _removeItem, _clearSync, _getItemSync, _setItemSync, _getInfoSync, _removeItemSync }
}
