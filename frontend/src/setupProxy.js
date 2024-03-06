const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    ["/api/**", "/static-files/**"],
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
    })
  );
  app.use(
    ["/config.js"],
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
      pathRewrite: {
        "^/config.js": "/api/v1/config.js",
      },
    })
  );
  app.use(
    ["/master-data"],
    createProxyMiddleware({
      target: "http://localhost:3000",
      changeOrigin: true,
      pathRewrite: {
        "^/master-data": "/master_data/kenya-administration.csv",
      },
    })
  );
};
