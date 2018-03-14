!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t(e.TuaStorage={})}(this,function(e){"use strict";var t,r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},y=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},n=function(){function n(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(e,t,r){return t&&n(e.prototype,t),r&&n(e,r),e}}(),v=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e},i=function(e,t){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return function(e,t){var r=[],n=!0,i=!1,a=void 0;try{for(var o,u=e[Symbol.iterator]();!(n=(o=u.next()).done)&&(r.push(o.value),!t||r.length!==t);n=!0);}catch(e){i=!0,a=e}finally{try{!n&&u.return&&u.return()}finally{if(i)throw a}}return r}(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")},c=function(e){if(Array.isArray(e)){for(var t=0,r=Array(e.length);t<e.length;t++)r[t]=e[t];return r}return Array.from(e)},o="请输入参数 key 或 fullKey!",d="syncFn 请返回 Promise!",p=30,m="TUA_STORAGE_PREFIX: ",g=function(e){return function(){return!e.apply(void 0,arguments)}},_=function(e){return"string"==typeof e?JSON.parse(e):e},a=function(e,t,r){var a=r.value;return r.value=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",t="string"==typeof e?{key:e}:e,r=t.key,n=void 0===r?"":r,i=t.fullKey;return""===n&&""===(void 0===i?"":i)?Promise.reject(o):a.call(this,e)},r},u=function(e,t,r){var n=r.value;return r.value=function(e){var t=this;return Array.isArray(e)?Promise.all(e.map(function(e){return n.call(t,e)})):n.call(this,e)},r};function s(r,n,e,t,i){var a={};return Object.keys(t).forEach(function(e){a[e]=t[e]}),a.enumerable=!!a.enumerable,a.configurable=!!a.configurable,("value"in a||a.initializer)&&(a.writable=!0),a=e.slice().reverse().reduce(function(e,t){return t(r,n,e)||e},a),i&&void 0!==a.initializer&&(a.value=a.initializer?a.initializer.call(i):void 0,a.initializer=void 0),void 0===a.initializer&&(Object.defineProperty(r,n,a),a=null),a}var l="There is NO valid storageEngine specified!\nPlease use:\n* wx (for miniprogram),\n* localStorage (for web),\n* AsyncStorage (for React Native)\nas the storageEngine...\nOtherwise data would be saved in cache(Memory) and lost after reload...";console.log("Tua-Storage Version: 1.3.0");var E=Promise.all.bind(Promise),S=Promise.reject.bind(Promise),k=Promise.resolve.bind(Promise),b=JSON.stringify.bind(JSON),f=(s((t=function(){function h(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{},t=e.syncFnMap,r=void 0===t?{}:t,n=e.whiteList,i=void 0===n?[]:n,a=e.storageEngine,o=void 0===a?null:a,u=e.defaultExpires,s=void 0===u?p:u,c=e.storageKeyPrefix,l=void 0===c?m:c;y(this,h),this.SE=o,this.taskList=[],this.whiteList=i,this.syncFnMap=r,this.defaultExpires=s,this.neverExpireMark=null,this.storageKeyPrefix=l,this.SEMap=this._getFormatedSE(),this._cache=Object.create(null);var f=this._clearExpiredData.bind(this);setTimeout(f,0),setInterval(f,6e4)}return n(h,[{key:"clear",value:function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:[];return this._clearFromCache(e),this.SEMap._clear(e)}},{key:"load",value:function(e){var t=e.key,r=void 0===t?"":t,n=e.syncFn,i=void 0===n?this.syncFnMap[r]:n,a=e.expires,o=void 0===a?this.defaultExpires:a,u=e.fullKey,s=void 0===u?"":u,c=e.syncParams,l=void 0===c?{}:c,f=e.isAutoSave,h=void 0===f||f,y=e.isEnableCache,v=void 0===y||y,d=s||this._getQueryKeyStr({prefix:r,syncParams:l});return this._findData({key:d,syncFn:i,expires:o,syncParams:l,isAutoSave:h,isEnableCache:v})}},{key:"remove",value:function(e){var t=("object"===(void 0===e?"undefined":r(e))?e.fullKey:"")||this.storageKeyPrefix+e;return delete this._cache[t],this.SEMap._removeItem(t)}},{key:"save",value:function(e){var t=e.key,r=void 0===t?"":t,n=e.data,i=e.expires,a=void 0===i?this.defaultExpires:i,o=e.fullKey,u=void 0===o?"":o,s=e.syncParams,c=void 0===s?{}:s,l=e.isEnableCache,f=void 0===l||l,h=this._isNeverExpired(a),y=h?this.neverExpireMark:parseInt(Date.now()/1e3)+a,v=u||this._getQueryKeyStr({prefix:r,syncParams:c}),d={rawData:n,expires:y};return!h&&a<=0?k():(f&&(this._cache[v]=d),this.SEMap._setItem(v,d))}},{key:"_clearFromCache",value:function(e){var t=this;this._getKeysByWhiteList(e)(Object.keys(this._cache)).forEach(function(e){delete t._cache[e]})}},{key:"_clearExpiredDataFromCache",value:function(){var n=this;Object.entries(this._cache).filter(function(e){var t=i(e,2),r=(t[0],t[1]);return n._isDataExpired(r)}).map(function(e){var t=i(e,1)[0];delete n._cache[t]})}},{key:"_clearExpiredData",value:function(){var r=this,e=this.SEMap,n=e._getItem,t=e._getAllKeys,i=e._removeItem;return this._clearExpiredDataFromCache(),t().then(function(e){return e.map(function(t){return n(t).then(_).catch(function(){}).then(r._isDataExpired.bind(r)).then(function(e){return e?i(t):k()})})}).then(E)}},{key:"_findData",value:function(e){var t=this,r=e.key,n=e.isEnableCache,i=function(e,t){var r={};for(var n in e)0<=t.indexOf(n)||Object.prototype.hasOwnProperty.call(e,n)&&(r[n]=e[n]);return r}(e,["key","isEnableCache"]),a=this._cache[r];return n&&a?this._loadData(v({key:r,cacheData:a},i)):this.SEMap._getItem(r).then(function(e){return t._loadData(v({key:r,cacheData:e},i))}).catch(function(){return t._loadData(v({key:r},i))})}},{key:"_formatMethodsByAS",value:function(){var t=this,e=this.SE,r=e.getItem,n=e.setItem,i=e.getAllKeys,a=e.removeItem,o=e.multiRemove,u=function(e){return e.bind(t.SE)},s=u(r),c=u(n),l=u(i),f=u(a);return{_clear:function(e){return l().then(t._getKeysByWhiteList(e)).then(u(o)).catch(console.error)},_getItem:s,_setItem:c,_getAllKeys:l,_removeItem:f}}},{key:"_formatMethodsByLS",value:function(){var o=this,e=this.SE,t=e.getItem,r=e.setItem,n=e.removeItem,i=function(n){return function(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return k(n.apply(o.SE,t))}},a=i(t),u=function(){for(var e=o.SE,t=e.key,r=[],n=0,i=e.length;n<i;n++){var a=t.call(o.SE,n);r.push(a)}return k(r)},s=i(n);return{_clear:function(e){var r=[].concat(c(e),c(o.whiteList)),t=function(t){return r.every(function(e){return!t.includes(e)})};return u().then(function(e){return e.filter(t)}).then(function(e){return e.map(function(e){return s(e)})}).then(E).catch(console.error)},_getItem:a,_setItem:function(e,t){return i(r)(e,b(t))},_getAllKeys:u,_removeItem:s}}},{key:"_formatMethodsByWX",value:function(){var i=this,e=this.SE,t=e.getStorage,r=e.setStorage,n=e.removeStorage,a=e.getStorageInfo,o=function(n){return function(){var r=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};return new Promise(function(e,t){return n.call(i.SE,v({fail:t,success:e},r))})}},u=o(n),s=o(t),c=o(r),l=o(a),f=function(e){return u({key:e})},h=function(){return l().then(function(e){return e.keys})};return{_clear:function(e){return h().then(i._getKeysByWhiteList(e)).then(function(e){return e.map(f)}).then(E)},_getItem:function(e){return s({key:e}).then(function(e){return e.data})},_setItem:function(e,t){return c({key:e,data:t})},_getAllKeys:h,_removeItem:f}}},{key:"_getFormatedSE",value:function(){var t=this,r={_clear:k,_setItem:k,_getItem:k,_getAllKeys:function(){return k([])},_removeItem:k};if(!this.SE)return console.warn(l),r;var e={wx:["setStorage","getStorage","removeStorage","getStorageInfo"],ls:["getItem","setItem","removeItem"],as:["getItem","setItem","multiRemove"]},n=function(e){return!!t.SE[e]};if(e.wx.every(n))return this._formatMethodsByWX();var i=e.ls.filter(g(n)),a=e.as.filter(g(n)),o=e.wx.filter(g(n));if(i.length&&a.length&&o.length){var u=function(e){return console.warn("Missing required apis:\n* "+e.join("\n* "))};i.length&&u(i),a.length&&u(a),o.length&&u(o),console.warn(l)}try{var s=this.SE.setItem("test","test");return this.SE.removeItem("test"),!(!s||!s.then)?this._formatMethodsByAS():this._formatMethodsByLS()}catch(e){return r}}},{key:"_getKeysByWhiteList",value:function(e){var r=[].concat(c(e),c(this.whiteList));return function(e){return e.filter(function(t){return r.every(function(e){return!t.includes(e)})})}}},{key:"_getQueryKeyStr",value:function(e){var t=e.prefix,r=e.syncParams;return this.storageKeyPrefix+(0===Object.keys(r).length?t:t+"?"+function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};return Object.entries(e).map(function(e){var t=i(e,2),r=t[0],n=t[1];return r+"="+encodeURIComponent(n)}).join("&")}(r))}},{key:"_loadData",value:function(e){var a=this,o=e.key,u=e.syncFn,s=e.expires,t=e.cacheData,c=e.syncParams,l=e.isAutoSave,r=function(){var e=function(e){return e.key===o},t=a.taskList.find(e),n=function(){a.taskList=a.taskList.filter(g(e))};if(t)return t.task;var r=u(c);if(!!(!r||!r.then))return S(d);var i=r.then(function(e){return null==e.code&&null==e.data?{data:e}:e}).then(function(e){var t=e.code;return{code:+(void 0===t?0:t),data:e.data}}).then(function(e){var t=e.code,r=e.data;return n(),0===t&&l&&a.save({key:o.replace(a.storageKeyPrefix,""),data:{code:t,data:r},expires:s}).catch(console.warn),{code:t,data:r}}).catch(n);return a.taskList.push({key:o,task:i}),i},n=function(){return S(new Error(b({key:o,syncFn:u})))};if(null==t)return u?r():n();var i=t=_(t),f=i.expires,h=i.rawData;return this._isDataExpired({expires:f})?u?r():n():k(h)}},{key:"_isDataExpired",value:function(e){if(!e)return!1;var t=e.expires,r=void 0===t?this.neverExpireMark:t;return!this._isNeverExpired(r)&&+r<parseInt(Date.now()/1e3)}},{key:"_isNeverExpired",value:function(e){return e===this.neverExpireMark}}]),h}()).prototype,"load",[u,a],Object.getOwnPropertyDescriptor(t.prototype,"load"),t.prototype),s(t.prototype,"remove",[u,a],Object.getOwnPropertyDescriptor(t.prototype,"remove"),t.prototype),s(t.prototype,"save",[u,a],Object.getOwnPropertyDescriptor(t.prototype,"save"),t.prototype),t);e.default=f,Object.defineProperty(e,"__esModule",{value:!0})});
