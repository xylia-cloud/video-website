# PHP反向代理部署说明

## 概述

创建了PHP反向代理来替代NGINX配置，解决API访问问题。PHP代理更容易部署和配置，特别适合共享主机环境。

## 文件结构

```
public/
├── proxy.php          # PHP反向代理文件
└── index.html         # 前端应用入口

src/utils/
└── config.ts          # 更新的配置文件
```

## 工作原理

### 1. PHP代理 (`public/proxy.php`)

- **视频API代理**: `/proxy.php?target=video&path=/api/xxx` → `https://jiji1.tv/api/xxx`
- **用户API代理**: `/proxy.php?target=user&path=/appapi/xxx` → `https://live.88tv.co/appapi/xxx`

### 2. 前端配置 (`src/utils/config.ts`)

生产环境自动使用PHP代理：

- 视频API: `/proxy.php?target=video&path=`
- 用户API: `/proxy.php?target=user&path=`

## 部署步骤

### 1. 上传文件

将整个 `dist/` 目录上传到Web服务器根目录

### 2. 确保PHP支持

确保服务器支持PHP 7.0+，并启用了cURL扩展

### 3. 设置权限

```bash
chmod 644 proxy.php
chmod 755 .
```

### 4. 测试代理

访问以下URL测试代理是否正常：

```
https://your-domain.com/proxy.php?target=video&path=/api/home
```

## 环境变量配置

可以通过环境变量控制代理行为：

### .env.production (可选)

```env
# 是否使用PHP代理
VITE_USE_PHP_PROXY=true

# 自定义API地址 (当USE_PHP_PROXY=false时使用)
# VITE_API_BASE_URL=https://your-api.com
```

### 禁用PHP代理

如果要禁用PHP代理，直接访问原始API：

```env
VITE_USE_PHP_PROXY=false
```

## 优势

1. **简单部署**: 无需配置NGINX，只需PHP环境
2. **自动CORS**: 内置跨域处理
3. **错误处理**: 完善的错误处理和日志
4. **兼容性**: 支持各种HTTP方法和数据类型
5. **灵活切换**: 可通过环境变量控制是否使用代理

## 日志调试

### 启用日志

PHP代理会在同目录生成 `proxy.log` 文件，记录所有请求：

```
[2024-01-01 12:00:00] GET /proxy.php?target=video&path=/api/home -> https://jiji1.tv/api/home (HTTP 200)
```

### 前端调试

打开浏览器控制台查看配置信息：

```
🌍 API配置信息:
  📺 视频API (jiji1.tv): /proxy.php?target=video&path=
  👤 用户API (live.88tv.co): /proxy.php?target=user&path=
```

## 故障排除

### 1. 代理无法访问

- 检查PHP是否正常运行
- 确认cURL扩展已启用
- 查看 `proxy.log` 了解具体错误

### 2. API返回错误

- 确认目标服务器可访问
- 检查参数格式是否正确
- 查看浏览器网络面板

### 3. CORS问题

PHP代理已处理CORS，如果仍有问题：

- 确认 `proxy.php` 文件完整
- 检查服务器是否拦截某些请求头

## 性能优化

### 1. 启用PHP缓存

```php
// 在proxy.php开头添加
if (function_exists('opcache_compile_file')) {
    opcache_compile_file(__FILE__);
}
```

### 2. 设置超时

根据需要调整 `CURLOPT_TIMEOUT` 值

### 3. 启用压缩

服务器启用gzip压缩可提高传输效率

## 安全注意事项

1. **限制目标**: 代理只允许访问预定义的目标服务器
2. **参数验证**: 对所有输入参数进行验证
3. **日志安全**: 确保日志文件不被外部访问
4. **定期更新**: 保持PHP版本更新

## 联系支持

如果遇到问题，请提供：

1. 错误信息截图
2. `proxy.log` 相关日志
3. 浏览器控制台输出
4. 服务器PHP版本信息
