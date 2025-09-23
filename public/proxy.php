<?php
/**
 * PHP反向代理 - 简化稳定版本
 * 用于代理前端API请求，解决CORS和部署访问问题
 */

// 允许跨域
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 目标服务器配置
$targets = [
    'video' => 'https://jiji1.tv',
    'user' => 'https://live.88tv.co'
];

// 获取参数
$target = $_GET['target'] ?? '';
$path = $_GET['path'] ?? '';

// 验证参数
if (!isset($targets[$target])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid target', 'valid_targets' => array_keys($targets)]);
    exit();
}

if (empty($path)) {
    http_response_code(400);
    echo json_encode(['error' => 'Path parameter is required']);
    exit();
}

// 构建目标URL
$targetUrl = $targets[$target] . $path;

// 获取请求参数（除了target和path）
$queryParams = $_GET;
unset($queryParams['target'], $queryParams['path']);

if (!empty($queryParams)) {
    $targetUrl .= '?' . http_build_query($queryParams);
}

// 记录目标URL用于调试
error_log("Proxy target URL: " . $targetUrl);

// 初始化cURL
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
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
]);

// 处理不同的HTTP方法
$method = $_SERVER['REQUEST_METHOD'];
$headers = ['Content-Type: application/x-www-form-urlencoded'];

switch ($method) {
    case 'POST':
        curl_setopt($ch, CURLOPT_POST, true);
        
        // 获取POST数据
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (strpos($contentType, 'application/json') !== false) {
            // JSON数据
            $postData = file_get_contents('php://input');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            $headers = ['Content-Type: application/json'];
        } else {
            // 表单数据
            $postData = http_build_query($_POST);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            $headers = ['Content-Type: application/x-www-form-urlencoded'];
        }
        break;
        
    case 'PUT':
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        $putData = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $putData);
        $headers = ['Content-Type: application/json'];
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

// 处理错误
if ($response === false || !empty($error)) {
    http_response_code(500);
    $errorResponse = [
        'error' => 'Proxy request failed',
        'curl_error' => $error,
        'target_url' => $targetUrl,
        'http_code' => $httpCode
    ];
    
    // 记录详细错误信息
    error_log("Proxy error: " . json_encode($errorResponse));
    
    echo json_encode($errorResponse);
    exit();
}

// 检查返回内容是否为HTML错误页面
if (strpos($response, '<!DOCTYPE') === 0 || strpos($response, '<html') !== false) {
    // 返回的是HTML页面，可能是错误页面
    http_response_code(502);
    echo json_encode([
        'error' => 'Target server returned HTML instead of JSON',
        'target_url' => $targetUrl,
        'http_code' => $httpCode,
        'preview' => substr($response, 0, 200) . '...'
    ]);
    
    // 记录HTML错误
    error_log("HTML response from target: " . substr($response, 0, 500));
    exit();
}

// 设置响应头
http_response_code($httpCode);

if ($contentType) {
    header('Content-Type: ' . $contentType);
}

// 输出响应
echo $response;

// 记录日志（可选，用于调试）
if (function_exists('error_log') && isset($_GET['debug'])) {
    $logMessage = sprintf(
        "[%s] %s %s -> %s (HTTP %d)\n",
        date('Y-m-d H:i:s'),
        $method,
        $_SERVER['REQUEST_URI'],
        $targetUrl,
        $httpCode
    );
    error_log($logMessage, 3, 'proxy.log');
}
?>