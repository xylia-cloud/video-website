# 🔧 Nginx配置修复建议

## ⚠️ 发现的问题

在您的Nginx配置中发现一个问题：

```nginx
location /userapi/ {
    proxy_pass https://live.88tv.co/appapi/;
    proxy_set_header Host live.88tv.co/appapi;  # ❌ 错误：Host不应包含路径
    # ... 其他配置
}
```

## ✅ 修复方案

将 `/userapi/` 代理配置修改为：

```nginx
location /userapi/ {
    proxy_pass https://live.88tv.co/appapi/;
    proxy_set_header Host live.88tv.co;  # ✅ 修复：只包含域名
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 📋 完整的推荐配置

```nginx
server {
    listen 80 ;
    listen 443 ssl ;
    server_name jiji8.cc;

    # SSL配置 (保持不变)
    # ...

    # API代理 - jiji1.tv
    location /api/ {
        proxy_pass https://jiji1.tv/;
        proxy_set_header Host jiji1.tv;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 可选：添加超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 用户API代理 - live.88tv.co
    location /userapi/ {
        proxy_pass https://live.88tv.co/appapi/;
        proxy_set_header Host live.88tv.co;  # 🔧 修复：移除路径
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 可选：添加超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 其他配置保持不变
    # ...
}
```

## 🌐 前端配置说明

现在前端已配置为：

### 开发环境

```javascript
BASE_URL = '/api' // → Vite代理 → https://jiji1.tv/
NEW_API_BASE_URL = '/userapi' // → Vite代理 → https://live.88tv.co/appapi/
```

### 生产环境 (jiji8.cc)

```javascript
BASE_URL = 'https://jiji8.cc/api' // → Nginx代理 → https://jiji1.tv/
NEW_API_BASE_URL = 'https://jiji8.cc/userapi' // → Nginx代理 → https://live.88tv.co/appapi/
```

## 🔍 测试方法

修复配置后，可以通过以下方式测试：

```bash
# 测试主API
curl -H "Host: jiji8.cc" https://jiji8.cc/api/index.php/ajax/tags.html

# 测试用户API
curl -H "Host: jiji8.cc" https://jiji8.cc/userapi/
```

## 🎯 优势

1. **本地开发**：使用Vite代理，自动转发到对应API
2. **生产环境**：使用Nginx代理，统一域名访问
3. **自动适配**：代码无需修改，部署到任何域名都能自动工作
4. **调试友好**：开发环境输出详细配置信息

## 🚨 重要提醒

- 修改Nginx配置后需要重启服务：`nginx -s reload`
- 确保两个目标API站点 `https://jiji1.tv/` 和 `https://live.88tv.co/appapi/` 都正常可访问
- 如果仍有502错误，检查目标服务器的状态和网络连接
