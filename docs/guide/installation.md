# 安装
## 下载包

```bash
$ npm i -S tua-storage
# OR
$ yarn add tua-storage
```

`tua-storage` 是通过初始化时传入的 `storageEngine` 选项来区分不同的端。

## 小程序端
首先在 `app.js` 中进行实例初始化。

```js
// app.js
import TuaStorage from 'tua-storage'

// 初始化时传入全局对象 wx
const tuaStorage = new TuaStorage({ storageEngine: wx })

App({
    //...

    // 将实例挂到全局对象上
    globalData: { tuaStorage },
})
```

接着在各个页面中可以这样引入。

```js
// some-page.js

// 获取应用实例
const app = getApp()

// 获取 tuaStorage 实例
const { tuaStorage } = app.globalData

Page({
    someFn () {
        return tuaStorage.save({ ... })
            .then(console.log)
            .catch(console.error)
    },

    async anotherFn () {
        try {
            const { code, data } = await tuaStorage.load({ ... })
            // ...
        } catch (e) {
            console.error(e)
        }
    },
})
```

## web 端
和小程序端大同小异。

```js
import TuaStorage from 'tua-storage'

// 可以挂在全局对象 window 上，方便别的地方调用
window.tuaStorage = window.tuaStorage || new TuaStorage({
    storageEngine: localStorage,
})
```

## node 端
node 端可以传递 null，之后会将数据保存在内存中（其实就是存在了 `object` 中）。

```js
import TuaStorage from 'tua-storage'

// 可以挂在全局对象 global 上，方便别的地方调用
global.tuaStorage = global.tuaStorage || new TuaStorage({
    storageEngine: null,
})
```

## React-Native 端
RN 端没得选，传 `AsyncStorage`...

```js
import TuaStorage from 'tua-storage'
import { AsyncStorage } from 'react-native'

// 可以挂在全局对象 global 上，方便别的地方调用
global.tuaStorage = global.tuaStorage || new TuaStorage({
    storageEngine: null,
})
```
