const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    ["/api/**","/static/**"],
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
      // pathRewrite: {
      //   "^/api/": "/",
      // },
    })
  );
};
