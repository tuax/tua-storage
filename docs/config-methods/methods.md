# 实例方法
在初始化完成后，我们会得到一个 `tua-storage` 的实例。实例上会有以下方法。

## save 异步保存
异步保存，可以接收一个对象，或是对象数组。

```js
// 返回一个 Promise
tuaStorage
    .save({
        key: 'data key',
        data: { foo: 'bar' },
    })
    .then(console.log)
    .catch(console.error)


// 保存到 storage 中的数据大概长这样
// key 之前要加上初始化传入的默认前缀
{
    'TUA_STORAGE_PREFIX: data key': {
        expires: 30,
        rawData: { foo: 'bar' },
    },
}
```

### key 关键词
* 类型：`String`
* 必须传递不可省略

### data 被保存数据
* 类型：`Any`
* 默认值：`undefined`

### expires 过期时间（单位：秒）
* 类型：`Number`
* 默认值：`30`

默认 `expires` 为 `30` 秒，当然你也可以指定别的时间，例如一小时 `3600`，一天 `3600 * 24`，甚至是永久 `null`。

### syncParams 同步参数对象
* 类型：`Object`
* 默认值：`{}`

当要保存的字符串中有类似 `foo?a=a&b=b` 的结构时，使用 `syncParams` 生成 `key` 将十分方便。

```js
tuaStorage.save({
    key: 'data key',
    data: { foo: 'bar' },
    expires: 3600,
    syncParams: { a: 'a', b: '中文' },
})

// 保存到 storage 中的数据大概长这样
{
    'TUA_STORAGE_PREFIX: data key?a=a&b=%E4%B8%AD%E6%96%87': {
        expires: 3600,
        rawData: { foo: 'bar' },
    },
}
```

### fullKey 完整关键词
* 类型：`String`
* 默认值：`''`

当你不需要添加前缀，希望指定一个固定的 key 时，可以这么写

```js
tuaStorage.save({
    fullKey: 'data key',
    data: { foo: 'bar' },
})

// 保存到 storage 中的数据大概长这样
{
    'data key': {
        expires: 30,
        rawData: { foo: 'bar' },
    },
}
```

::: warning
当 `fullKey` 和 `key`、`syncParams` 同时出现时，`fullKey` 有最高优先级
:::

### isEnableCache 是否使用内存缓存
* 类型：`Boolean`
* 默认值：`true`

默认为 true，当下次读取数据时可以直接从内存中读取。

::: tip
别忘了还可以传递数组，保存多个数据哟~

```js
tuaStorage.save([{
    key: 'data key',
    data: { foo: 'bar' },
    expires: 3600,
    syncParams: { a: 'a', b: '中文' },
}, {
    key: 'another data',
    data: 'some data',
}])
```
:::

## saveSync 同步保存
save 方法的同步版本，在不支持同步方法的场景（AsyncStorage）下会抛出错误。

```js
try {
    tuaStorage.saveSync({
        key,
        data,
        expires,
        fullKey,
        syncParams,
        isEnableCache,
    })
} catch (e) {
    // Do something when catch error
}
```

## load 异步读取
异步读取，可以接收一个对象，或是对象数组。

```js
// 返回一个 Promise
tuaStorage.load({ key: 'data key' })
    .then(console.log)
    .catch(console.error)

// 或是使用 async/await
async () => {
    try {
        const data = await tuaStorage.load({ key: 'data key' })
        console.log(data)
    } catch (e) {
        console.error(e)
    }
}
```

### key 关键词
* 类型：`String`
* 必须传递不可省略

### syncFn 同步函数
* 类型：`Function`
* 默认值：`undefined` 或是初始化时 `syncFnMap` 中的对应函数

::: tip
当数据不存在或已过期时，调用同步函数进行数据同步。详细使用方法请参阅 [数据同步](../quick/start/sync-data.md) 章节。
:::

### syncParams 同步参数对象
* 类型：`Object`
* 默认值：`{}`

调用同步函数时传递参数。

### fullKey 完整关键词
* 类型：`String`
* 默认值：`''`

当你不需要添加前缀，希望指定一个固定的 key 时使用。

### isAutoSave 是否自动保存
* 类型：`Boolean`
* 默认值：`true`

