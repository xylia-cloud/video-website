/**
 * 全局配置文件
 * 集中管理应用的配置项，便于维护和环境切换
 */

// API基础URL
export const BASE_URL = 'http://jmlapp.vip';

// API代理前缀
export const API_PREFIX = '/api';

// 分页配置
export const DEFAULT_PAGE_SIZE = 10;

// 视频分类ID
export const VIDEO_CATEGORIES = {
  ALL: 1,   // 全部
  CHINESE: 4,  // 中文
  HONGKONG_TAIWAN: 5,  // 港台
  JAPAN_KOREA: 6,  // 日韩
  EUROPE_AMERICA: 7,  // 欧美
  DOMESTIC: 8    // 国产
};

// 其他配置
export const APP_CONFIG = {
  name: '影视网站',
  version: '1.0.0',
  copyright: `© ${new Date().getFullYear()} 影视网站. All Rights Reserved.`
}; 