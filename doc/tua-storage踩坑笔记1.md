# tua-storage 踩坑笔记1
tua-storage 这个项目希望统一封装各个端（小程序、web 端、React-Native）中对于缓存层的使用。采用 ES6+ 语法，将全部 api 使用 Promise 包裹，并采用 jest 进行了完整的单元测试。

* 已在 npm 发布：https://www.npmjs.com/package/tua-storage
* 源码地址在：https://github.com/tuateam/tua-storage

这个包采用 rollup 打包，jest 测试。

## 1.配置 rollup
打开官网 https://rollupjs.org/ 看了看，都是常规操作，没啥好说的。

1. 安装 rollup 作为开发依赖 `yarn add -D rollup`
2. 编写 rollup 配置文件 `rollup.config.js` 放在项目根路径下
3. npm scripts 里写个打包的命令: `"build": "rollup -c",`
4. 执行 `npm run build`

报错了...识别不了 import 等新语法。很显然我们需要 babel 的帮助进行转换，不出所料，官网果然有说怎么和 babel 配合~ https://rollupjs.org/#babel。

按照教程配置完毕顺利打包~，美滋滋~。（坑在后面等着，别急...）

## 2.配置 eslint 和 uglify
都是常规操作，安装相关依赖和对应的插件 `rollup-plugin-eslint 和 rollup-plugin-uglify`，并将其添加到 rollup.config.js 中。

## 3.配置 jest
打开官网 https://facebook.github.io/jest/ 看了看，安装好 jest，写好测试文件 foo.test.js 后，运行测试~。

果然又报错了，说识别不了 import 等高端语法...

找了半天文档，没办法。应该是和 rollup 中打包打包源文件用的 babel 冲突了。

但是找到了一个解决方案，采用 buble 替代 babel 进行源文件的转换。使用 babel 进行测试源码的转换。

替换 `rollup-plugin-babel` 插件为 `rollup-plugin-buble`，并根据输出进行些许的改动成功跑起来了~

## 4.mock
这个项目要进行单元测试的话，一定会需要测试 localStorage/AsyncStorage 等对象。

还好已经有对应的 mock 包：

* localStorage -> jest-localstorage-mock
* AsyncStorage -> mock-async-storage

从名字上可以看出两者一个有 jest，一个没有。

jest-localstorage-mock 这个包可以很方便的加到 package.json 的 jest 属性的 setupFiles 数组中。

而 mock-async-storage 这个包就需要在测试文件里自己 import 了。

但由于没有小程序存储相关的包，导致我的代码覆盖率没法到 100%...

## 5.小体会
1. 翻别人源码的时候发现一个测试驱动开发（TDD）的命令：这样一来可以先写测试用例，然后再回头写源码跑通测试用例。

```
"scripts": {
    "tdd": "jest src/** --watch",
},
```

2. 发布时最好不要直接 `npm publish` 很可能你会忘了测试和编译源代码...所以建议使用 npm script，但是不要命名为 publish，不然会执行两遍！
