# 介绍
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
首先参阅上一章 [安装](./installation.md) 将 `tua-storage` 安装到你的项目中，并正确地导入和初始化。

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
