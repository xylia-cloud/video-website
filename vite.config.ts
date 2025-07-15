import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0', // 监听所有地址
    port: 3000, // 指定端口号
    strictPort: false, // 如果端口被占用，尝试下一个可用端口
    open: true, // 启动后自动打开浏览器
    proxy: {
      // 配置跨域代理
      '/api': {
        target: 'http://jmlapp.vip', // 更新为新的接口地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false, // 允许不安全的证书
        timeout: 30000, // 增加超时时间
        proxyTimeout: 30000,
        headers: {
          // 一些常见的请求头
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Connection': 'keep-alive',
          'Origin': 'http://jmlapp.vip',
          'Referer': 'http://jmlapp.vip/'
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('发送代理请求:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('收到代理响应:', proxyRes.statusCode || -1, req.url);
            // 输出响应头
            console.log('响应头:', proxyRes.headers);
            
            // 如果是错误响应，打印详细信息
            if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
              let body = '';
              proxyRes.on('data', function(chunk) {
                body += chunk;
              });
              proxyRes.on('end', function() {
                console.log('错误响应详情:', body);
              });
            }
          });
        }
      }
    }
  }
})
