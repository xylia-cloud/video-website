<?php
/**
 * 完美PHP代理方案 - 统一处理所有API接口
 * 支持视频API(jiji1.tv)和用户API(live.88tv.co)
 * 无需NGINX配置，纯PHP解决方案
 */

// 设置错误报告
error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 0);

// 允许跨域
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Accept-Language, Connection, User-Agent');
header('Access-Control-Allow-Credentials: true');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==================== 智能路由系统 ====================

/**
 * 智能检测API类型并自动路由
 * 兼容NGINX直接访问模式和错误URL格式
 */
function detectApiType() {
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    $requestPath = parse_url($requestUri, PHP_URL_PATH);
    $queryString = $_SERVER['QUERY_STRING'] ?? '';
    
    // 日志记录
    error_log("Proxy Request: " . $requestUri);
    
    // 预处理：修复错误的URL格式 target=user/?service=xxx
    if (strpos($requestUri, 'target=user/?') !== false) {
        // 重新解析URL，修复格式
        $fixedUri = str_replace('target=user/?', 'target=user&', $requestUri);
        parse_str(parse_url($fixedUri, PHP_URL_QUERY), $fixedParams);
        $_GET = $fixedParams;
        
        error_log("Fixed malformed URL: $requestUri -> $fixedUri");
    }
    
    // 1. 检查是否是传统代理格式 (?target=xxx)
    if (isset($_GET['target'])) {
        $target = $_GET['target'];
        
        // 进一步清理target值
        $target = trim($target, '/?');
        
        return [
            'type' => $target,
            'path' => $_GET['path'] ?? '',
            'params' => array_diff_key($_GET, array_flip(['target', 'path']))
        ];
    }
    
    // 2. 特殊处理：如果是proxy.php直接访问但有apipath参数
    if (isset($_GET['apipath']) && strpos($requestPath, '/proxy.php') !== false) {
        $apiPath = $_GET['apipath'];
        $params = array_diff_key($_GET, array_flip(['apipath']));
        
        if (strpos($apiPath, '/index.php/') === 0) {
            return [
                'type' => 'video',
                'path' => $apiPath,
                'params' => $params
            ];
        }
    }
    
    // 3. 检查是否是/api/路径 (视频API)
    if (strpos($requestPath, '/api/') === 0) {
        $apiPath = substr($requestPath, 4); // 去掉/api前缀
        parse_str($queryString, $params);
        return [
            'type' => 'video',
            'path' => $apiPath,
            'params' => $params
        ];
    }
    
    // 4. 检查是否是/userapi/路径 (用户API)
    if (strpos($requestPath, '/userapi/') === 0) {
        parse_str($queryString, $params);
        return [
            'type' => 'user',
            'path' => '',
            'params' => $params
        ];
    }
    
    // 5. 检查是否包含service参数 (用户API)
    if (isset($_GET['service']) || strpos($queryString, 'service=') !== false) {
        return [
            'type' => 'user',
            'path' => '',
            'params' => $_GET
        ];
    }
    
    // 6. 检查特定路径模式
    if (strpos($requestPath, '/index.php/') !== false) {
        return [
            'type' => 'video',
            'path' => $requestPath,
            'params' => $_GET
        ];
    }
    
    // 默认返回错误
    return null;
}

/**
 * 构建目标URL
 */
function buildTargetUrl($apiInfo) {
    $targets = [
        'video' => 'https://jiji1.tv',
        'user' => 'https://live.88tv.co/appapi/'
    ];
    
    if (!isset($targets[$apiInfo['type']])) {
        return null;
    }
    
    $baseUrl = $targets[$apiInfo['type']];
    
    if ($apiInfo['type'] === 'user') {
        // 用户API: 直接拼接查询参数
        if (!empty($apiInfo['params'])) {
            return $baseUrl . '?' . http_build_query($apiInfo['params']);
        }
        return $baseUrl;
    } else {
        // 视频API: 拼接路径和参数
        $url = $baseUrl . $apiInfo['path'];
        if (!empty($apiInfo['params'])) {
            $url .= '?' . http_build_query($apiInfo['params']);
        }
        return $url;
    }
}

