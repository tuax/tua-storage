export const ERROR_MSG = {
    KEY: 'Please input key or fullKey!',
    PROMISE: 'SyncFn MUST return a Promise!',
    SYNC_METHOD: 'This storageEngine not supports Sync methods!',
}

export const DEFAULT_EXPIRES = 30 // 默认 30s，采用秒作为单位方便测试

export const DEFAULT_KEY_PREFIX = 'TUA_STORAGE_PREFIX: '

export const SE_ERROR_MSG =
    `There is NO valid storageEngine specified!` +
    `Please use:` +
    `* wx (for miniprogram),` +
    `* localStorage (for web),` +
    `* AsyncStorage (for React Native)` +
    `as the storageEngine...` +
    `Otherwise data would be saved in cache(Memory) and lost after reload...`
