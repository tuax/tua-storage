# 在 Vue 中使用 tua-storage <Badge text="1.6.0+"/>
## 代码示例

```js
import Vue from 'vue'
import TuaStorage from 'tua-storage'

Vue.use(TuaStorage, {
    storageEngine: window.localStorage,
    // other options
})
```

之后在组件中通过 `this.$tuaStorage` 即可获取实例。

```vue
<template>...</template>

<script>
export default {
    methods: {
        async fetchData () {
            try {
                const data = await this.$tuaStorage.load({ ... })
                console.log('data', data)
            } catch (e) {
                console.error(e)
            }
        },
    },
}
</script>

<style>...</style>
```
