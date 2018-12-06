/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "404.html",
    "revision": "a218453fedff5b31c65e7ff2e062e31e"
  },
  {
    "url": "assets/css/0.styles.b4d16e30.css",
    "revision": "b969ab7e6587a0b627255832789c25a0"
  },
  {
    "url": "assets/img/search.83621669.svg",
    "revision": "83621669651b9a3d4bf64d1a670ad856"
  },
  {
    "url": "assets/js/10.25d5417e.js",
    "revision": "146e6a05d0344088c1fcb2ed252787c7"
  },
  {
    "url": "assets/js/2.a4cf675e.js",
    "revision": "1c6b048b81dfea0ce9854bdbb68e1bc2"
  },
  {
    "url": "assets/js/3.5f1262b4.js",
    "revision": "ab79107f67f56c444f8488e703b48dc3"
  },
  {
    "url": "assets/js/4.9e6d2dd7.js",
    "revision": "5565931429285380a718de0221127d32"
  },
  {
    "url": "assets/js/5.ac38feb8.js",
    "revision": "fdaa96bc32c38ba2c24d8fa983276791"
  },
  {
    "url": "assets/js/6.7a2d1744.js",
    "revision": "a7d71ff64349af1dd8eca5a40a934448"
  },
  {
    "url": "assets/js/7.86d9e69d.js",
    "revision": "f7eabbad59f5d44b3af2e48f81270172"
  },
  {
    "url": "assets/js/8.df2c4952.js",
    "revision": "4edae84356c8889de670182cca3bfc15"
  },
  {
    "url": "assets/js/9.76f01b6f.js",
    "revision": "62d618e477aa1d6e45c229d8227b03bd"
  },
  {
    "url": "assets/js/app.c803e01d.js",
    "revision": "f5c9151049eb7222859ade4e54c33556"
  },
  {
    "url": "config-methods/default.html",
    "revision": "dcdff6a3a7dc6225ee13d7d7b2952f40"
  },
  {
    "url": "config-methods/index.html",
    "revision": "33efe220de478521b6e833dd8e2eafc5"
  },
  {
    "url": "config-methods/methods.html",
    "revision": "dc7fb05d899da4973acf67c4fc63b6b1"
  },
  {
    "url": "index.html",
    "revision": "25dc9a0ebc18dc950ffc7b27e126e04d"
  },
  {
    "url": "logo.png",
    "revision": "7f5f5300ded88b992de697c61021a507"
  },
  {
    "url": "quick-start/index.html",
    "revision": "216e4f23b0b4f5a891975b2cc138322a"
  },
  {
    "url": "quick-start/installation.html",
    "revision": "a3b00d1af8b423979486483e3883ae26"
  },
  {
    "url": "quick-start/sync-data.html",
    "revision": "b1bc71b637dc40389102965975369d0e"
  },
  {
    "url": "standard.svg",
    "revision": "92650602b63995390fc74b25ea4bd501"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () => replyPort.postMessage({ error: null }),
        error => replyPort.postMessage({ error })
      )
    )
  }
})
