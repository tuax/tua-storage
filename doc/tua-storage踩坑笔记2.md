# tua-storage 踩坑笔记2
tua-storage 这个项目希望统一封装各个端（小程序、web 端、React-Native）中对于缓存层的使用。采用 ES6+ 语法，将全部 api 使用 Promise 包裹，并采用 jest 进行了完整的单元测试。

* 已在 npm 发布：https://www.npmjs.com/package/tua-storage
* 源码地址在：https://github.com/tuateam/tua-storage

这个包采用 rollup 打包，jest 测试。

## 1.上篇回顾
上篇说到为了解决打包时代码转换，和使用 jest 运行测试时识别 import 等语法的问题，引入了 [buble](https://github.com/Rich-Harris/buble) 进行代码转换，而使用 babel 进行测试代码的转换。

其实问题的本质是因为 rollup 在使用 babel 时必须设置 `"modules": false`，因为

> 否则 Babel 会在 Rollup 有机会做处理之前，将我们的模块转成 CommonJS，导致 Rollup 的一些处理失败。 -- from 官方文档

而这样又会导致在运行测试时不转换代码。

## 2.无法使用的新特性
平时分别用两个转换工具倒是用着也没啥问题，但是最近在重构的时候遇到了一个无法解决的问题...

在编写 save、load、remove 等方法时，为了支持传入数组进行调用，写了不少重复代码：

```js
load (itemsToBeLoaded) {
    return Array.isArray(itemsToBeLoaded)
        ? Promise.all(
            itemsToBeLoaded.map(item => this._loadOneItem(item))
        )
        : this._loadOneItem(itemsToBeLoaded)
}

save (itemsToBeSaved) {
    return Array.isArray(itemsToBeSaved)
        ? Promise.all(
            itemsToBeSaved.map(item => this._saveOneItem(item))
        )
        : this._saveOneItem(itemsToBeSaved)
}

remove (itemsToBeRemoved) {
    return Array.isArray(itemsToBeRemoved)
        ? Promise.all(
            itemsToBeRemoved.map(item => this._removeOneItem(item))
        )
        : this._removeOneItem(itemsToBeRemoved)
}
```

这些代码逻辑都是一样的，这让我想到了 ES7 的装饰器。

```js
export const supportArrayParam = (_, __, descriptor) => {
    const method = descriptor.value

    descriptor.value = function (items) {
        return Array.isArray(items)
            ? Promise.all(items.map(item => method.call(this, item)))
            : method.call(this, items)
    }

    return descriptor
}

// 使用时直接这么用就行
@supportArrayParam
save (...) {
    // 此处替换为 _saveOneItem 函数的代码
}
```

**简直完美~！**

但是...虽然 jest 运行测试通过了（需要添加 `babel-plugin-transform-decorators-legacy` 插件），但是 buble 打包时死活通不过...

查了查文档：https://buble.surge.sh/guide/#faqs

文档说不支持插件，并且一些新特性需要提 issue 讨论...

那就是凉了呗...不过天无绝人之路，查了查又发现了一个方法。

之前必须使用两个转换工具是因为在两个环境下的配置冲突，那么区分这两个环境不就行啦~

说到环境判断，马上就会想到 `NODE_ENV`，[而 babel 正好也支持 env](https://babeljs.io/docs/usage/babelrc/#env-option) 所以事情就简单了。

```json
/* package.json */
{
    "scripts": {
        "tdd": "NODE_ENV=test jest --watch",
        "test": "NODE_ENV=test jest --no-cache",
        "coverage": "open coverage/lcov-report/index.html",
        "prebuild": "npm run test",
        "build": "NODE_ENV=prod rollup -c",
        "pub": "npm run build && npm publish"
    },
}
```

```json
/* .babelrc */
{
    "env": {
        "test": {
            "presets": [
                [ "env", { "targets": { "node": "current" } }]
            ],
            "plugins": ["transform-decorators-legacy"]
        },
        "prod": {
            "presets": [
                [ "env", { "modules": false } ]
            ],
            "plugins": [
                "transform-decorators-legacy",
                "transform-object-rest-spread"
            ]
        }
    }
}
```

## 3.固执报错的 eslint
终于能够编译装饰器了~，但 eslint 又报错了...

```
Parsing error: Unexpected character '@'
```

搜了搜安装 `babel-eslint` 并在 `.eslintrc.js` 添加配置 `"parser": "babel-eslint",` 解决。

## 4.package.json
最后一个坑是有关读取 `package.json` 中的属性，首先直接 import 并打印是没问题的，但在打包时需要添加一个插件 `rollup-plugin-json`，处理 json 类型文件，不然会报错。

```
[!] (babel plugin) SyntaxError:
.../tua-storage/package.json:
Unexpected token, expected ; (2:10)
```

并且要注意插件的顺序，应该放在 eslint 和 babel 之间。
