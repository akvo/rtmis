/* App Identifier */
var APP_PREFIX = "RUSH_";
/* Change this to update cache */
var CACHE_VERSION = "##CACHE_VERSION##";
var CACHE_NAME = APP_PREFIX + CACHE_VERSION;
/* List of cached data */
var URLS = [
  "/", // Separate JS/CSS files,
  "/index.html", // add path to those files here
];

// Respond with cached resources
self.addEventListener("fetch", (e) => {
  console.info("fetch request : " + e.request.url);
  e.respondWith(
    caches.match(e.request).then((request) => {
      if (request) {
        // if cache is available, respond with cache
        console.info("responding with cache : " + e.request.url);
        return request;
      }
      // if there are no cache, try fetching request
      console.info("file is not cached, fetching : " + e.request.url);
      return fetch(e.request);

      // You can omit if/else for console.log & put one line below like this too.
      // return request || fetch(e.request)
    })
  );
});

// Cache resources
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.info("installing cache : " + CACHE_NAME);
      return cache.addAll(URLS);
    })
  );
});

// Delete outdated caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      // `keyList` contains all cache names under your username.github.io
      // filter out ones that has this app prefix to create white list
      var cacheWhitelist = keyList.filter((key) => {
        return key.indexOf(APP_PREFIX);
      });
      // add current cache name to white list
      cacheWhitelist.push(CACHE_NAME);

      return Promise.all(
        keyList.map((key, i) => {
          if (cacheWhitelist.indexOf(key) === -1) {
            console.info("deleting cache : " + keyList[i]);
            return caches.delete(keyList[i]);
          }
        })
      );
    })
  );
});
