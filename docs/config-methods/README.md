# 配置和方法
api 分为两个部分来说明：

## 默认配置
即调用 `new TuaStorage({ ... })` 时传递的配置

* syncFnMap 同步函数对象
* whiteList 白名单数组
* storageEngine 存储引擎
* defaultExpires 默认超时时间
* storageKeyPrefix 默认存储前缀


## 实例方法
* save
* saveSync
* load
* loadSync
* remove
* removeSync
* clear
* clearSync
* getInfo
* getInfoSync
