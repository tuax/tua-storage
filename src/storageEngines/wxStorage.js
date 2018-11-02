import {
    pAll,
} from '../utils'

/**
 * 统一规范化小程序的各个方法
 * @return {Object}
 */
export default function formatMethodsByWX () {
    const {
        getStorage,
        setStorage,
        removeStorage,
        getStorageInfo,
    } = this.SE

    const promisify = (fn) => (args = {}) => new Promise(
        (success, fail) => fn.call(
            this.SE,
            { fail, success, ...args }
        )
    )

    const rmFn = promisify(removeStorage)
    const getFn = promisify(getStorage)
    const setFn = promisify(setStorage)

    const _clear = (whiteList) => (
        _getAllKeys()
            .then(this._getKeysByWhiteList(whiteList))
            .then((keys) => keys.map(_removeItem))
            .then(pAll)
    )
    const _setItem = (key, data) => setFn({ key, data })
    const _getItem = key => getFn({ key }).then(({ data }) => data)
    const _removeItem = key => rmFn({ key })
    const _getAllKeys = () => _getInfo().then(({ keys }) => keys)
    const _getInfo = promisify(getStorageInfo)

    const _clearSync = (whiteList) => {
        const allKeys = _getAllKeysSync()

        this._getKeysByWhiteList(whiteList)(allKeys)
            .map(_removeItemSync)
    }
    const _getItemSync = this.SE.getStorageSync
    const _setItemSync = this.SE.setStorageSync
    const _getInfoSync = this.SE.getStorageInfoSync
    const _getAllKeysSync = () => _getInfoSync().keys
    const _removeItemSync = this.SE.removeStorageSync

    return { _clear, _setItem, _getItem, _getInfo, _getAllKeys, _removeItem, _clearSync, _setItemSync, _getItemSync, _getInfoSync, _removeItemSync }
}
