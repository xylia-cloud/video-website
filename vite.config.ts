import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 🔥 生产环境构建配置
  build: {
    // 移除生产环境的 console 和 debugger
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除所有 console
        drop_debugger: true, // 移除 debugger
      },
    },
  },
  server: {
    host: '0.0.0.0', // 监听所有地址
    port: 3000, // 指定端口号
    strictPort: false, // 如果端口被占用，尝试下一个可用端口
    open: true, // 启动后自动打开浏览器
    proxy: {
      // 配置跨域代理 - 原有接口
      '/api': {
        target: 'https://jiji1.tv',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
        followRedirects: true, // 🔧 关键修复：让代理处理重定向
        timeout: 30000,
        proxyTimeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
          Accept: '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          Connection: 'keep-alive',
          Origin: 'https://jiji1.tv',
          Referer: 'https://jiji1.tv/',
        },
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('API代理错误:', err)
          })
          // 临时启用详细日志以调试301重定向问题
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🚀 发送代理请求:', req.method, req.url)
            console.log('🎯 目标地址:', proxyReq.path)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            const statusCode = proxyRes.statusCode || -1
            console.log('📥 收到代理响应:', statusCode, req.url)
            if (statusCode === 301 || statusCode === 302) {
              console.warn('⚠️ 检测到重定向，Location:', proxyRes.headers.location)
            }
          })
        },
      },
      // 配置跨域代理 - 用户接口（livevideo）
      '/livevideo/': {
        target: 'https://live.88tv.co/appapi/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/livevideo\//, '/'),
        secure: false,
        timeout: 30000,
        proxyTimeout: 30000,
        followRedirects: true,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          Connection: 'keep-alive',
        },
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('用户API代理错误:', err)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            // 只记录重定向和错误状态
            const statusCode = proxyRes.statusCode
            if (statusCode === 301 || statusCode === 302) {
              console.warn('检测到重定向，Location:', proxyRes.headers.location)
            } else if (statusCode && statusCode >= 400) {
              console.error('API请求失败:', statusCode, req.url)
            }
          })
        },
      },
    },
  },
})