/**
 * 获取请求头
 */
function getRequestHeaders($apiType) {
    if ($apiType === 'user') {
        // 用户API请求头
        return [
            'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            'Accept: application/json, text/plain, */*',
            'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8',
            'Connection: keep-alive',
        ];
    } else {
        // 视频API请求头
        return [
            'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            'Accept: */*',
            'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8',
            'Connection: keep-alive',
            'Origin: https://jiji1.tv',
            'Referer: https://jiji1.tv/',
        ];
    }
}

// ==================== 调试功能 ====================

if (isset($_GET['debug']) && $_GET['debug'] === 'test') {
    echo "<h1>🚀 完美PHP代理 - 调试测试</h1>";
    echo "<style>body{font-family:Arial;margin:20px;} .test-btn{background:#007cba;color:white;padding:10px 15px;border:none;border-radius:5px;margin:5px;cursor:pointer;} .result{background:#f5f5f5;padding:15px;margin:10px 0;border-radius:5px;}</style>";
    
    echo "<h2>📊 当前配置</h2>";
    echo "<p>请求URI: " . htmlspecialchars($_SERVER['REQUEST_URI'] ?? '') . "</p>";
    echo "<p>请求方法: " . ($_SERVER['REQUEST_METHOD'] ?? '') . "</p>";
    
    $apiInfo = detectApiType();
    if ($apiInfo) {
        echo "<p>检测到API类型: <strong>" . $apiInfo['type'] . "</strong></p>";
        echo "<p>路径: <strong>" . $apiInfo['path'] . "</strong></p>";
        echo "<p>参数: <strong>" . json_encode($apiInfo['params']) . "</strong></p>";
        $targetUrl = buildTargetUrl($apiInfo);
        echo "<p>目标URL: <strong>" . $targetUrl . "</strong></p>";
    }
    
    $baseUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'];
    
    echo "<h2>🎥 视频API测试</h2>";
    echo "<a href='{$baseUrl}/api/index.php/ajax/data.html' class='test-btn'>测试视频数据接口</a>";
    echo "<a href='{$baseUrl}/api/index.php/user/datas.html' class='test-btn'>测试用户数据接口</a>";
    echo "<a href='{$baseUrl}/api/index.php/user/ulog' class='test-btn'>测试用户记录接口</a>";
    
    echo "<h2>👤 用户API测试</h2>";
    echo "<a href='{$baseUrl}/userapi/?service=home.getNotice' class='test-btn'>测试公告接口</a>";
    echo "<a href='{$baseUrl}/proxy.php?service=home.getNotice' class='test-btn'>测试智能路由</a>";
    echo "<a href='{$baseUrl}/proxy.php?target=user&service=home.getNotice' class='test-btn'>测试传统代理</a>";
    
    echo "<h2>🧪 实时测试</h2>";
    echo "<button class='test-btn' onclick='runTests()'>运行所有测试</button>";
    echo "<div id='results' class='result'></div>";
    
    echo "<script>
    async function runTests() {
        const results = document.getElementById('results');
        results.innerHTML = '<h3>测试进行中...</h3>';
        
        const tests = [
            {name: '视频数据API', url: '/api/index.php/ajax/data.html'},
            {name: '用户数据API', url: '/api/index.php/user/datas.html'},
            {name: '公告API', url: '/userapi/?service=home.getNotice'},
            {name: '智能路由', url: '/proxy.php?service=home.getNotice'}
        ];
        
        for (let test of tests) {
            try {
                const response = await fetch(test.url);
                const status = response.status;
                const text = await response.text();
                
                results.innerHTML += `
                    <div style='border-left:4px solid \${status === 200 ? '#4CAF50' : '#f44336'};padding:10px;margin:10px 0;'>
                        <strong>\${test.name}</strong><br>
                        状态: \${status}<br>
                        响应长度: \${text.length} 字符<br>
                        预览: \${text.substring(0, 100)}...
                    </div>
                `;
            } catch (error) {
                results.innerHTML += `
                    <div style='border-left:4px solid #f44336;padding:10px;margin:10px 0;'>
                        <strong>\${test.name}</strong><br>
                        错误: \${error.message}
                    </div>
                `;
            }
        }
    }
    </script>";
    
    exit();
}

