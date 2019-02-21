export const ERROR_MSGS = {
    key: 'Please input key or fullKey!',
    promise: 'SyncFn MUST return a Promise!',
    syncMethod: 'This storageEngine does not support Sync methods!',
    storageEngine: `There is NO valid storageEngine specified! ` +
        `Please use:\n` +
        `* {} (for Node.js)\n` +
        `* wx (for Mini Program),\n` +
        `* localStorage (for Web),\n` +
        `* AsyncStorage (for React Native)\n` +
        `as the storageEngine...` +
        `Otherwise data would be saved in cache(Memory) and lost after reload...`,
}

export const DEFAULT_EXPIRES = 30 // 默认 30s，采用秒作为单位方便测试

export const DEFAULT_KEY_PREFIX = 'TUA_STORAGE_PREFIX: '

// storageEngine 需要实现的方法
export const REQUIRED_SE_METHODS = {
    wx: [
        'setStorage',
        'getStorage',
        'removeStorage',
        'setStorageSync',
        'getStorageSync',
        'getStorageInfo',
        'removeStorageSync',
        'getStorageInfoSync',
    ],
    ls: ['getItem', 'setItem', 'removeItem'],
    as: ['getItem', 'setItem', 'getAllKeys', 'removeItem', 'multiRemove'],
}
