// 使用原生 fetch API 实现的请求方法
import { API_PREFIX, DEFAULT_PAGE_SIZE, VIDEO_CATEGORIES } from '@/utils/config';

// 定义参数接口
interface VideoParams {
  mid?: number | string;
  limit?: number | string;
  page?: number | string;
  tid?: number | string;
  [key: string]: any;
}

// 定义搜索参数接口
interface SearchParams {
  mid?: number | string; // 模型mid，如1影片、2文章等
  wd?: string;          // 关键词
  limit?: number | string; // 获取数量
  page?: number | string; // 页码
  [key: string]: any;   // 允许其他属性
}

// 定义注册参数接口
interface RegisterParams {
  user_name: string;    // 用户名
  user_pwd: string;     // 密码
  user_pwd2: string;    // 确认密码
  ac?: string;          // 验证类型：phone或email（改为可选）
  code?: string;        // 验证码（改为可选）
  verify?: string;      // 后台开启注册验证码时必填（改为可选）
  phone?: string;       // 手机号（当ac=phone时必填）
  email?: string;       // 邮箱（当ac=email时必填）
  [key: string]: string | undefined; // 添加索引签名
}

// 类型数据接口
export interface TypeItem {
  type_id: number;
  type_name: string;
}

// 视频详情数据接口
export interface VideoDetail {
  vod_id: number;
  vod_name: string;
  vod_pic: string;
  vod_pic_thumb?: string;
  vod_class?: string;
  vod_duration?: string;
  vod_time?: string;
  vod_time_add?: string;
  vod_play_url?: string;
  vod_pubdate?: string;
  vod_copyright?: string | number;
  vod_points_play?: number | string; // 观看所需积分
  vod_actors?: string;
  vod_director?: string;
  vod_remarks?: string;
  vod_content?: string;
  [key: string]: any;
}

// 定义标签接口返回的数据类型
export interface TagItem {
  tag_id: number;
  tag_name: string;
  tag_img?: string;
}

/**
 * 获取视频详情
 * @param vodId 视频ID
 */
