export default class Wx {
    constructor () {
        this.store = {}
    }

    _clear (key) {
        this.store = {}
    }

    get _length () {
        return Object.keys(this.store).length
    }

    removeStorageSync (key) {
        delete this.store[key]
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
}