默认为 true，在调用 `syncFn` 后，是否自动保存到 storage 中。

### expires 过期时间（单位：秒）
* 类型：`Number`
* 默认值：`30`

默认 `expires` 为 `30` 秒，如果选择自动保存则会透传给 `save` 函数。

### isEnableCache 是否使用内存缓存
* 类型：`Boolean`
* 默认值：`true`

默认为 true，是否优先读取内存。

### isForceUpdate 是否直接调用 syncFn
* 类型：`Boolean`
* 默认值：`false`

默认为 false，当你需要立即同步数据时，将该项置为 true。常用于小程序下拉刷新的场景。

::: tip
别忘了还可以传递数组，读取多个数据哟~将会以 `Promise.all` 的形式调用。
:::

## loadSync 同步读取
load 方法的同步版本，在不支持同步方法的场景（AsyncStorage）下会抛出错误。

```js
try {
    const data = tuaStorage.loadSync({
        key,
        expires,
        fullKey,
        syncParams,
        isEnableCache,
    })

    // Do something with return value
} catch (e) {
    // Do something when catch error
}
```

::: warning
同步读取时，不支持传递 syncFn 等参数，无法在没有数据时进行数据同步操作。
:::

## remove 异步删除
异步删除，可以接收一个字符串，对象，或是对象数组。

### key 关键词
* 类型：`String`
* 必须传递不可省略

```js
// 返回一个 Promise
tuaStorage.remove('data key')
    .then(console.log)
    .catch(console.error)
```

::: warning
注意这样删除的是 `key` 为 `'TUA_STORAGE_PREFIX: data key'` 的数据
:::

### fullKey 完整关键词
* 类型：`String`
* 默认值：`''`

当你保存数据时选择了 `fullKey`，删除时可以传递一个对象，同样传递 `fullKey` 删除该数据。

```js
// 返回一个 Promise
tuaStorage.remove({ fullKey: 'data key' })
    .then(console.log)
    .catch(console.error)
```

这时删除的就是 `key` 为 `'data key'` 的数据了。

::: tip
别忘了还可以传递数组，删除多个数据哟~
:::

## removeSync 同步删除
remove 方法的同步版本，在不支持同步方法的场景（AsyncStorage）下会抛出错误。

```js
try {
    tuaStorage.removeSync(key)
} catch (e) {
    // Do something when catch error
}
```

## clear 异步清除
异步清除非白名单中的所有缓存数据。

```js
// 返回一个 Promise
tuaStorage.clear()
    .then(console.log)
    .catch(console.error)
```

### whiteList 白名单
* 类型：`String[]`
* 默认值：`[]`

在清除数据时，可能有些数据你还想保留。那么此时可以传递一个字符串数组。

```js
// 返回一个 Promise
tuaStorage.clear(['key'])
    .then(console.log)
    .catch(console.error)

// 假设现在 storage 中有以下数据
{
    'foo': {},
    'bar': {},
    'foo-key': {},
    'bar-key': {},
}

// 清除后剩下的数据是
{
    'foo-key': {},
    'bar-key': {},
}
```

::: tip
因为内部是通过 `indexOf` 来判断的，所以不必填写完整的 `key` 值。
:::

## clearSync 同步清除
clear 方法的同步版本，在不支持同步方法的场景（AsyncStorage）下会抛出错误。

```js
try {
    tuaStorage.clearSync(whiteList)
} catch (e) {
    // Do something when catch error
}
```

## getInfo 获取相关信息
异步获取当前 storage 的相关信息。

## getInfoSync 同步获取相关信息
getInfo 方法的同步版本，在不支持同步方法的场景（AsyncStorage）下会抛出错误。

```js
try {
    const {
        // 各种场景下都会有
        keys,

        // 小程序场景下才有
        limitSize
        currentSize,
    } = tuaStorage.getInfoSync()

    // Do something with return value
} catch (e) {
    // Do something when catch error
}
```

## 其他方法、场景
如果你还有什么其他需要的方法或场景，可以填写 [issues](https://github.com/tuateam/tua-storage/issues)，或者直接提个 [Pull Request](https://github.com/tuateam/tua-storage/pulls) 吧~。
