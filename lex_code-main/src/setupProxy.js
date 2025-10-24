const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for DeepSeek API
  app.use(
    '/api/deepseek',
    createProxyMiddleware({
      target: 'https://api.deepseek.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/deepseek': '', // remove /api/deepseek from the path
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  );

  // Proxy for Aliyun DashScope API
  app.use(
    '/api/aliyun',
    createProxyMiddleware({
      target: 'https://dashscope.aliyuncs.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/aliyun': '', // remove /api/aliyun from the path
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-DashScope-Async',
      },
    })
  );
};