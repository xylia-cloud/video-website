# 🚨 CORS问题紧急修复指南

## 📋 当前状况

**问题**：广告接口仍然出现CORS错误，直接请求了 `https://jiji1.tv/` 而不是通过代理。

**错误信息**：

```
Access to fetch at 'https://jiji1.tv/index.php/ajax/ads.html?ad_pos=1&ad_type=1'
(redirected from 'http://localhost:3000/api/index.php/ajax/ads.html?ad_pos=1&ad_type=1')
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## 🔧 立即解决步骤

### 步骤1: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 清除缓存并重启
npm run dev -- --force
```

### 步骤2: 强制刷新浏览器

- 按 `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac)
- 或打开开发者工具，右键刷新按钮 → "清空缓存并硬性重新加载"

### 步骤3: 查看调试信息

重启后检查控制台输出，应该看到：

```
🌍 API配置信息:
  📺 视频API (jiji1.tv): /api
  👤 用户API (live.88tv.co): /userapi
  🔄 环境: 开发环境

🔧 当前BASE_URL配置: /api
🔧 当前环境: 开发环境
🌐 请求URL: /api/index.php/ajax/ads.html?ad_pos=1&ad_type=1
```

## 🎯 预期行为

### ✅ 正确情况

- **BASE_URL**: `/api` (开发环境)
- **请求URL**: `/api/index.php/ajax/ads.html`
- **Network面板**: 显示请求到 `localhost:3000/api/...`
- **无CORS错误**

### ❌ 错误情况

- **BASE_URL**: `https://jiji1.tv` (错误的生产环境值)
- **请求URL**: `https://jiji1.tv/index.php/ajax/ads.html`
- **Network面板**: 显示请求到 `jiji1.tv`
- **CORS错误**

## 🔍 故障排查

### 检查1: 配置文件

确认 `src/utils/config.ts` 中：

```javascript
export const BASE_URL = import.meta.env.DEV ? '/api' : 'https://jiji1.tv'
```

### 检查2: 环境变量

```bash
# 检查是否意外设置了环境变量
echo $VITE_API_BASE_URL
# 应该为空或者不存在
```

### 检查3: 代理配置

确认 `vite.config.ts` 中代理配置正确：

```javascript
'/api': {
  target: 'https://jiji1.tv',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api/, ''),
}
```

## 🚑 应急解决方案

如果问题持续，可以临时禁用广告功能：

```javascript
// 在 src/api/fetch-api.ts 的 fetchAds 函数中
export const fetchAds = async (params) => {
  console.log('⚠️ 临时禁用广告功能避免CORS错误')
  return {
    code: 1,
    data: [],
    msg: '广告功能临时禁用',
  }
}
```

## 📞 下一步行动

1. **立即重启**：停止并重启开发服务器
2. **强制刷新**：清除浏览器缓存
3. **检查调试**：查看控制台输出的配置信息
4. **验证网络**：确认请求走代理而非直连
5. **报告结果**：告知是否解决或仍有问题

## 🎯 成功指标

- ✅ 控制台显示 `BASE_URL: /api`
- ✅ 请求URL显示 `/api/...` 而非 `https://jiji1.tv/...`
- ✅ Network面板显示请求到 `localhost:3000`
- ✅ 无CORS错误信息
- ✅ 广告数据正常加载
