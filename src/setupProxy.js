// src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api/public",
    createProxyMiddleware({
      target: "https://growfy.tech",
      changeOrigin: true,
      secure: true,
      logLevel: "debug",
    })
  );
};
