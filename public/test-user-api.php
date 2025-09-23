<?php
/**
 * 测试用户API的直接访问
 */

// 测试直接访问 live.88tv.co
echo "<h1>测试用户API访问</h1>";

// 测试1: 直接访问根路径
echo "<h2>测试1: 直接访问 live.88tv.co</h2>";
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://live.88tv.co/',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "<p>HTTP状态码: $httpCode</p>";
if ($error) {
    echo "<p>错误: $error</p>";
}
echo "<p>响应内容前500字符:</p>";
echo "<pre>" . htmlspecialchars(substr($response, 0, 500)) . "</pre>";

echo "<hr>";

// 测试2: 访问 appapi 路径
echo "<h2>测试2: 访问 live.88tv.co/appapi/</h2>";
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://live.88tv.co/appapi/',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "<p>HTTP状态码: $httpCode</p>";
if ($error) {
    echo "<p>错误: $error</p>";
}
echo "<p>响应内容前500字符:</p>";
echo "<pre>" . htmlspecialchars(substr($response, 0, 500)) . "</pre>";

echo "<hr>";

// 测试3: 通过代理访问
echo "<h2>测试3: 通过代理访问</h2>";
$proxyUrl = '/proxy.php?target=user&path=/appapi/';
echo "<p>代理URL: <a href='$proxyUrl'>$proxyUrl</a></p>";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $proxyUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "<p>HTTP状态码: $httpCode</p>";
if ($error) {
    echo "<p>错误: $error</p>";
}
echo "<p>响应内容:</p>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

echo "<hr>";

// 测试4: 测试具体的API调用
echo "<h2>测试4: 测试具体API调用 (home.getNotice)</h2>";
$testUrl = '/proxy.php?target=user&path=/appapi/&service=home.getNotice';
echo "<p>测试URL: <a href='$testUrl'>$testUrl</a></p>";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $testUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "<p>HTTP状态码: $httpCode</p>";
if ($error) {
    echo "<p>错误: $error</p>";
}
echo "<p>响应内容:</p>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";
?>
