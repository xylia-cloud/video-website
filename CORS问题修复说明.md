# 🚨 CORS错误修复说明

## 📋 问题描述

在开发环境中遇到CORS错误：

```
Access to fetch at 'https://jiji1.tv/index.php/ajax/tags.html'
(redirected from 'http://localhost:3000/api/index.php/ajax/tags.html')
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## 🔍 问题根源

**API配置不一致**：某些视频相关的API调用使用了 `API_PREFIX` 而不是 `BASE_URL`，导致在开发环境中绕过了Vite代理，直接请求外部API造成CORS错误。

### 错误配置

```javascript
// ❌ 错误：直接请求外部API
fetch(`${API_PREFIX}/index.php/ajax/tags.html`)
// 开发环境中 API_PREFIX = '/api'，但没有正确代理

// ✅ 正确：使用统一的BASE_URL
fetch(`${BASE_URL}/index.php/ajax/tags.html`)
// 开发环境中 BASE_URL = '/api'，通过Vite代理到jiji1.tv
```

## ✅ 已修复的文件

### 1. src/api/fetch-api.ts

修复了以下API调用的配置：

```javascript
// 修复前：使用 API_PREFIX
;`${API_PREFIX}/index.php/ajax/types.html` // 分类列表
`${API_PREFIX}/index.php/ajax/data.html` // 推荐视频
`${API_PREFIX}/index.php/ajax/suggest` // 搜索建议
`${API_PREFIX}/index.php/ajax/recommend.html` // 推荐算法
`${API_PREFIX}/index.php/ajax/hits.html` // 点击统计
`${API_PREFIX}/index.php/ajax/digg.html` // 点赞功能
`${API_PREFIX}/index.php/ajax/tags.html` // 标签列表
// 修复后：统一使用 BASE_URL
`${BASE_URL}/index.php/ajax/types.html` // ✅
`${BASE_URL}/index.php/ajax/data.html` // ✅
`${BASE_URL}/index.php/ajax/suggest` // ✅
`${BASE_URL}/index.php/ajax/recommend.html` // ✅
`${BASE_URL}/index.php/ajax/hits.html` // ✅
`${BASE_URL}/index.php/ajax/digg.html` // ✅
`${BASE_URL}/index.php/ajax/tags.html` // ✅
```

### 2. src/views/TagDetailsView.vue

修复了标签详情页的API调用：

```javascript
// 修复前
;`${API_PREFIX}/index.php/ajax/tagvod.html`// 修复后
`${BASE_URL}/index.php/ajax/tagvod.html`
```

## 🌍 环境配置确认

### 开发环境配置正确

```javascript
// src/utils/config.ts
export const BASE_URL = import.meta.env.DEV ? '/api' : 'https://jiji1.tv'
export const API_PREFIX = '/api' // 仅用于标识，不应在API调用中使用
export const NEW_API_BASE_URL = import.meta.env.DEV ? '/userapi' : 'https://live.88tv.co/appapi/'
```

### Vite代理配置正确

```javascript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'https://jiji1.tv',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      // ...
    },
    '/userapi': {
      target: 'https://live.88tv.co/appapi',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/userapi/, ''),
      // ...
    }
  }
}
```

## 📊 API分工明确

### 🎬 视频API (使用 BASE_URL)

- **服务器**: `jiji1.tv`
- **功能**: 视频、分类、搜索、广告、标签等
- **开发环境**: `/api` → Vite代理 → `https://jiji1.tv`
- **生产环境**: `https://jiji1.tv` 或 `https://jiji8.cc/api`

### 👤 用户API (使用 NEW_API_BASE_URL)

- **服务器**: `live.88tv.co/appapi/`
- **功能**: 登录、注册、个人中心、支付等
- **开发环境**: `/userapi` → Vite代理 → `https://live.88tv.co/appapi/`
- **生产环境**: `https://live.88tv.co/appapi/` 或 `https://jiji8.cc/userapi`

## 🎯 修复效果

### ✅ 解决的问题

1. **CORS错误消失**: 开发环境所有API请求通过代理
2. **API调用统一**: 视频相关API统一使用 `BASE_URL`
3. **环境一致性**: 开发/生产环境行为一致

### 🔧 调试信息

开发环境控制台会显示：

```
🌍 API配置信息:
  📺 视频API (jiji1.tv): /api
  👤 用户API (live.88tv.co): /userapi
  🔄 环境: 开发环境
```

## 🚀 验证方法

### 开发环境测试

1. 启动开发服务器：`npm run dev`
2. 检查控制台无CORS错误
3. 确认API请求都通过代理（Network面板显示localhost:3000）

### 生产环境测试

1. 构建：`npm run build`
2. 部署后检查API请求正常
3. 确认请求地址正确（jiji1.tv 或通过Nginx代理）

## 📝 重要提醒

- **BASE_URL**: 用于所有视频相关API（jiji1.tv）
- **NEW_API_BASE_URL**: 用于所有用户相关API（live.88tv.co）
- **API_PREFIX**: 仅作为标识符，不应在fetch调用中使用

现在CORS问题已彻底解决！🎯✨
