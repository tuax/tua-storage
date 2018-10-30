export default class Wx {
    constructor () {
        this.store = {}
    }

    _clear () {
        this.store = {}
    }

    get _length () {
        return Object.keys(this.store).length
    }

    getStorage ({
        key,
        fail,
        success,
        complete,
    }) {
        try {
            const data = this.store[key]

            if (data) {
                success && success({
                    data,
                    errMsg: 'getStorage:ok',
                })
            } else {
                fail && fail({
                    errMsg: 'getStorage:fail data not found',
                })
            }
        } catch ({ message }) {
            fail && fail({ errMsg: message })
        } finally {
            complete && complete()
        }
    }

    getStorageSync (key) {
        return this.store[key]
    }

    setStorage ({
        key,
        data,
        fail,
        success,
        complete,
    }) {
        try {
            this.store[key] = data

            success && success({
                data,
                errMsg: 'setStorage:ok',
            })
        } catch ({ message }) {
            fail && fail({ errMsg: message })
        } finally {
            complete && complete()
        }
    }

    setStorageSync (key, data) {
        this.store[key] = data
    }

    removeStorage ({
        key,
        fail,
        success,
        complete,
    }) {
        try {
            delete this.store[key]

            success && success({
                errMsg: 'removeStorage:ok',
            })
        } catch ({ message }) {
            fail && fail({ errMsg: message })
        } finally {
            complete && complete()
        }
    }

    removeStorageSync (key) {
        delete this.store[key]
    }

    getStorageInfo ({
        fail,
        success,
        complete,
    }) {
        try {
            const keys = Object.keys(this.store)

            success && success({
                keys,
                errMsg: 'getStorageInfo:ok',
                limitSize: 10240, // kb
                currentSize: 0, // kb
            })
        } catch ({ message }) {
            fail && fail({ errMsg: message })
        } finally {
            complete && complete()
        }
    }

    getStorageInfoSync () {
        return {
            keys,
            limitSize: 10240, // kb
            currentSize: 0, // kb
        }
    }
}
