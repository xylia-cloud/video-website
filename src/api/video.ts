import axios from 'axios';
import qs from 'qs';
import { API_PREFIX, DEFAULT_PAGE_SIZE, VIDEO_CATEGORIES } from '@/utils/config';

// 定义参数接口
interface VideoParams {
  mid?: number | string;
  limit?: number | string;
  page?: number | string;
  tid?: number | string;
  [key: string]: any; // 添加索引签名，允许任意字符串索引
}

// 定义搜索参数接口
interface SearchParams {
  mid?: number | string; // 模型mid，如1影片、2文章等
  wd?: string;          // 关键词
  limit?: number | string; // 获取数量
  [key: string]: any;   // 允许其他属性
}

// 创建axios实例 - 使用本地代理
const apiClient = axios.create({
  baseURL: API_PREFIX, // 使用配置的API前缀
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Accept': 'application/json, text/plain, */*',
  }
});

// 获取首页推荐视频（不需要TOKEN验证）
export const getRecommendVideos = async (params: VideoParams = {}) => {
  // 必须参数：mid、limit、page、tid
  const defaultParams: VideoParams = {
    mid: 1, // 默认影片类型 1
    limit: DEFAULT_PAGE_SIZE, // 默认每页条数
    page: 1, // 默认第1页
    tid: VIDEO_CATEGORIES.ALL // 默认分类id
  };
  
  // 合并默认参数和传入参数
  const mergedParams = { ...defaultParams, ...params };
  
  // 使用 x-www-form-urlencoded 格式（与 Postman 默认格式一致）
  const data = qs.stringify(mergedParams);
  
  // 通过代理请求
  console.log(`正在通过axios请求代理... 页码: ${mergedParams.page}`);
  const response = await apiClient.post('/index.php/ajax/data.html', data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  console.log('API响应:', response.data);
  return response.data;
};

// 搜索接口方法（使用axios）
export const searchVideos = async (params: SearchParams = {}) => {
  // 必须参数：mid、wd、limit
  const defaultParams: SearchParams = {
    mid: 1,                // 默认搜索影片
    limit: DEFAULT_PAGE_SIZE, // 默认每页条数
    wd: '',                // 搜索关键词，必须由调用者提供
  };
  
  // 合并默认参数和传入参数
  const mergedParams = { ...defaultParams, ...params };
  
  // 验证必须的搜索词
  if (!mergedParams.wd) {
    throw new Error('搜索关键词不能为空');
  }
  
  // 使用 x-www-form-urlencoded 格式
  const data = qs.stringify(mergedParams);
  
  // 通过代理请求
  console.log(`正在搜索: ${mergedParams.wd}`);
  const response = await apiClient.post('/index.php/ajax/suggest', data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  console.log('搜索响应:', response.data);
  return response.data;
};

// 其他可能的API接口（需要TOKEN验证的）
export const getProtectedVideoData = async (endpoint: string, params: VideoParams = {}) => {
  // 使用 x-www-form-urlencoded 格式
  const data = qs.stringify(params);
  
  // 获取token
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 通过代理请求
  const response = await apiClient.post(endpoint, data, { headers });
  
  return response.data;
}; 