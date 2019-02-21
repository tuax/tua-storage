# 数据同步
**然而，仅仅有这些我认为还不够...**

想想平时我们是怎么使用存储层的

* 读取一个数据
* 正好存储层里有这个数据
    * 返回数据（皆大欢喜，happy ending~）
* 假如存储层里没这个数据
    * 手动调用各种方法去同步这个数据
    * 手动存到存储层中，以便下次读取

> 各位有没有看出其中麻烦的地方在哪儿？

> **数据同步部分的复杂度全留给了业务侧。**

让我们回归这件事的【**初心**】：我仅仅需要获取这个数据！我不管它是来自存储层、来自接口数据、还是来自其他什么地方...

## 数据同步函数
因此 `tua-storage` 在读取数据时很贴心地提供了一个 `syncFn` 参数，作为数据同步的函数，当请求的数据不存在或已过期时自动调用该函数。并且数据同步后默认会保存下来，这样下次再请求时存储层中就有数据了。

`syncParams` 的使用场景是接口需要传参时，这些参数会传给 `syncFn`。

```js
tuaStorage.load({
    key: 'some data',
    syncFn: ({ a }) => axios('some api url' + a),
    // 以下参数会传到 syncFn 中
    syncParams: { a: 'a' },
})
```

这么一来，存储层就和接口层对接起来了。业务侧再也不用手动调用 api 获取数据。

## 合并分散配置
每次读取数据时如果都要手动传同步函数，实际编码时还是很麻烦...

> 不急，吃口药~

`tua-storage` 在初始化时能够传递一个叫做 `syncFnMap` 参数。顾名思义，这是一个将 `key` 和 `syncFn` 映射起来的对象。

```js
const tuaStorage = new TuaStorage({
    // ...
    syncFnMap: {
        'data one': () => axios('data one api'),
        'data two': () => axios('data two api'),
        // ...
    },
})

// 不用手动传 syncFn，默认匹配 syncFnMap 中的对应函数
tuaStorage.load({ key: 'data one' })
```

## 自动生成配置
其实手动编写每个 api 请求函数也是很繁琐的，要是有个根据配置自动生成请求函数的库就好了~

诶~，巧了么不是~。各位开发者老爷们了解一下同样跨平台的 [tua-api](https://tuateam.github.io/tua-api/) ~？

`tua-storage` 搭配 `tua-api` 之后会变成这样

```js
import TuaStorage from 'tua-storage'
import { getSyncFnMapByApis } from 'tua-api'

// 本地写好的各种接口配置
import * as apis from '@/apis'

const tuaStorage = new TuaStorage({
    syncFnMap: getSyncFnMapByApis(apis),
})
```
