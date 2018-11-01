import {
    pAll,
    pRes,
    logger,
    jsonParse,
    stringify,
} from '../utils'

/**
 * 统一规范化 LocalStorage 的各个方法
 * @return {Object}
 */
export default function formatMethodsByLS () {
    const { getItem, setItem, removeItem } = this.SE

    const promisify = (fn) => (...args) => pRes(
        fn.apply(this.SE, args)
    )

    const _clear = (whiteList) => {
        const mergedWhiteList = [ ...whiteList, ...this.whiteList ]
        const isNotInWhiteList = key => mergedWhiteList
            .every(item => !key.includes(item))

        return _getAllKeys()
            .then(keys => keys.filter(isNotInWhiteList))
            .then(keys => keys.map(k => _removeItem(k)))
            .then(pAll)
            .catch(logger.error)
    }
    const _getItem = promisify(getItem)
    const _setItem = (key, data) => promisify(setItem)(key, stringify(data))
    const _getAllKeys = () => pRes(_getAllKeysSync())
    const _removeItem = promisify(removeItem)
    const _getInfo = () => ({ keys: _getAllKeysSync() })

    const _clearSync = (whiteList) => {
        const allKeys = _getAllKeysSync()

        this._getKeysByWhiteList(whiteList)(allKeys)
            .map(_removeItemSync)
    }
    const _getItemSync = (key) => jsonParse(this.SE.getItem(key))
    const _setItemSync = (key, data) => this.SE.setItem(key, stringify(data))
    const _getInfoSync = () => ({ keys: _getAllKeysSync() })
    const _removeItemSync = removeItem.bind(this.SE)
    const _getAllKeysSync = () => {
        const { key: keyFn, length } = this.SE
        const keys = []

        for (let i = 0, len = length; i < len; i++) {
            const key = keyFn.call(this.SE, i)
            keys.push(key)
        }

        return keys
    }

    return { _clear, _getItem, _getInfo, _setItem, _getAllKeys, _removeItem, _clearSync, _getItemSync, _setItemSync, _getInfoSync, _removeItemSync }
}
