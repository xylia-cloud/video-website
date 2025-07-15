import axios from 'axios';
import { API_PREFIX } from './config';
import { isTokenExpired, forceLogin, getToken } from '@/api/fetch-api';

// 创建 axios 实例
const request = axios.create({
  baseURL: API_PREFIX, // 使用配置的API前缀
  timeout: 10000
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 获取存储的 token
    const token = getToken();
    
    // 如果有有效的token，添加到请求头
    if (token && !isTokenExpired()) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['token'] = token; // 同时添加token字段
    }
    
    // 注意：不再在请求拦截器中强制检查TOKEN过期
    // 这样允许用户在TOKEN过期的情况下继续浏览公开内容
    
    // 如果是 POST 请求且数据是 FormData 类型，不需要设置 Content-Type
    // axios 会自动设置正确的 Content-Type: multipart/form-data
    if (config.method === 'post' && config.data instanceof FormData) {
      // 由 axios 自动设置
    } 
    
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 直接返回数据
    return response.data;
  },
  error => {
    console.error('响应错误:', error);

    // 错误详情
    if (error.response) {
      // 服务器返回了错误状态码
      console.error(`服务器返回错误: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      // 请求发送成功，但没有收到响应
      console.error('没有收到服务器响应:', error.request);
    } else {
      // 请求配置出错
      console.error('请求配置有误:', error.message);
    }

    // 处理token过期情况
    if (error.response && error.response.status === 401) {
      console.log('服务器返回401，TOKEN可能已过期');
      forceLogin();
    }
    
    return Promise.reject(error);
  }
);

export default request; 