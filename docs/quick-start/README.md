# 介绍
## tua-storage 是什么？
`tua-storage` 是一款二次封装各个平台缓存层接口，抹平各平台接口操作差异的库。采用 ES6+ 语法，将全部 api 使用 Promise 包裹，并采用 jest 进行了完整的单元测试。

目前已适配：

* web 场景：使用 `localStorage` 作为缓存对象
* 小程序场景：使用微信提供的原生缓存对象
* Node.js 场景：直接使用内存作为缓存对象（其实就是使用 `object`）
* React-Native 场景：使用 `AsyncStorage` 作为缓存对象

## tua-storage 能干什么？
日常开发中，在不同的平台下由于有不同的缓存层接口，所以往往导致同一份代码要写几份儿。

例如，小程序中保存数据要使用异步的 `wx.setStorage`、`wx.getStorage` 或对应的同步方法；而在 web 端使用 localStorage 的话，则是同步的 `setItem`、`getItem` 等方法；在 React-Native 的场景下，使用的又是 `AsyncStorage` 中异步的 `setItem`、`getItem`...

然而，经过 `tua-storage` 的二次封装，以上两个方法统一变成了：

* `save`
* `load`

由于异步方法没法变成同步方法，所以以上方法在所有场景下都异步返回 `Promise`。

## 如何使用？
首先参阅上一章 [安装](./installation.md) 将 `tua-storage` 安装到你的项目中。
