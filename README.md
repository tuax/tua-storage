<h1 align="center">tua-storage</h1>

<h5 align="center">
    让我们构建大一统的缓存层~
</h5>

<p align="center">
    <a href="https://tuateam.github.io/tua-storage/">👉完整文档地址点这里👈</a>
</p>

<p align="center">
    <a href="https://circleci.com/gh/tuateam/tua-storage/tree/master"><img src="https://img.shields.io/circleci/project/github/tuateam/tua-storage/master.svg" alt="Build Status"></a>
    <a href="https://codecov.io/github/tuateam/tua-storage?branch=master"><img src="https://img.shields.io/codecov/c/github/tuateam/tua-storage/master.svg" alt="Coverage Status"></a>
    <a href="https://www.npmjs.com/package/tua-storage"><img src="https://img.shields.io/npm/v/tua-storage.svg" alt="Version"></a>
    <a href="https://www.npmjs.com/package/tua-storage"><img src="https://img.shields.io/npm/l/tua-storage.svg" alt="License"></a>
</p>

## 安装

```bash
$ npm i -S tua-storage
# OR
$ yarn add tua-storage
```

`tua-storage` 是通过初始化时传入的 `storageEngine` 选项来区分不同的端。

## 这是什么？
`tua-storage` 是一款二次封装各个平台存储层接口，抹平各平台接口操作差异的库。采用 ES6+ 语法，将异步 api 使用 Promise 包裹，并采用 jest 进行了完整的单元测试。

已适配以下场景：

* web 场景：使用 `localStorage` 作为存储对象
* 小程序场景：使用微信提供的原生存储对象
* Node.js 场景：直接使用内存作为存储对象（其实就是使用 `object`）
* React-Native 场景：使用 `AsyncStorage` 作为存储对象

## 能干什么？
日常开发中，在不同的平台下由于有不同的存储层接口，所以往往导致同一份代码要写几份儿。

例如，小程序中保存数据要使用异步的 `wx.setStorage`、`wx.getStorage` 或对应的同步方法；而在 web 端使用 localStorage 的话，则是同步的 `setItem`、`getItem` 等方法；在 React-Native 的场景下，使用的又是 `AsyncStorage` 中异步的 `setItem`、`getItem`...

然而，经过 `tua-storage` 的二次封装，以上两个方法统一变成了：

* `save`
* `load`

由于异步方法没法变成同步方法，所以以上方法在所有场景下都异步返回 `Promise`。

## 如何使用？
首先参阅文档 [安装](https://tuateam.github.io/tua-storage/quick-start/installation.html) 将 `tua-storage` 安装到你的项目中，并正确地导入和初始化。

### 常规操作
对于存储层来说，最基本的操作自然是保存（save）、读取（load）、删除（remove，删除单个）和清除（clear，清空全部）了。

```js
import TuaStorage from 'tua-storage'

const tuaStorage = new TuaStorage({ ... })

// 返回一个 Promise
tuaStorage.save({ key: 'foo', data: { foo: 'bar' } })
    .then(console.log)
    .catch(console.error)

// 使用 async/await
async () => {
    try {
        const data = await tuaStorage.load({ key: 'foo' })
        console.log(data)
    } catch (e) {
        console.error(e)
    }
}

tuaStorage.remove('foo')
tuaStorage.clear()
```

## 数据同步
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

### 数据同步函数
因此 `tua-storage` 在读取数据时很贴心地提供了一个 `syncFn` 参数，作为数据同步的函数，当请求的数据不存在或已过期时自动调用该函数。并且数据同步后默认会保存下来，这样下次再请求时存储层中就有数据了。

```js
tuaStorage.load({
    key: 'some data',
    syncFn: ({ a }) => axios('some api url' + a),
    // 以下参数会传到 syncFn 中
    syncParams: { a: 'a' },
})
```

这么一来，存储层就和接口层对接起来了。业务侧再也不用手动调用 api 获取数据。

### 合并分散配置
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

// 不用手动传 syncFn 了
tuaStorage.load({ key: 'data one' })
```

### 自动生成配置
其实手动编写每个 api 请求函数也是很繁琐的，要是有个根据配置自动生成请求函数的库就好了~

诶~，巧了么不是~。各位开发者老爷们 [tua-api](https://tuateam.github.io/tua-api/) 了解一下~？

`tua-storage` 搭配 `tua-api` 之后会变成这样

```js
import TuaStorage from 'tua-storage'
// 小程序端要引入 'tua-api/dist/mp'
import { getSyncFnMapByApis } from 'tua-api'

// 本地写好的各种接口配置
import * as apis from '@/apis'

const tuaStorage = new TuaStorage({
    syncFnMap: getSyncFnMapByApis(apis),
})
```

<p align="center">
    <a href="https://tuateam.github.io/tua-storage/">👉完整文档地址点这里👈</a>
</p>

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2018-present, StEve Young

inspired by [react-native-storage](https://github.com/sunnylqm/react-native-storage)
