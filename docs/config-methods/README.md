# 配置和方法
api 分为两个部分来说明：

## [默认配置](./default.md#默认配置)
即调用 `new TuaStorage({ ... })` 时传递的配置

* syncFnMap 同步函数对象
* whiteList 白名单数组
* storageEngine 存储引擎
* defaultExpires 默认过期时间
* neverExpireMark 永不过期的标志
* storageKeyPrefix 默认存储前缀
* autoClearTime 默认自动清理时间
* isEnableAutoClear 是否自动清理过期数据

## [实例方法](./methods.md#实例方法)
* save
* load
* clear
* remove
* getInfo
* saveSync
* loadSync
* clearSync
* removeSync
* getInfoSync
