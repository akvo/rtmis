const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    ["/api/**", "/static-files/**"],
    createProxyMiddleware({
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
    })
  );
  app.use(
    ["/config.js"],
    createProxyMiddleware({
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        "^/config.js": "/api/v1/config.js",
      },
    })
  );
  app.use(
    ["/app"],
    createProxyMiddleware({
      target: "http://127.0.0.1:3000",
      changeOrigin: true,
      pathRewrite: {
        "^/app": "/apk/rtmis.apk",
      },
    })
  );
  app.use(
    ["/master-data"],
    createProxyMiddleware({
      target: "http://127.0.0.1:3000",
      changeOrigin: true,
      pathRewrite: {
        "^/master-data": "/master_data/kenya-administration.csv",
      },
    })
  );
};
