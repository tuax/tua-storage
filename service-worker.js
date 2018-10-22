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

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.2/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "404.html",
    "revision": "fe43e9ad3f8a754d777dbbc748db4442"
  },
  {
    "url": "api/default.html",
    "revision": "f18d2cca2437b7f6c9ca090485a217fa"
  },
  {
    "url": "api/index.html",
    "revision": "3c13c1778731a3389fdd7d8331ae0bad"
  },
  {
    "url": "api/methods.html",
    "revision": "932bdff4b735ea7a6336f1d349ebde3e"
  },
  {
    "url": "assets/css/1.styles.3ac4ce2d.css",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  },
  {
    "url": "assets/css/2.styles.9d3b15ac.css",
    "revision": "df7c35ec8029dbbde0735a45f875eaf7"
  },
  {
    "url": "assets/css/styles.4381bcfd.css",
    "revision": "70decdd9b1b1ee38d07d58dab68bd9d0"
  },
  {
    "url": "assets/img/search.83621669.svg",
    "revision": "83621669651b9a3d4bf64d1a670ad856"
  },
  {
    "url": "assets/js/1.3ac4ce2d.js",
    "revision": "aa0a3e3ca70cfb3cbf1c8c7dd2c544d9"
  },
  {
    "url": "assets/js/2.9d3b15ac.js",
    "revision": "bcc486eea5a9b9b81519cb7ff4663161"
  },
  {
    "url": "assets/js/3.d4de7ce2.js",
    "revision": "6c0eb1ebaeaa0aa0e1d94fb1420edf8b"
  },
  {
    "url": "assets/js/4.1581d24b.js",
    "revision": "cee928c5ab74148a606c98316fc6b077"
  },
  {
    "url": "assets/js/5.c5d24809.js",
    "revision": "8dac8657221959cbdbf7fd1f66d13765"
  },
  {
    "url": "assets/js/6.d9e12ba0.js",
    "revision": "54a4f6b943e91142cb2c780a105209ea"
  },
  {
    "url": "assets/js/7.3c74a60d.js",
    "revision": "33b02217603394dec8df7d4c3430fd2e"
  },
  {
    "url": "assets/js/8.2be0cfe3.js",
    "revision": "199d68957e56af479cb0eab56298f431"
  },
  {
    "url": "assets/js/9.65ff44da.js",
    "revision": "d75a3b1994e3a0dd66896ba77140c3f3"
  },
  {
    "url": "assets/js/app.4381bcfd.js",
    "revision": "5408880a9299db8e5c43dfc099ec88a4"
  },
  {
    "url": "index.html",
    "revision": "1f165c0d7cb3ea9f29a272c22c2c19b9"
  },
  {
    "url": "logo.png",
    "revision": "7f5f5300ded88b992de697c61021a507"
  },
  {
    "url": "quick-start/index.html",
    "revision": "674933a144e0f9653dbaaa45fe0e249d"
  },
  {
    "url": "quick-start/installation.html",
    "revision": "adff32cd5383c1f897e6a79e2e894471"
  },
  {
    "url": "quick-start/sync-data.html",
    "revision": "a4eef38810845c5fc5c70425c3dcb9cc"
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