export const fetchVideoDetail = async (vodId: string | number) => {
  if (!vodId) {
    throw new Error('视频ID不能为空');
  }
  
  console.log(`正在获取视频详情，ID: ${vodId}`);
  
  // 获取包含token和时间戳的请求头（视频详情不强制要求登录）
  const headers = createAuthHeaders(false);
  
  // 发起GET请求
  const response = await fetch(`${API_PREFIX}/index.php/ajax/details.html?vod_id=${vodId}`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

/**
 * 获取栏目列表
 */
export const fetchTypesList = async () => {
  console.log('正在获取栏目列表...');
  
  // 获取包含时间戳的请求头（栏目列表不强制要求登录）
  const headers = createAuthHeaders(false);
  
  // 发起GET请求
  const response = await fetch(`${API_PREFIX}/index.php/ajax/types.html`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

/**
 * 原生fetch方法获取推荐视频
 */
export const fetchRecommendVideos = async (params: VideoParams = {}) => {
  // 默认参数
  const defaultParams: VideoParams = {
    mid: 1, // 默认影片类型 1
    limit: DEFAULT_PAGE_SIZE, // 默认每页条数
    page: 1, // 默认第1页
    tid: VIDEO_CATEGORIES.ALL // 默认分类id
  };
  
  // 合并参数
  const mergedParams = { ...defaultParams, ...params };
  
  // 创建 FormData 对象
  const formData = new FormData();
  for (const key in mergedParams) {
    formData.append(key, String(mergedParams[key]));
  }
  
  console.log(`正在通过原生fetch请求代理... 页码: ${mergedParams.page}`);
  
  // 获取包含时间戳的请求头（推荐视频不强制要求登录）
  const headers = createAuthHeaders(false);
  
  // 发起POST请求 - 使用本地代理而不是直接请求外部URL
  const response = await fetch(`${API_PREFIX}/index.php/ajax/data.html`, {
    method: 'POST',
    body: formData,
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

// 搜索接口方法（使用原生fetch）
export const fetchSearchVideos = async (params: SearchParams = {}) => {
  // 默认参数
  const defaultParams: SearchParams = {
    mid: 1,                // 默认搜索影片
    limit: DEFAULT_PAGE_SIZE, // 默认每页条数
    wd: '',                // 搜索关键词
  };
  
  // 合并参数
  const mergedParams = { ...defaultParams, ...params };
  
  // 验证必须的搜索词
  if (!mergedParams.wd) {
    throw new Error('搜索关键词不能为空');
  }
  
  // 创建 FormData 对象
  const formData = new FormData();
  for (const key in mergedParams) {
    formData.append(key, String(mergedParams[key]));
  }
  
  console.log(`正在搜索: ${mergedParams.wd}`);
  
  // 获取包含时间戳的请求头（搜索不强制要求登录）
  const headers = createAuthHeaders(false);
  
  // 发起POST请求
  const response = await fetch(`${API_PREFIX}/index.php/ajax/suggest`, {
    method: 'POST',
    body: formData,
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

/**
 * 用户注册接口
 */
export const registerUser = async (params: RegisterParams) => {
  // 创建 FormData 对象
  const formData = new FormData();
  for (const key in params) {
    if (params[key] !== undefined) {
      formData.append(key, params[key] as string);
    }
  }
  
  console.log('正在发送注册请求...');
  
  // 获取包含时间戳的请求头
  const headers = createAuthHeaders();
  
  // 发起POST请求
  const response = await fetch(`${API_PREFIX}/index.php/user/reg`, {
    method: 'POST',
    body: formData,
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

/**
 * 获取详情页的推荐视频
 * @param params 可选参数对象
 */
export const fetchDetailRecommend = async (params: {[key: string]: any} = {}) => {
  console.log('正在获取详情页推荐视频...');
  
  // 构建查询参数
  const queryParams = new URLSearchParams();
  for (const key in params) {
    queryParams.append(key, String(params[key]));
  }
  
  // 构建URL
  const url = `${API_PREFIX}/index.php/ajax/recommend.html${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  // 获取包含时间戳的请求头
  const headers = createAuthHeaders();
  
  // 发起GET请求
  const response = await fetch(url, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

/**
 * 更新视频播放次数
 * @param params 必需参数：mid(模型ID)和id(视频ID)，可选参数：type(默认为update)
 */
export const updateVideoHits = async (params: {mid: number|string, id: number|string, type?: string}) => {
  if (!params.mid) {
    throw new Error('模型ID(mid)不能为空');
  }
  
  if (!params.id) {
    throw new Error('视频ID(id)不能为空');
  }
  
  console.log(`正在更新视频播放次数，ID: ${params.id}`);
  
  // 创建 FormData 对象
  const formData = new FormData();
  formData.append('mid', String(params.mid));
  formData.append('id', String(params.id));
  
  // 如果有type参数，添加到请求中
  if (params.type) {
    formData.append('type', params.type);
  } else {
    formData.append('type', 'update'); // 默认为update
  }
  
  // 获取包含token和时间戳的请求头
  const headers = createAuthHeaders();
  
  // 发起POST请求
  const response = await fetch(`${API_PREFIX}/index.php/ajax/hits.html`, {
    method: 'POST',
    body: formData,
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

/**
 * 视频点赞功能
 * @param params 必需参数：mid(模型ID)、id(视频ID)和type(固定为up)
 * @returns 点赞结果
 */
export const updateVideoDigg = async (params: {mid: number|string, id: number|string, type: string}) => {
  if (!params.mid) {
    throw new Error('模型ID(mid)不能为空');
  }
  
  if (!params.id) {
    throw new Error('视频ID(id)不能为空');
  }
  
  if (!params.type) {
    throw new Error('操作类型(type)不能为空');
  }
  
  console.log(`正在更新视频点赞状态，ID: ${params.id}, 操作: ${params.type}`);
  
  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再进行点赞操作');
  }
  
  // 创建 FormData 对象
  const formData = new FormData();
  formData.append('mid', String(params.mid));
  formData.append('id', String(params.id));
  formData.append('type', params.type); // 通常是 'up'
  
  // 获取包含token和时间戳的请求头（强制要求认证）
  const headers = createAuthHeaders(true);
  
  // 发起POST请求
  const response = await fetch(`${API_PREFIX}/index.php/ajax/digg.html`, {
    method: 'POST',
    body: formData,
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

/**
 * 用户记录接口 - 用于记录播放历史、收藏等
 * @param params 必需参数：mid(模型ID)、id(内容ID)、type(操作类型)、ac(动作类型set/del)
 * @returns 接口返回结果
 */
export const updateUserLog = async (params: {mid: number|string, id: number|string, type: number|string, ac: string}) => {
  if (!params.mid) {
    throw new Error('模型ID(mid)不能为空');
  }
  
  if (!params.id) {
    throw new Error('内容ID(id)不能为空');
  }
  
  if (!params.type) {
    throw new Error('操作类型(type)不能为空');
  }
  
  if (!params.ac) {
    throw new Error('动作类型(ac)不能为空');
  }
  
  console.log(`正在更新用户记录，ID: ${params.id}, 操作: ${params.type}, 动作: ${params.ac}`);
  
  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再进行收藏或播放记录操作');
  }
  
  // 创建 FormData 对象
  const formData = new FormData();
  formData.append('mid', String(params.mid));
  formData.append('id', String(params.id));
  formData.append('type', String(params.type));
  formData.append('ac', params.ac); // set 或 del
  
  // 获取认证请求头（强制要求认证）
  const headers = createAuthHeaders(true);
  
  // 发起POST请求
  const response = await fetch(`${API_PREFIX}/index.php/user/ulog`, {
    method: 'POST',
    body: formData,
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

/**
 * 获取用户记录列表
 * @param params type: 1=浏览、2=收藏、3=想看、4=播放、5=下载
 */
export const fetchUserLogList = async (params: {type: number|string}) => {
  if (!params.type) {
    throw new Error('记录类型(type)不能为空');
  }
  
  console.log(`正在获取用户记录列表，类型: ${params.type}`);
  
  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再查看个人记录');
  }
  
  // 创建 FormData 对象
  const formData = new FormData();
  formData.append('type', String(params.type));
  formData.append('ac', 'list'); // 添加必要参数，ac=list表示获取列表
  formData.append('mid', '1'); // 添加必要参数，ac=list表示获取列表

  // 获取认证请求头（强制要求认证）
  const headers = createAuthHeaders(true);
  
  // 发起POST请求
  const response = await fetch(`${API_PREFIX}/index.php/user/ulog`, {
    method: 'POST',
    body: formData,
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  return await response.json();
};

// 用户信息存储管理
export interface UserInfo {
  user_id: number;
  user_name: string;
  token: string;
  user_portrait?: string;
  user_points?: number;
  group_id?: number;
  group_name?: string;
  user_nick_name?: string;
  rec_code?: string;
  [key: string]: any; // 添加索引签名
}

// 本地存储的键名
const TOKEN_KEY = 'user_token';
const USER_INFO_KEY = 'user_info';
const TOKEN_EXPIRE_KEY = 'token_expire_time';

// TOKEN过期时间（12小时，以毫秒为单位）
const TOKEN_EXPIRE_DURATION = 12 * 60 * 60 * 1000; // 12小时

// 设置用户信息到本地存储
export const setUserInfo = (userInfo: UserInfo) => {
  const expireTime = Date.now() + TOKEN_EXPIRE_DURATION;
  
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  localStorage.setItem(TOKEN_KEY, userInfo.token);
  localStorage.setItem(TOKEN_EXPIRE_KEY, expireTime.toString());
  
  console.log(`TOKEN已保存，将在${new Date(expireTime).toLocaleString()}过期`);
};

// 从本地存储获取用户信息
export const getUserInfo = (): UserInfo | null => {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY);
  if (!userInfoStr) return null;
  
  try {
    return JSON.parse(userInfoStr) as UserInfo;
  } catch (e) {
    console.error('解析用户信息失败:', e);
    return null;
  }
};

// 从本地存储获取token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// 检查TOKEN是否过期
export const isTokenExpired = (): boolean => {
  const expireTimeStr = localStorage.getItem(TOKEN_EXPIRE_KEY);
  if (!expireTimeStr) {
    return true; // 没有过期时间，认为已过期
  }
  
  const expireTime = parseInt(expireTimeStr);
  const now = Date.now();
  
  if (now >= expireTime) {
    console.log('TOKEN已过期');
    return true;
  }
  
  return false;
};

// 获取TOKEN剩余时间（以分钟为单位）
export const getTokenRemainingTime = (): number => {
  const expireTimeStr = localStorage.getItem(TOKEN_EXPIRE_KEY);
  if (!expireTimeStr) {
    return 0;
  }
  
  const expireTime = parseInt(expireTimeStr);
  const now = Date.now();
  const remainingMs = expireTime - now;
  
  if (remainingMs <= 0) {
    return 0;
  }
  
  return Math.floor(remainingMs / (1000 * 60)); // 转换为分钟
};

// 获取TOKEN过期时间格式化字符串
export const getTokenExpireTimeString = (): string => {
  const expireTimeStr = localStorage.getItem(TOKEN_EXPIRE_KEY);
  if (!expireTimeStr) {
    return '未知';
  }
  
  const expireTime = parseInt(expireTimeStr);
  return new Date(expireTime).toLocaleString();
};

// 清除用户登录信息和所有缓存
export const clearUserInfo = () => {
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRE_KEY);
};

// 清除所有本地缓存数据
export const clearAllCache = () => {
  console.log('清除所有本地缓存...');
  
  // 清除用户信息
  clearUserInfo();
  
  // 清除首页相关缓存
  localStorage.removeItem('lastActiveTabId');
  localStorage.removeItem('inviteCode');
  
  // 清除首页弹窗状态
  sessionStorage.removeItem('homePopupShownThisSession');
  sessionStorage.removeItem('pageSessionActive');
  
  // 清除首页标签状态缓存
  sessionStorage.removeItem('tabStates');
  
  // 清除其他可能的缓存
  sessionStorage.removeItem('homeScrollPosition');
  
  console.log('所有缓存已清除');
};

// 检查是否已登录且TOKEN未过期（非强制性检查）
export const isLoggedIn = (): boolean => {
  const token = getToken();
  if (!token) {
    return false;
  }
  
  if (isTokenExpired()) {
    console.log('TOKEN已过期，但不自动清除缓存（允许继续浏览公开内容）');
    return false;
  }
  
  return true;
};

// 检查登录状态，如果过期则清除缓存（用于需要强制登录的场景）
export const checkLoginRequired = (): boolean => {
  const token = getToken();
  if (!token) {
    console.log('用户未登录，需要登录');
    return false;
  }
  
  if (isTokenExpired()) {
    console.log('TOKEN已过期，清除缓存并要求重新登录');
    clearAllCache();
    return false;
  }
  
  return true;
};

// 强制用户重新登录
export const forceLogin = () => {
  console.log('TOKEN已过期，强制重新登录');
  
  // 获取当前路径
  const currentPath = window.location.hash.replace('#', '');
  
  // 如果当前已经在登录页面或者注册页面，则只清除缓存，不跳转
  if (currentPath === '/login' || currentPath === '/register' || currentPath.startsWith('/login') || currentPath.startsWith('/register')) {
    console.log('当前在登录/注册页面，只清除缓存');
    clearAllCache();
    return;
  }
  
  // 清除所有缓存
  clearAllCache();
  
  // 跳转到登录页面
  const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
  
  // 使用原生跳转到登录页面
  window.location.href = `${window.location.origin}${window.location.pathname}#${loginUrl}`;
};

// 友好地提示用户登录（不强制跳转）
export const promptLogin = (message: string = '此操作需要登录') => {
  console.log('提示用户登录:', message);
  
  if (typeof window !== 'undefined') {
    const shouldLogin = confirm(`${message}，是否前往登录页面？`);
    if (shouldLogin) {
      // 保存当前页面路径，登录后可以返回
      const currentPath = window.location.hash || '#/';
      localStorage.setItem('redirect_after_login', currentPath);
      
      window.location.hash = '#/login';
      return true;
    }
  }
  
  return false;
};

// 创建带有认证信息的请求头
export const createAuthHeaders = (requireAuth: boolean = false): HeadersInit => {
  const token = getToken();
  const reqTime = Date.now().toString(); // 13位毫秒时间戳
  
  const headers: HeadersInit = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'reqTime': reqTime // 所有请求都包含时间戳
  };
  
  // 如果有token且没有过期，添加到请求头
  if (token && !isTokenExpired()) {
    headers['token'] = token;
  } else if (requireAuth) {
    // 只有在明确需要认证的请求中才处理TOKEN过期
    console.log('需要认证的请求检测到TOKEN无效');
    if (isTokenExpired()) {
      console.log('TOKEN已过期，建议用户重新登录');
      // 可以在这里触发登录提示，但不强制跳转
    }
  }
  
  return headers;
};

/**
 * 用户登录接口
 * @param params 必需参数：user_name(用户名)、user_pwd(密码)
 * @returns 登录结果
 */
export const userLogin = async (params: {user_name: string, user_pwd: string}) => {
  if (!params.user_name) {
    throw new Error('用户名不能为空');
  }
  
  if (!params.user_pwd) {
    throw new Error('密码不能为空');
  }
  
  console.log('正在登录...');
  
  // 创建 FormData 对象
  const formData = new FormData();
  formData.append('user_name', params.user_name);
  formData.append('user_pwd', params.user_pwd);
  
  // 获取包含时间戳的请求头（登录时还没有token）
  const headers = createAuthHeaders();
  
  // 发起POST请求
  const response = await fetch(`${API_PREFIX}/index.php/user/login`, {
    method: 'POST',
    body: formData,
    headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  
  const result = await response.json();
  
  // 如果登录成功，保存用户信息和token
  if (result && result.code === 1 && result.data) {
    const userInfo: UserInfo = {
      user_id: result.data.user_id,
      user_name: result.data.user_name,
      token: result.data.token,
      user_portrait: result.data.user_portrait,
      user_points: result.data.user_points,
      group_id: result.data.group_id,
      group_name: result.data.group_name,
      user_nick_name: result.data.user_nick_name,
      rec_code: result.data.rec_code
    };
    
    // 保存到本地存储
    setUserInfo(userInfo);
  }
  
  return result;
};

/**
 * 用户退出登录
 */
export const userLogout = async () => {
  try {
    console.log('正在退出登录...');
    
    // 获取认证请求头（强制要求认证）
    const headers = createAuthHeaders(true);
    
    // 发起POST请求
    const response = await fetch(`${API_PREFIX}/index.php/user/login`, {
      method: 'POST',
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`退出登录失败: ${response.status}`, errorText);
    } else {
      const result = await response.json();
      console.log('退出登录结果:', result);
    }
    
    // 无论接口是否成功，都清除所有缓存
    clearAllCache();
    console.log('用户已退出登录，所有缓存已清除');
    
    return true;
  } catch (error) {
    console.error('退出登录请求错误:', error);
    // 发生错误时也清除所有缓存
    clearAllCache();
    return false;
  }
};

/**
 * 修改用户个人资料接口
 * @param params 用户信息参数
 * @returns 接口返回结果
 * 
 * 注意：即使只修改昵称而不修改密码，也需要传递密码字段（空字符串）
 * - user_nick_name: 用户昵称
 * - user_pwd: 原密码（不修改密码时传空字符串）
 * - user_pwd1: 新密码（不修改密码时传空字符串）
 * - user_pwd2: 确认密码（不修改密码时传空字符串）
 */
export const updateUserInfo = async (params: {
  user_nick_name?: string;
  user_pwd?: string;
  user_pwd1?: string;
  user_pwd2?: string;
  user_qq?: string;
  user_email?: string;
  user_phone?: string;
  [key: string]: string | undefined;
}) => {
  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再修改个人信息');
  }
  
  // 创建 FormData 对象
  const formData = new FormData();
  
  // 添加请求参数
  for (const key in params) {
    if (params[key] !== undefined) {
      formData.append(key, params[key] as string);
    }
  }
  
  console.log('正在更新用户信息...');
  
  // 获取认证请求头（强制要求认证）
  const headers = createAuthHeaders(true);
  
  try {
    // 发起POST请求
    const response = await fetch(`${API_PREFIX}/index.php/user/info`, {
      method: 'POST',
      body: formData,
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`更新用户信息失败: ${response.status}`, errorText);
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
    }
    
    const result = await response.json();
    
    // 如果更新成功且返回了新的用户信息，更新本地存储
    if (result && result.code === 1 && result.data) {
      // 获取当前用户信息
      const currentUserInfo = getUserInfo();
      
      if (currentUserInfo) {
        // 合并新的用户信息
        const updatedUserInfo = {
          ...currentUserInfo,
          user_nick_name: result.data.user_nick_name || currentUserInfo.user_nick_name,
          // 更新其他可能变化的字段
        };
        
        // 保存到本地存储
        setUserInfo(updatedUserInfo);
      }
    }
    
    return result;
  } catch (error) {
    console.error('更新用户信息请求错误:', error);
    throw error;
  }
};

/**
 * 修改用户头像接口
 * @param params 头像参数，支持file文件对象或imgdata base64编码
 * @returns 接口返回结果
 */
export const updateUserPortrait = async (params: {
  file?: File;
  imgdata?: string;
}) => {
  if (!params.file && !params.imgdata) {
    throw new Error('文件对象或base64编码数据不能为空');
  }

  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再修改头像');
  }

  console.log('正在更新用户头像...');
  
  // 创建 FormData 对象
  const formData = new FormData();
  
  // 添加请求参数 - 确保表单名称正确
  if (params.file) {
    // 使用正确的表单名称 "file"
    formData.append('file', params.file);
    console.log('使用文件上传模式');
  } else if (params.imgdata) {
    // 使用正确的表单名称 "imgdata"
    formData.append('imgdata', params.imgdata);
    console.log('使用base64上传模式');
  }
  
  // 获取认证请求头（强制要求认证）- 移除Content-Type以便让浏览器自动设置带boundary的值
  const headers = createAuthHeaders(true);
  
  try {
    // 发起POST请求
    const response = await fetch(`${API_PREFIX}/index.php/user/portrait`, {
      method: 'POST',
      body: formData,
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`更新用户头像失败: ${response.status}`, errorText);
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('头像上传响应:', result);
    
    // 如果更新成功且返回了新的头像路径，更新本地存储的用户信息
    if (result && result.code === 1 && result.file) {
      // 获取当前用户信息
      const currentUserInfo = getUserInfo();
      
      if (currentUserInfo) {
        // 更新头像路径
        const updatedUserInfo = {
          ...currentUserInfo,
          user_portrait: result.file
        };
        
        // 保存到本地存储
        setUserInfo(updatedUserInfo);
      }
    }
    
    return result;
  } catch (error) {
    console.error('更新用户头像请求错误:', error);
    throw error;
  }
};

/**
 * 获取广告接口
 * @param params 广告位置和类型参数
 * @returns 广告数据
 */
export const fetchAds = async (params: {
  ad_pos: number | string;  // 位置 1:首页; 3:列表页; 4:详情页/搜索页
  ad_type?: number | string; // 广告类型 1:轮播图; 2:单图
}) => {
  if (!params.ad_pos) {
    throw new Error('广告位置(ad_pos)不能为空');
  }
  
  console.log(`正在获取广告数据，位置: ${params.ad_pos}, 类型: ${params.ad_type || '所有类型'}`);
  
  // 构建查询参数
  const queryParams = new URLSearchParams();
  queryParams.append('ad_pos', String(params.ad_pos));
  
  if (params.ad_type) {
    queryParams.append('ad_type', String(params.ad_type));
  }
  
  // 获取包含时间戳的请求头（广告不强制要求登录）
  const headers = createAuthHeaders(false);
  
  try {
    // 发起GET请求
    const response = await fetch(`${API_PREFIX}/index.php/ajax/ads.html?${queryParams.toString()}`, {
      method: 'GET',
      headers
    });
    
    const responseText = await response.text();
    console.log('广告API原始响应:', responseText);
    
    if (!response.ok) {
      console.error(`获取广告数据失败: ${response.status}`, responseText);
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${responseText}`);
    }
    
    // 尝试解析JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('广告API返回的JSON解析失败:', e);
      throw new Error('广告API返回的数据格式不正确');
    }
    
    console.log('获取广告数据结果:', result);
    
    // 处理不同的返回格式
    if (result.list) {
      // 如果API直接返回列表格式
      return {
        code: 1,
        data: result.list
      };
    }
    
    return result;
  } catch (error) {
    console.error('获取广告数据请求错误:', error);
    throw error;
  }
};

// 获取标签列表
export const fetchTags = async () => {
  console.log('获取标签列表');
  
  // 获取包含时间戳的请求头（标签列表不强制要求登录）
  const headers = createAuthHeaders(false);
  
  try {
    // 发起GET请求
    const response = await fetch(`${API_PREFIX}/index.php/ajax/tags.html`, {
      method: 'GET',
      headers
    });
    
    const responseText = await response.text();
    console.log('标签API原始响应:', responseText);
    
    if (!response.ok) {
      console.error(`获取标签列表失败: ${response.status}`, responseText);
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${responseText}`);
    }
    
    // 尝试解析JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('标签API返回的JSON解析失败:', e);
      throw new Error('标签API返回的数据格式不正确');
    }
    
    console.log('获取标签列表结果:', result);
    
    // 如果返回的数据中有data字段，则使用data字段的值
    if (result.data) {
      return result;
    }
    
    return result;
  } catch (error) {
    console.error('获取标签列表请求错误:', error);
    throw error;
  }
};

// 获取积分明细
export const fetchPointsDetails = async (params: {
  limit?: number | string;
  page?: number | string;
}) => {
  console.log('获取积分明细');
  
  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再查看积分明细');
  }
  
  // 获取包含时间戳的请求头（强制要求认证）
  const headers = createAuthHeaders(true);
  
  // 默认参数
  const defaultParams = {
    limit: 20,
    page: 1,
    ...params
  };
  
  // 构建查询字符串
  const queryParams = new URLSearchParams();
  Object.entries(defaultParams).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });
  
  try {
    // 发起GET请求
    const response = await fetch(`${API_PREFIX}/index.php/user/points.html?${queryParams.toString()}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取积分明细请求错误:', error);
    throw error;
  }
};

// 获取用户观看数据
export const fetchUserDatas = async (params: {
  vod_id?: number | string;
}) => {
  console.log('获取用户观看数据');
  
  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再查看观看数据');
  }
  
  // 获取包含时间戳的请求头（强制要求认证）
  const headers = createAuthHeaders(true);
  
  try {
    // 创建 FormData 对象
    const formData = new FormData();
    
    // 如果提供了vod_id，添加到请求中
    if (params.vod_id) {
      formData.append('vod_id', String(params.vod_id));
    }
    
    // 发起POST请求
    const response = await fetch(`${API_PREFIX}/index.php/user/datas.html`, {
      method: 'POST',
      body: formData,
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
    }
    
    // 获取响应文本
    const responseText = await response.text();
    
    // 检查响应是否为 'success' 字符串
    if (responseText.trim() === 'success') {
      return { code: 1, msg: 'success' };
    }
    
    // 尝试解析JSON
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error('解析响应JSON失败:', e, '原始响应:', responseText);
      // 如果无法解析JSON但响应包含success，返回一个成功对象
      if (responseText.includes('success')) {
        return { code: 1, msg: 'success' };
      }
      throw new Error('API返回的数据格式不正确: ' + responseText);
    }
  } catch (error) {
    console.error('获取用户观看数据请求错误:', error);
    throw error;
  }
}; 