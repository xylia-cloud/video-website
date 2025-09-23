# 🌐 API分工配置说明

## 📋 双API系统架构

您的系统使用两个不同的API服务器，各自负责不同的功能模块：

### 🎬 视频相关API - jiji1.tv

**服务器**: `https://jiji1.tv/` (苹果CMS系统)

**负责功能**:

- 视频列表 (`/index.php/ajax/data.html`)
- 视频详情 (`/index.php/ajax/details.html`)
- 视频分类 (`/index.php/ajax/types.html`)
- 视频搜索 (`/index.php/ajax/suggest`)
- 广告管理 (`/index.php/ajax/ads.html`)
- 标签管理 (`/index.php/ajax/tags.html`)
- 推荐算法 (`/index.php/ajax/recommend.html`)
- 点击统计 (`/index.php/ajax/hits.html`)
- 点赞功能 (`/index.php/ajax/digg.html`)

### 👤 用户相关API - live.88tv.co

**服务器**: `https://live.88tv.co/appapi/`

**负责功能**:

- 用户登录/注册
- 个人中心
- 用户信息管理
- 支付相关
- 钱包功能
- 充值/提现
- 游戏记录
- 积分系统

## 🔧 当前配置

### 配置文件 (`src/utils/config.ts`)

```javascript
// 🎬 视频相关API - jiji1.tv
export const BASE_URL = import.meta.env.DEV ? '/api' : 'https://jiji1.tv'

// 👤 用户相关API - live.88tv.co
export const NEW_API_BASE_URL = import.meta.env.DEV ? '/userapi' : 'https://live.88tv.co/appapi/'
```

### Nginx代理配置

```nginx
# 视频API代理
location /api/ {
    proxy_pass https://jiji1.tv/;
    proxy_set_header Host jiji1.tv;
    # ...
}

# 用户API代理
location /userapi/ {
    proxy_pass https://live.88tv.co/appapi/;
    proxy_set_header Host live.88tv.co;  # ⚠️ 需要修复：移除路径
    # ...
}
```

## 🎯 API使用情况

### ✅ 正确使用BASE_URL的接口

这些应该使用 `BASE_URL` (jiji1.tv):

- `fetchVideoDetails` - 视频详情
- `fetchTypesList` - 分类列表
- `fetchRecommendVideos` - 推荐视频
- `fetchSearchVideos` - 搜索视频
- `fetchAds` - 广告数据
- `fetchTags` - 标签列表
- `getRecommendVideos` - 视频API

### ✅ 正确使用NEW_API_BASE_URL的接口

这些应该使用 `NEW_API_BASE_URL` (live.88tv.co):

- `userLogin` - 用户登录
- `userRegister` - 用户注册
- `getUserInfo` - 用户信息
- `updateUserInfo` - 更新用户信息
- 支付相关接口
- 钱包相关接口

## 🌍 环境配置

### 开发环境

```javascript
BASE_URL = '/api' // → Vite代理 → https://jiji1.tv/
NEW_API_BASE_URL = '/userapi' // → Vite代理 → https://live.88tv.co/appapi/
```

### 生产环境

```javascript
BASE_URL = 'https://jiji1.tv' // → 直接调用
NEW_API_BASE_URL = 'https://live.88tv.co/appapi/' // → 直接调用
```

### 生产环境(通过代理)

```javascript
BASE_URL = 'https://jiji8.cc/api' // → Nginx代理 → https://jiji1.tv/
NEW_API_BASE_URL = 'https://jiji8.cc/userapi' // → Nginx代理 → https://live.88tv.co/appapi/
```

## 🔍 当前问题

1. **Nginx配置问题**: `proxy_set_header Host live.88tv.co/appapi;` 应该是 `live.88tv.co`
2. **API_PREFIX使用**: 某些地方仍在使用 `API_PREFIX` 而不是 `BASE_URL`

## 📊 调试信息

开发环境控制台输出:

```
🌍 API配置信息:
  📺 视频API (jiji1.tv): /api
  👤 用户API (live.88tv.co): /userapi
  🔄 环境: 开发环境
```

## 🚀 建议优化

1. **统一API调用**: 确保所有视频相关接口使用 `BASE_URL`
2. **修复Nginx配置**: 移除Host头中的路径部分
3. **环境感知配置**: 根据部署环境自动选择直连或代理
