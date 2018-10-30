# 默认配置
默认配置指的就是在 `tua-storage` 初始化时传递的配置

```js
import TuaStorage from 'tua-storage'

new TuaStorage({
    syncFnMap,
    whiteList,
    storageEngine,
    defaultExpires,
    storageKeyPrefix,
})
```

## syncFnMap 同步函数对象
默认为 {}，保存各个对应 `key` 值的数据的同步函数。推荐与 [tua-api](https://tuateam.github.io/tua-api/) 配合使用。

## whiteList 白名单数组
默认为 []，调用清空数据的 `clear` 方法时，会跳过其中的元素。

## storageEngine 存储引擎
默认为 null, 可传递 `wx` / `localStorage` / `AsyncStorage`

::: warning
注意：传递【对象】，而非字符串
:::

## defaultExpires 默认超时时间
默认为 30 秒，注意是以秒为单位。

## storageKeyPrefix 默认存储前缀
默认为 `'TUA_STORAGE_PREFIX: '`，保存数据时会自动添加该前缀，这样可以通过改变该值起到删除之前版本缓存的作用。
