import { PluginFunction } from 'vue'

/* -- types -- */

export type AnyFunction = (...args: any[]) => any
export type AnyPromiseFunction<T = any> = (...args: any[]) => Promise<T>

export type SaveParamsType = SaveParamsWithKey | SaveParamsWithFullKey
export type LoadParamsType = LoadParamsWithKey | LoadParamsWithFullKey
export type RemoveParamsType = string | RemoveParams
export type LoadSyncParamsType = LoadSyncParamsWithKey | LoadSyncParamsWithFullKey

/* -- interfaces -- */

export interface KeyAndSyncParams {
    key: string
    syncParams?: object
}
export interface FullKey {
    fullKey: string
}

export interface SaveParams {
    data?: any
    expires?: number
    isEnableCache?: boolean
    [k: string]: any
}
export interface SaveParamsWithKey extends KeyAndSyncParams, SaveParams {}
export interface SaveParamsWithFullKey extends FullKey, SaveParams {}

export interface LoadSyncParams {
    isEnableCache?: boolean
    [k: string]: any
}
export interface LoadParams extends LoadSyncParams {
    syncFn?: AnyPromiseFunction
    expires?: number
    isAutoSave?: boolean
    syncOptions?: object | any[]
    isForceUpdate?: boolean
    [k: string]: any
}
export interface LoadParamsWithKey extends KeyAndSyncParams, LoadParams {}
export interface LoadParamsWithFullKey extends FullKey, LoadParams {}
export interface LoadSyncParamsWithKey extends KeyAndSyncParams, LoadSyncParams {}
export interface LoadSyncParamsWithFullKey extends FullKey, LoadSyncParams {}

export interface RemoveParams {
    prefix: string
}

export interface TuaStorageOptions {
    whiteList?: string[],
    syncFnMap?: object,
    autoClearTime?: number,
    storageEngine?: null | object,
    defaultExpires?: number,
    neverExpireMark?: null | string,
    storageKeyPrefix?: string,
    isEnableAutoClear?: boolean,
}

export interface TuaStorageClass {
    /**
     * https://tuateam.github.io/tua-storage/config-methods/default.html
     */
    new (args?: TuaStorageOptions): TuaStorageInstance

    /**
     * https://tuateam.github.io/tua-storage/config-methods/default.html
     */
    install: PluginFunction<TuaStorageOptions>
}

export interface TuaStorageInstance {
    // public
    save: <T = any>(item: SaveParamsType | SaveParamsType[]) => Promise<T>
    load: <T = any>(item: LoadParamsType | LoadParamsType[]) => Promise<T>
    clear: <T = any>(whiteList?: string[]) => Promise<T>
    remove: <T = any>(prefix: RemoveParamsType | RemoveParamsType[]) => Promise<T>
    getInfo: <T = any>() => Promise<T>
    saveSync: (item: SaveParamsType | SaveParamsType[]) => any
    loadSync: (item: LoadSyncParamsType | LoadSyncParamsType[]) => any
    clearSync: (whiteList?: string[]) => any
    removeSync: (prefix: RemoveParamsType | RemoveParamsType[]) => any
    getInfoSync: () => any

    // private
    _cache: object
    _clearExpiredData: <T = any>() => Promise<T>
}

/* -- export default -- */

declare const TuaStorage: TuaStorageClass
export default TuaStorage

/* -- vue plugin -- */

declare module 'vue/types/vue' {
    interface Vue {
        /**
         * https://tuateam.github.io/tua-storage/config-methods/methods.html
         */
        $tuaStorage: TuaStorageInstance
    }
}