// ==================== 主要代理逻辑 ====================

// 检测API类型
$apiInfo = detectApiType();

if (!$apiInfo) {
    http_response_code(400);
    
    // 调试信息：显示当前GET参数
    $debugInfo = [
        'original_uri' => $_SERVER['REQUEST_URI'] ?? '',
        'current_get_params' => $_GET,
        'query_string' => $_SERVER['QUERY_STRING'] ?? ''
    ];
    
    echo json_encode([
        'error' => 'Unable to detect API type',
        'debug' => $debugInfo,
        'supported_formats' => [
            '/api/* (视频API)',
            '/userapi/* (用户API)',
            '?service=xxx (用户API)',
            '?target=video&path=xxx (传统代理)',
            '?target=user&service=xxx (传统代理)'
        ]
    ]);
    exit();
}

// 构建目标URL
$targetUrl = buildTargetUrl($apiInfo);

if (!$targetUrl) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid API type',
        'detected_type' => $apiInfo['type'],
        'valid_types' => ['video', 'user']
    ]);
    exit();
}

// 记录请求
error_log("Proxy: {$apiInfo['type']} API -> $targetUrl");

// ==================== cURL请求处理 ====================

$ch = curl_init();

// 基本配置
curl_setopt_array($ch, [
    CURLOPT_URL => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
]);

// 设置请求头
$headers = getRequestHeaders($apiInfo['type']);
$method = $_SERVER['REQUEST_METHOD'];

// 处理不同的HTTP方法
switch ($method) {
    case 'POST':
        curl_setopt($ch, CURLOPT_POST, true);
        
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (strpos($contentType, 'application/json') !== false) {
            // JSON数据
            $postData = file_get_contents('php://input');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            $headers[] = 'Content-Type: application/json';
        } elseif (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
            // 表单数据
            $postData = file_get_contents('php://input');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        } elseif (strpos($contentType, 'multipart/form-data') !== false) {
            // 文件上传
            $postFields = $_POST;
            if (!empty($_FILES)) {
                foreach ($_FILES as $key => $file) {
                    if ($file['error'] === UPLOAD_ERR_OK) {
                        $postFields[$key] = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
                    }
                }
            }
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        } else {
            // 默认处理POST数据
            $postData = file_get_contents('php://input');
            if (empty($postData) && !empty($_POST)) {
                $postData = http_build_query($_POST);
                $headers[] = 'Content-Type: application/x-www-form-urlencoded';
            }
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        }
        break;
        
    case 'PUT':
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        $putData = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $putData);
        $headers[] = 'Content-Type: application/json';
        break;
        
    case 'DELETE':
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        break;
}

// 设置请求头
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// 执行请求
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);

curl_close($ch);

// ==================== 响应处理 ====================

// 处理错误
if ($response === false || !empty($error)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Proxy request failed',
        'curl_error' => $error,
        'target_url' => $targetUrl,
        'http_code' => $httpCode,
        'api_type' => $apiInfo['type']
    ]);
    error_log("Proxy Error: $error -> $targetUrl");
    exit();
}

// 检查HTML错误页面
if (strpos($response, '<!DOCTYPE') === 0 || strpos($response, '<html') !== false) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Target server returned HTML instead of JSON',
        'target_url' => $targetUrl,
        'http_code' => $httpCode,
        'preview' => substr($response, 0, 200) . '...'
    ]);
    error_log("HTML Error Response: $targetUrl");
    exit();
}

// 设置响应头
http_response_code($httpCode);

if ($contentType) {
    header('Content-Type: ' . $contentType);
}

// 输出响应
echo $response;

// 记录成功日志
error_log("Proxy Success: {$apiInfo['type']} API -> $targetUrl (HTTP $httpCode)");
?>