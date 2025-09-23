# 🚨 生产环境CORS问题最终修复

## 📋 问题分析

**生产环境问题**：

- 错误显示请求来源是 `https://jiji8.cc`
- 但请求URL却是 `https://jiji1.tv/index.php/ajax/ads.html`
- 这说明代码在生产环境没有使用 Nginx 代理，而是直接请求外部API

**根本原因**：

```javascript
// 之前的配置（有问题）
export const BASE_URL = import.meta.env.DEV ? '/api' : 'https://jiji1.tv'
```

在生产环境中，`BASE_URL` 被硬编码为 `https://jiji1.tv`，导致跳过了 Nginx 代理。

## ✅ 最终修复方案

### 1. 智能BASE_URL配置

```javascript
// src/utils/config.ts - 新的智能配置
export const BASE_URL = (() => {
  if (import.meta.env.DEV) {
    // 开发环境：使用Vite代理
    return '/api'
  } else {
    // 生产环境：智能检测部署方式
    if (import.meta.env.VITE_API_BASE_URL) {
      // 优先使用环境变量
      return import.meta.env.VITE_API_BASE_URL
    } else if (globalThis.location && location.hostname !== 'jiji1.tv') {
      // 如果部署在其他域名（如jiji8.cc），使用当前域名的API代理
      return `${location.protocol}//${location.hostname}/api`
    } else {
      // 兜底：直接使用jiji1.tv
      return 'https://jiji1.tv'
    }
  }
})()
```

### 2. 增强调试信息

```javascript
// 生产环境也显示配置信息，便于调试
console.log('🌍 API配置信息:')
console.log('  📺 视频API (jiji1.tv):', BASE_URL)
console.log('  👤 用户API (live.88tv.co):', NEW_API_BASE_URL)
console.log('  🔄 环境:', import.meta.env.DEV ? '开发环境' : '生产环境')
if (globalThis.location) {
  console.log('  🌐 当前域名:', location.hostname)
  console.log('  🎯 部署类型:', location.hostname === 'jiji1.tv' ? '直接部署' : '代理部署')
}
```

## 🎯 修复逻辑

### 不同部署场景的处理

| 部署场景     | 域名             | BASE_URL               | 请求流程                    |
| ------------ | ---------------- | ---------------------- | --------------------------- |
| **开发环境** | `localhost:3000` | `/api`                 | 前端 → Vite代理 → jiji1.tv  |
| **代理部署** | `jiji8.cc`       | `https://jiji8.cc/api` | 前端 → Nginx代理 → jiji1.tv |
| **直接部署** | `jiji1.tv`       | `https://jiji1.tv`     | 前端 → 直接请求             |
| **环境变量** | 任意             | `$VITE_API_BASE_URL`   | 前端 → 自定义地址           |

### 智能检测流程

```
1. 是开发环境？ → 使用 '/api' (Vite代理)
2. 有环境变量？ → 使用 VITE_API_BASE_URL
3. 当前域名不是jiji1.tv？ → 使用 '当前域名/api' (Nginx代理)
4. 兜底处理 → 使用 'https://jiji1.tv' (直接请求)
```

## 🚀 部署验证

### 重新构建

```bash
npm run build
```

### 预期的生产环境配置

在 `https://jiji8.cc` 上，控制台应该显示：

```
🌍 API配置信息:
  📺 视频API (jiji1.tv): https://jiji8.cc/api
  👤 用户API (live.88tv.co): https://live.88tv.co/appapi/
  🔄 环境: 生产环境
  🌐 当前域名: jiji8.cc
  🎯 部署类型: 代理部署

🚑 使用的API地址: https://jiji8.cc/api
🌐 请求URL: https://jiji8.cc/api/index.php/ajax/ads.html?ad_pos=1&ad_type=1
```

## 🎯 成功指标

**✅ 修复成功后**：

- 控制台显示 `视频API: https://jiji8.cc/api`
- 请求URL显示 `https://jiji8.cc/api/...`
- 无CORS错误
- 广告和其他数据正常加载

**❌ 仍有问题**：

- 控制台显示 `视频API: https://jiji1.tv`
- 请求URL显示 `https://jiji1.tv/...`
- 继续出现CORS错误

## 🔧 Nginx配置确认

确保服务器的Nginx配置包含：

```nginx
location /api/ {
    proxy_pass https://jiji1.tv/;
    proxy_set_header Host jiji1.tv;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 📈 优势

1. **智能检测**：自动适配不同部署环境
2. **向后兼容**：保持原有功能不变
3. **环境变量支持**：可通过配置覆盖
4. **调试友好**：详细的配置信息输出
5. **零配置部署**：多数情况下无需额外配置

现在重新构建并部署，应该能彻底解决CORS问题！🎯✨
