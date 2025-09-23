# 用户API问题修复说明

## 问题描述

用户API (`live.88tv.co`) 通过PHP代理访问时返回HTML而不是JSON，导致前端解析失败。

## 修复内容

### 1. 修复配置文件 (`src/utils/config.ts`)

**修复前：**

```typescript
return '/proxy.php?target=user&path='
```

**修复后：**

```typescript
return '/proxy.php?target=user&path=/appapi/'
```

### 2. 增强PHP代理 (`public/proxy.php`)

- ✅ 添加详细的错误日志记录
- ✅ 检测HTML响应并返回友好错误信息
- ✅ 记录目标URL用于调试

### 3. 创建测试页面 (`public/test-user-api.php`)

用于直接测试用户API的访问情况。

## 测试步骤

### 1. 上传修复后的文件

将以下文件上传到服务器：

- `public/proxy.php` (更新版本)
- `dist/` 目录 (重新构建后的前端)
- `public/test-user-api.php` (测试页面)

### 2. 访问测试页面

访问：`https://jiji8.xhjc.site/test-user-api.php`

这个页面会测试：

- 直接访问 `live.88tv.co`
- 直接访问 `live.88tv.co/appapi/`
- 通过代理访问
- 测试具体API调用

### 3. 检查服务器日志

查看PHP错误日志，寻找以下信息：

```
Proxy target URL: https://live.88tv.co/appapi/
HTML response from target: ...
```

### 4. 测试前端应用

重新访问前端应用，检查控制台是否还有JSON解析错误。

## 可能的问题和解决方案

### 问题1: live.88tv.co 服务器不可访问

**症状：** 测试页面显示连接超时或DNS错误
**解决方案：**

1. 检查服务器网络连接
2. 尝试从服务器直接ping `live.88tv.co`
3. 检查防火墙设置

### 问题2: live.88tv.co 返回HTML错误页面

**症状：** 返回403、404或其他HTML错误页面
**解决方案：**

1. 检查User-Agent设置
2. 尝试添加Referer头
3. 检查IP是否被封禁

### 问题3: CORS或SSL问题

**症状：** SSL验证失败或跨域错误
**解决方案：**

1. 确认PHP代理中已禁用SSL验证
2. 检查CORS头设置
3. 尝试使用HTTP而不是HTTPS

## 调试命令

### 在服务器上直接测试

```bash
# 测试直接访问
curl -v "https://live.88tv.co/appapi/"

# 测试通过代理访问
curl -v "https://jiji8.xhjc.site/proxy.php?target=user&path=/appapi/"

# 查看PHP错误日志
tail -f /var/log/php_errors.log
```

### PHP代理调试

在proxy.php中临时添加调试输出：

```php
// 在文件开头添加
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 在curl执行后添加
echo "Debug - Target URL: " . $targetUrl . "\n";
echo "Debug - HTTP Code: " . $httpCode . "\n";
echo "Debug - Response: " . substr($response, 0, 200) . "\n";
```

## 预期结果

修复后应该看到：

1. ✅ 用户API代理正常工作
2. ✅ 前端控制台无JSON解析错误
3. ✅ 公告数据正常加载
4. ✅ 用户相关功能正常

## 联系信息

如果问题仍然存在，请提供：

1. 测试页面的完整输出
2. 服务器PHP错误日志
3. 浏览器控制台的完整错误信息
4. 网络面板中失败请求的详细信息
