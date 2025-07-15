<script setup lang="ts">
// 导入视频列表组件
import VideoList from '@/components/VideoList.vue';
import { ref, onMounted, onBeforeUnmount, computed, onActivated } from 'vue';
import { getRecommendVideos } from '@/api/video';
import { fetchRecommendVideos, fetchTypesList, fetchAds, fetchTags } from '@/api/fetch-api';
import type { TypeItem, TagItem } from '@/api/fetch-api';
import { BASE_URL, VIDEO_CATEGORIES, DEFAULT_PAGE_SIZE } from '@/utils/config';
import { useRouter, useRoute } from 'vue-router';
import { showToast, showDialog } from 'vant';
// 导入截图库
import html2canvas from 'html2canvas';
// 导入弹窗图片
import homePopupImageSrc from '@/assets/img/home-popup.jpg';

// 使用路由
const router = useRouter();
const route = useRoute();

// 获取邀请码参数
const inviteCode = computed(() => {
  return route.query.invite as string || '';
});

// 处理邀请码
const handleInviteCode = () => {
  if (inviteCode.value) {
    console.log('检测到邀请码:', inviteCode.value);
    // 保存邀请码到本地存储，以便后续使用
    localStorage.setItem('inviteCode', inviteCode.value);
    
    // 只记录邀请码，不显示弹窗提示
    // 当用户点击注册时，注册页面会自动读取此邀请码
  }
};

// 定义视频数据接口
interface VideoItem {
  id: number;
  coverUrl: string;
  title: string;
  isVip?: boolean;
  isFree?: boolean;
  duration?: string;  // 视频时长
  class?: string;     // 视频分类
  time?: string;      // 发布时间
  points?: string;    // 视频价格
}

// 定义API返回的视频数据接口
interface ApiVideoItem {
  id?: number;
  vod_id?: number;
  vod_pic?: string;
  vod_pic_thumb?: string;
  coverUrl?: string;
  vod_name?: string;
  title?: string;
  vod_class?: string;
  vod_duration?: string;
  vod_time?: string;
  vod_time_add?: string;
  vod_copyright?: string | number;
  vod_pubdate?: string;
  vod_points_play?: number | string;
}

// 定义API响应接口
interface ApiResponse {
  code?: number;
  msg?: string;
  data?: {
    list?: ApiVideoItem[];
    [key: string]: any;
  };
  list?: ApiVideoItem[];
  total?: number;
  page?: number;
  pagecount?: number;
  [key: string]: any;
}

// 轮播图广告数据
interface BannerAd {
  id: number;
  imageUrl: string;
  title: string;
  link?: string;
}

const bannerAds = ref<BannerAd[]>([]);

// 单图广告数据
interface SingleAd {
  id: number;
  imageUrl: string;
  title: string;
  link?: string;
}

const singleAd = ref<SingleAd | null>(null);

// 定义视频数据响应式变量
const videoData = ref<VideoItem[]>([]);
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref<string>('');

// 栏目列表数据
const typesList = ref<TypeItem[]>([]);
const activeTypeId = ref<number>(1); // 默认选中首页

// 记录每个标签页的完整状态
const tabStates = ref<{[key: number]: {
  scrollPosition: number;
  currentPage: number;
  totalPages: number;
  hasMoreVideos: boolean;
  videos: VideoItem[];
  lastUpdateTime: number; // 添加更新时间，用于判断缓存是否过期
}}>({}); 

// 标签数据
interface TagData {
  tag_id: number;
  tag_name: string;
  tag_img: string;
  hasImage?: boolean;
}

const tagsList = ref<TagData[]>([]);
const visibleTags = ref<TagData[]>([]);
const isTagsLoading = ref<boolean>(false);

// 页码信息
const currentPage = ref(1);
const totalPages = ref(1);

// 记录当前滚动位置
const currentScrollPosition = ref(0);

// 无限滚动相关变量
const isLoadingMore = ref(false);
const hasMoreVideos = ref(true);
const isFirstLoad = ref(true); // 标记是否为第一次加载

// 是否使用原生fetch还是axios
const useFetch = true;

// 搜索相关
const searchKeyword = ref('');

// 轮播图当前索引
const currentBannerIndex = ref(0);

// 首页弹窗相关状态
const showHomePopup = ref(false);
const homePopupImage = ref(homePopupImageSrc); // 使用导入的图片
const popupContent = ref<HTMLElement | null>(null);
const hasShownPopupThisSession = ref(false); // 标记本次会话是否已经显示过弹窗

// 计算属性：判断当前是否为第一个标签
const isFirstTabActive = computed(() => {
  const firstTypeId = typesList.value.length > 0 ? typesList.value[0].type_id : 1;
  return activeTypeId.value === firstTypeId;
});

// 处理轮播图切换
const onBannerChange = (index: number) => {
  currentBannerIndex.value = index;
};

// 处理视频数据的函数
const processVideoData = (item: ApiVideoItem): VideoItem => {
  // 处理封面图片URL
  let coverUrl = '';
  if (item.vod_pic) {
    // 如果路径是相对路径，添加BASE_URL
    if (item.vod_pic.startsWith('/')) {
      coverUrl = `${BASE_URL}${item.vod_pic}`;
    } else if (item.vod_pic.startsWith('http')) {
      coverUrl = item.vod_pic;
    } else {
      coverUrl = item.coverUrl || '';
    }
  } else {
    coverUrl = item.coverUrl || '';
  }
  
  // 判断是否付费内容
  const pointsPlay = item.vod_points_play !== undefined ? Number(item.vod_points_play) : 0;
  const isVip = pointsPlay > 0;
  const isFree = !isVip;
  
  return {
    id: item.id || item.vod_id || 0,
    coverUrl: coverUrl,
    title: item.vod_name || item.title || '',
    isVip: isVip,
    isFree: isFree,
    duration: item.vod_duration || '',
    class: item.vod_class || '',
    time: item.vod_pubdate || item.vod_time || item.vod_time_add || '',
    points: isVip ? pointsPlay + '积分' : ''
  };
};

// 获取栏目列表数据
const fetchTypesData = async () => {
  try {
    const result = await fetchTypesList();
    console.log('栏目列表数据:', result);
    
    if (result.code === 1 && result.data && Array.isArray(result.data)) {
      typesList.value = result.data;
    } else {
      console.error('获取栏目列表失败:', result.msg || '未知错误');
    }
  } catch (error: any) {
    console.error('获取栏目列表请求失败:', error);
  }
};

// 切换栏目
const switchType = (typeId: number) => {
  if (activeTypeId.value === typeId) return;
  
  // 保存当前标签的状态
  saveCurrentTabState();
  
  // 移除之前的滚动监听（无论是哪个标签）
  removeScrollListener();
  
  activeTypeId.value = typeId;
  
  // 保存当前选中的标签ID到localStorage
  localStorage.setItem('lastActiveTabId', typeId.toString());
  
  // 恢复这个标签的状态，如果有有效缓存的话
  const targetTabState = tabStates.value[typeId];
  if (targetTabState && targetTabState.videos.length > 0 && isCacheValid(targetTabState.lastUpdateTime)) {
    console.log(`恢复标签${typeId}的有效缓存状态`);
    
    currentPage.value = targetTabState.currentPage;
    totalPages.value = targetTabState.totalPages;
    hasMoreVideos.value = targetTabState.hasMoreVideos;
    videoData.value = [...targetTabState.videos]; // 创建副本
    isFirstLoad.value = false; // 重要：标记为非首次加载
    
    // 延迟恢复滚动位置，确保DOM已经更新
    setTimeout(() => {
      window.scrollTo(0, targetTabState.scrollPosition);
    }, 100);
    
    console.log(`缓存状态恢复完成: 页码=${currentPage.value}, 总页数=${totalPages.value}, 数据长度=${videoData.value.length}, 滚动位置=${targetTabState.scrollPosition}`);
  } else {
    // 重置状态
    currentPage.value = 1;
    totalPages.value = 1;
    hasMoreVideos.value = true;
    isFirstLoad.value = true;
    videoData.value = [];
  }
  
  // 检查是否为第一个标签（热门），如果不是则启用懒加载
  const firstTypeId = typesList.value.length > 0 ? typesList.value[0].type_id : 1;
  const isFirstTab = typeId === firstTypeId;
  
  // 获取对应的广告数据
  const isListTab = !isFirstTab;
  fetchListAds(isListTab);
  
  if (isFirstTab) {
    // 第一个标签立即加载，如果没有缓存数据
    if (!tabStates.value[typeId]) {
      fetchRecommendVideosData(1, typeId);
    }
  } else {
    // 其他标签，如果没有缓存数据，等待滚动触发懒加载
    if (!tabStates.value[typeId]) {
      isFirstLoad.value = true;
    }
    
    // 添加滚动监听（如果还没有添加）
    addScrollListener();
    
    // 立即触发一次检查，如果用户已经在底部附近则开始加载
    setTimeout(() => {
      checkScrollForLazyLoad();
    }, 100);
  }
};

// 检查缓存是否有效（30分钟内的缓存认为有效）
const isCacheValid = (lastUpdateTime: number): boolean => {
  const CACHE_DURATION = 30 * 60 * 1000; // 30分钟
  return Date.now() - lastUpdateTime < CACHE_DURATION;
};

// 更新指定标签的缓存
const updateTabCache = (tabId: number) => {
  // 记录当前滚动位置
  const scrollPosition = window.scrollY || document.documentElement.scrollTop;
  
  // 更新指定标签的缓存状态
  tabStates.value[tabId] = {
    scrollPosition: scrollPosition,
    currentPage: currentPage.value,
    totalPages: totalPages.value,
    hasMoreVideos: hasMoreVideos.value,
    videos: [...videoData.value], // 创建视频数据的副本
    lastUpdateTime: Date.now() // 记录缓存时间
  };
  
  // 同时保存到sessionStorage进行持久化
  saveSessionData();
  
  console.log(`更新标签${tabId}的缓存: 页码=${currentPage.value}, 总页数=${totalPages.value}, 数据长度=${videoData.value.length}, 滚动位置=${scrollPosition}`);
};

// 保存当前标签状态（主要用于切换标签时）
const saveCurrentTabState = () => {
  updateTabCache(activeTypeId.value);
};

// 存储广告位置信息，以便在"换一批"后依然保留广告位置
const adPositions = ref<number[]>([3, 6, 11]);
// 存储已插入广告的视频数据，用于"换一批"后的数据处理
const videoDataWithAds = ref<VideoItem[]>([]);

// 获取推荐视频数据
const fetchRecommendVideosData = async (page = 1, tid = VIDEO_CATEGORIES.ALL, loadMore = false) => {
  // 如果是加载更多，设置加载更多状态
  if (loadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
  }
  
  hasError.value = false;
  errorMessage.value = '';
  
  try {
    // 构建请求参数，包含页码和分类ID
    const params = {
      mid: 1,
      limit: DEFAULT_PAGE_SIZE,
      page: page,
      tid: tid
    };
    
    // 选择使用哪种请求方法
    const result = useFetch 
      ? await fetchRecommendVideos(params) 
      : await getRecommendVideos(params) as ApiResponse;
      
    console.log('API返回数据:', result);
    
    // 更新页码信息
    if (result.page) {
      currentPage.value = result.page;
    }
    if (result.pagecount) {
      totalPages.value = result.pagecount;
    }
    
    // 检查是否还有更多数据
    hasMoreVideos.value = currentPage.value < totalPages.value;
    
    // 处理API返回的数据，并根据实际响应结构调整
    let apiData: ApiVideoItem[] = [];
    
    // 适应不同的数据结构
    if (result.data && result.data.list) {
      // 新的数据结构 { data: { list: [...] } }
      apiData = result.data.list;
    } else if (result.data) {
      // 直接返回数据列表 { data: [...] }
      apiData = Array.isArray(result.data) ? result.data : [];
    } else if (result.list) {
      // 另一种结构 { list: [...] }
      apiData = result.list;
    }
    
    // 映射字段
    const processedData = apiData.map(processVideoData);
    console.log('视频映射后数据长度:', processedData.length);
    
    // 处理数据并插入广告
    const finalData = processDataWithAds(processedData, page);
    
    // 判断是加载更多还是第一页
    if (loadMore && page > 1) {
      // 加载更多，将新数据追加到现有数据后面
      videoData.value = [...videoData.value, ...finalData];
    } else {
      // 第一页，直接替换数据
      videoData.value = finalData;
    }
    
    // 标记已完成第一次加载
    if (isFirstLoad.value) {
      isFirstLoad.value = false;
    }
    
    // 数据加载完成后立即更新缓存
    updateTabCache(tid);
    
    console.log('处理后的视频数据:', videoData.value);
    console.log(`当前页: ${currentPage.value}, 总页数: ${totalPages.value}`);
  } catch (error: any) {
    console.error('获取推荐视频失败:', error);
    hasError.value = true;
    
    // 显示明确的错误信息
    if (error.message) {
      console.error('错误详情:', error.message);
      errorMessage.value = error.message;
    }
    if (error.response) {
      console.error('服务器返回状态:', error.response.status);
      console.error('服务器返回数据:', error.response.data);
    }
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

// 处理数据并插入广告
const processDataWithAds = (processedData: VideoItem[], page: number): VideoItem[] => {
  // 创建数据副本，避免直接修改原始数据
  const finalData = [...processedData];
  
  // 只有第一页且有广告时才处理
  if (page === 1 && listAds.value.length > 0) {
    console.log('广告数据长度:', listAds.value.length);
    
    // 使用前三个广告
    const adsToUse = listAds.value.slice(0, 3);
    console.log('将使用的广告数量:', adsToUse.length);
    
    // 减少显示一条视频，如果视频数量足够的话
    if (finalData.length > DEFAULT_PAGE_SIZE / 2) {
      // 移除最后一条视频，以便插入更多广告
      finalData.pop();
      console.log('减少一条视频后的数据长度:', finalData.length);
    }
    
    // 插入广告到预设位置
    for (let i = 0; i < Math.min(adPositions.value.length, adsToUse.length); i++) {
      const position = adPositions.value[i];
      // 确保位置在有效范围内
      if (finalData.length >= position) {
        console.log(`在位置${position}插入第${i+1}个广告:`, adsToUse[i]);
        finalData.splice(position, 0, adsToUse[i]);
      }
    }
    
    console.log('插入广告后的数据长度:', finalData.length);
    // 保存带广告的数据供后续使用
    videoDataWithAds.value = [...finalData];
  } else if (page === 1) {
    // 如果是第一页但没有广告，则使用原始数据
    videoDataWithAds.value = finalData;
  }
  
  return page === 1 ? finalData : processedData;
};

// 处理搜索提交
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    // 跳转到搜索页面，并传递搜索关键词作为查询参数
    router.push({
      name: 'search',
      query: { wd: searchKeyword.value.trim() }
    });
  }
};

// 刷新视频数据 - 加载下一页（仅用于换一批按钮）
const refreshVideos = () => {
  // 检查是否为第一个标签
  const firstTypeId = typesList.value.length > 0 ? typesList.value[0].type_id : 1;
  const isFirstTab = activeTypeId.value === firstTypeId;
  
  if (isFirstTab) {
    // 第一个标签使用换一批逻辑
    const nextPage = currentPage.value < totalPages.value ? currentPage.value + 1 : 1;
    console.log(`加载第 ${nextPage} 页数据`);
    
    // 设置临时加载状态
    isLoading.value = true;
    
    // 构建请求参数
    const params = {
      mid: 1,
      limit: DEFAULT_PAGE_SIZE,
      page: nextPage,
      tid: activeTypeId.value
    };
    
    // 发起请求获取新数据
    (useFetch ? fetchRecommendVideos(params) : getRecommendVideos(params))
      .then((result: ApiResponse) => {
        // 更新页码信息
        if (result.page) {
          currentPage.value = result.page;
        }
        
        // 处理API返回的数据
        let apiData: ApiVideoItem[] = [];
        
        // 适应不同的数据结构
        if (result.data && result.data.list) {
          apiData = result.data.list;
        } else if (result.data) {
          apiData = Array.isArray(result.data) ? result.data : [];
        } else if (result.list) {
          apiData = result.list;
        }
        
        // 映射字段
        const processedData = apiData.map(processVideoData);
        
        // 减少显示一条视频，如果视频数量足够的话
        if (processedData.length > DEFAULT_PAGE_SIZE / 2) {
          processedData.pop();
        }
        
        // 直接使用之前保存的广告位置插入广告
        const adsToUse = listAds.value.slice(0, 3);
        
        // 确保广告数据可用
        if (adsToUse.length > 0) {
          for (let i = 0; i < Math.min(adPositions.value.length, adsToUse.length); i++) {
            const position = adPositions.value[i];
            // 确保位置在有效范围内
            if (processedData.length >= position) {
              console.log(`换一批后在位置${position}插入第${i+1}个广告:`, adsToUse[i]);
              processedData.splice(position, 0, adsToUse[i]);
            }
          }
        }
        
        // 更新视频数据
        videoData.value = processedData;
        
        console.log('换一批后的数据长度:', videoData.value.length);
      })
      .catch((error) => {
        console.error('换一批加载数据失败:', error);
        hasError.value = true;
        errorMessage.value = error.message || '加载失败，请稍后再试';
      })
      .finally(() => {
        isLoading.value = false;
      });
  } else {
    // 其他标签不显示换一批按钮，改为无限滚动
    console.log('当前标签使用无限滚动，不支持换一批');
  }
};

// 获取轮播图广告数据
const fetchBannerAds = async () => {
  try {
    // 请求首页轮播图广告数据
    const result = await fetchAds({
      ad_pos: 1, // 首页位置
      ad_type: 1  // 轮播图类型
    });
    
    console.log('获取轮播图广告数据:', result);
    
    // 处理API返回的广告数据
    if (result && result.code === 1 && result.data && Array.isArray(result.data) && result.data.length > 0) {
      // 将API返回的广告数据转换为本地数据结构
      const apiAds = result.data.map((item: any) => {
        const adItem = {
          id: item.id || 0,
          imageUrl: processAdImageUrl(item.ad_img || ''),
          title: item.ad_name || '广告',
          link: item.ad_url || ''
        };
        
        console.log('处理后的广告项:', adItem);
        return adItem;
      });
      
      // 更新轮播图广告数据
      console.log('更新轮播图广告数据:', apiAds);
      bannerAds.value = apiAds;
    } else {
      console.log('没有获取到轮播图广告数据，不显示轮播图');
      bannerAds.value = [];
    }
  } catch (error) {
    console.error('获取轮播图广告失败:', error);
    bannerAds.value = [];
  }
};

// 获取单图广告数据
const fetchSingleAd = async () => {
  try {
    // 请求首页单图广告数据
    const result = await fetchAds({
      ad_pos: 1, // 首页位置
      ad_type: 2  // 单图类型
    });
    
    console.log('获取单图广告数据:', result);
    
    // 处理API返回的广告数据
    if (result && result.code === 1 && result.data && Array.isArray(result.data) && result.data.length > 0) {
      // 获取第一个单图广告
      const item = result.data[0];
      
      singleAd.value = {
        id: item.id || 0,
        imageUrl: processAdImageUrl(item.ad_img || ''),
        title: item.ad_name || '广告',
        link: item.ad_url || ''
      };
      
      console.log('处理后的单图广告:', singleAd.value);
    } else {
      console.log('没有获取到单图广告数据，不显示单图广告');
      singleAd.value = null;
    }
  } catch (error) {
    console.error('获取单图广告失败:', error);
    singleAd.value = null;
  }
};

// 处理广告点击
const handleAdClick = (ad: BannerAd | SingleAd) => {
  if (!ad.link) return;
  
  console.log(`广告点击: ${ad.title}, 链接: ${ad.link}`);
  
  // 如果是内部链接，使用路由跳转
  if (ad.link.startsWith('/')) {
    router.push(ad.link);
  } else {
    // 外部链接，使用window.open打开
    window.open(ad.link, '_blank');
  }
};

// 处理图片加载错误
const handleImageError = (event: Event, ad: BannerAd | SingleAd) => {
  console.error(`广告图片加载失败: ${ad.title}, URL: ${ad.imageUrl}`);
  
  // 如果是轮播图广告，从列表中移除
  if ('id' in ad) {
    const bannerIndex = bannerAds.value.findIndex(item => item.id === ad.id);
    if (bannerIndex > -1) {
      bannerAds.value.splice(bannerIndex, 1);
      return;
    }
    
    // 如果是单图广告，设置为null
    if (singleAd.value && singleAd.value.id === ad.id) {
      singleAd.value = null;
    }
  }
};

// 处理广告图片路径
const processAdImageUrl = (imgPath: string) => {
  console.log('原始广告图片路径:', imgPath);
  
  if (!imgPath) return '';
  
  let imageUrl = '';
  
  // 处理图片URL
  if (imgPath.startsWith('/')) {
    imageUrl = `${BASE_URL}${imgPath}`;
  } else if (imgPath.startsWith('http')) {
    imageUrl = imgPath;
  } else {
    imageUrl = `${BASE_URL}/${imgPath}`;
  }
  
  console.log('处理后的图片路径:', imageUrl);
  return imageUrl;
};

// 获取标签数据
const fetchTagsData = async () => {
  isTagsLoading.value = true;
  
  try {
    // 请求标签数据
    const result = await fetchTags();
    console.log('标签数据原始响应:', result);
    
    if (result && result.code === 1 && result.data && Array.isArray(result.data) && result.data.length > 0) {
      // 处理API返回的标签数据
      const apiTags = result.data.map((item: any, index: number) => {
        return {
          tag_id: item.tag_id || (index + 1), // 如果没有tag_id，使用索引+1作为ID
          tag_name: item.tag_name || '',
          tag_img: item.tag_img ? processImageUrl(item.tag_img) : '', // 如果没有图片，设置为空，让CSS处理背景
          hasImage: !!item.tag_img // 标记是否有图片
        };
      });
      
      // 更新标签数据
      tagsList.value = apiTags;
      
      // 只显示前3个标签
      visibleTags.value = apiTags.slice(0, 3);
      
      console.log('处理后的标签数据:', tagsList.value);
      console.log('显示的标签:', visibleTags.value);
      console.log('visibleTags长度:', visibleTags.value.length);
    } else {
      console.log('API返回的标签数据格式不正确或为空，使用默认标签');
      console.log('API返回详情:', {
        hasResult: !!result,
        code: result?.code,
        hasData: !!result?.data,
        isArray: Array.isArray(result?.data),
        dataLength: result?.data?.length
      });
      
      // 使用默认标签数据
      useDefaultTags();
    }
  } catch (error) {
    console.error('获取标签数据请求失败:', error);
    console.log('使用默认标签数据作为备选方案');
    
    // 出错时使用默认标签数据
    useDefaultTags();
  } finally {
    isTagsLoading.value = false;
  }
};

// 使用默认标签数据
const useDefaultTags = () => {
  const defaultTags = [
    { tag_id: 1, tag_name: '热门', tag_img: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=600', hasImage: true },
    { tag_id: 2, tag_name: '最新', tag_img: 'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=600', hasImage: true },
    { tag_id: 3, tag_name: '推荐', tag_img: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=600', hasImage: true }
  ];
  
  tagsList.value = defaultTags;
  visibleTags.value = defaultTags.slice(0, 3);
  
  console.log('已设置默认标签数据:', defaultTags);
};

// 处理图片URL (通用方法)
const processImageUrl = (imgPath: string): string => {
  if (!imgPath) return '';
  
  let imageUrl = '';
  
  // 处理图片URL
  if (imgPath.startsWith('/')) {
    imageUrl = `${BASE_URL}${imgPath}`;
  } else if (imgPath.startsWith('http')) {
    imageUrl = imgPath;
  } else {
    imageUrl = `${BASE_URL}/${imgPath}`;
  }
  
  return imageUrl;
};

// 处理标签图片加载错误
const handleTagImageError = (event: Event) => {
  console.error('标签图片加载失败');
  
  // 图片加载失败时，设置为透明或移除图片，但保持标签可见
  const imgElement = event.target as HTMLImageElement;
  imgElement.style.display = 'none'; // 隐藏图片，但保持标签可见
  
  // 可选：为标签添加一个背景色，确保文字可见
  const tagItem = imgElement.closest('.tag-item') as HTMLElement;
  if (tagItem) {
    tagItem.style.backgroundColor = '#333'; // 设置背景色
  }
};

// 列表广告数据
interface ListAd {
  id: number;
  coverUrl: string;
  title: string;
  isVip?: boolean;
  isFree?: boolean;
  duration?: string;
  class?: string;
  link?: string;
  isAd: boolean;
}

const listAds = ref<ListAd[]>([]);

// 获取列表广告数据
const fetchListAds = async (isListTab: boolean) => {
  try {
    // 请求首页单图广告数据(ad_type=2)
    const result = await fetchAds({
      ad_pos: 2, // 首页位置
      ad_type: 2  // 单图类型
    });
    
    console.log('获取列表广告数据:', result);
    
    // 处理API返回的广告数据
    if (result && result.code === 1 && result.data && Array.isArray(result.data) && result.data.length > 0) {
      // 将API返回的广告数据转换为VideoItem格式
      const apiAds = result.data.map((item: any) => {
        const adItem: ListAd = {
          id: item.id || 0,
          coverUrl: processAdImageUrl(item.ad_img || ''),
          title: item.ad_name || '广告',
          isVip: false,
          isFree: true,
          class: '广告',
          link: item.ad_url || '',
          isAd: true
        };
        
        console.log('处理后的列表广告项:', adItem);
        return adItem;
      });
      
      // 更新列表广告数据
      console.log('更新列表广告数据:', apiAds);
      listAds.value = apiAds;
    } else {
      console.log('没有获取到列表广告数据，不显示广告');
      listAds.value = [];
    }
  } catch (error) {
    console.error('获取列表广告失败:', error);
    listAds.value = [];
  }
};

// 添加滚动监听，检测何时到达底部进行懒加载
const checkScrollForLazyLoad = () => {
  // 如果正在加载、已经加载完所有数据、有错误，或者是第一个标签，则不处理
  const firstTypeId = typesList.value.length > 0 ? typesList.value[0].type_id : 1;
  const isFirstTab = activeTypeId.value === firstTypeId;
  
  if (isLoading.value || isLoadingMore.value || !hasMoreVideos.value || hasError.value || isFirstTab) {
    return;
  }
  
  // 获取滚动位置
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  // 更新当前滚动位置
  currentScrollPosition.value = scrollTop;
  
  // 获取视口高度
  const windowHeight = window.innerHeight;
  // 获取文档总高度
  const documentHeight = document.documentElement.scrollHeight;

  // 当距离底部不足100px时，进行懒加载
  if (documentHeight - (scrollTop + windowHeight) < 100) {
    loadMoreVideos();
  }
};

// 加载更多视频
const loadMoreVideos = () => {
  // 检查是否为第一个标签
  const firstTypeId = typesList.value.length > 0 ? typesList.value[0].type_id : 1;
  const isFirstTab = activeTypeId.value === firstTypeId;
  
  if (isFirstTab) {
    // 第一个标签不使用无限滚动
    return;
  }
  
  // 如果是第一次加载（懒加载）且当前没有数据
  if (isFirstLoad.value && videoData.value.length === 0) {
    console.log(`首次加载第1页数据，标签ID: ${activeTypeId.value}`);
    fetchRecommendVideosData(1, activeTypeId.value);
    return;
  }
  
  // 如果当前没有更多数据或正在加载，则不处理
  if (!hasMoreVideos.value || isLoadingMore.value) {
    console.log(`无更多数据或正在加载中，hasMoreVideos: ${hasMoreVideos.value}, isLoadingMore: ${isLoadingMore.value}`);
    return;
  }
  
  // 计算下一页，如果已到最后一页则不加载
  if (currentPage.value < totalPages.value) {
    const nextPage = currentPage.value + 1;
    console.log(`加载更多数据 - 第 ${nextPage} 页，当前已有${videoData.value.length}条数据，标签ID: ${activeTypeId.value}`);
    fetchRecommendVideosData(nextPage, activeTypeId.value, true);
  } else {
    console.log('已经是最后一页了');
    hasMoreVideos.value = false;
  }
};

// 添加滚动事件监听
const addScrollListener = () => {
  // 移除已存在的监听器避免重复添加
  window.removeEventListener('scroll', checkScrollForLazyLoad);
  // 添加新的监听器
  window.addEventListener('scroll', checkScrollForLazyLoad);
};

// 移除滚动事件监听
const removeScrollListener = () => {
  window.removeEventListener('scroll', checkScrollForLazyLoad);
};

// 检查是否需要显示首页弹窗
const checkHomePopupStatus = () => {
  // 检查当前会话是否已经显示过弹窗
  if (!hasShownPopupThisSession.value && !sessionStorage.getItem('homePopupShownThisSession')) {
    showHomePopup.value = true;
    // 标记本次会话已经显示过弹窗
    sessionStorage.setItem('homePopupShownThisSession', 'true');
    hasShownPopupThisSession.value = true;
  }
};

// 关闭首页弹窗
const closeHomePopup = () => {
  showHomePopup.value = false;
};

// 记录页面会话状态
const isNavigatedFromInside = ref(false);

// 处理页面关闭或刷新的函数
const handlePageUnload = () => {
  // 保存当前会话数据
  saveSessionData();
  
  // 在页面关闭或刷新时清除会话状态
  sessionStorage.removeItem('pageSessionActive');
  // 不清除弹窗状态，保持关闭状态直到会话结束
};

// 组件挂载时获取数据
onMounted(async () => {
  // 添加页面关闭或刷新的事件监听
  window.addEventListener('beforeunload', handlePageUnload);
  
  // 尝试恢复之前的会话数据
  const hasRestoredData = restoreSessionData();
  
  // 处理邀请码参数
  handleInviteCode();

  // 检查是否显示首页弹窗
  checkHomePopupStatus();
  
  // 获取类型列表数据
  await fetchTypesData();
  
  // 只有在页面内导航时才恢复选项卡状态，关闭页面后重新打开应该重置为默认选项卡
  const isPageRefreshed = !sessionStorage.getItem('pageSessionActive');
  
  // 标记页面会话已激活
  sessionStorage.setItem('pageSessionActive', 'true');
  
  if (!isPageRefreshed) {
    // 从localStorage读取上一次选中的标签ID
    const lastActiveTabId = localStorage.getItem('lastActiveTabId');
    if (lastActiveTabId && typesList.value.some(type => type.type_id === parseInt(lastActiveTabId))) {
      // 如果有上次选中的标签ID且该标签存在于当前标签列表中，则恢复选中状态
      activeTypeId.value = parseInt(lastActiveTabId);
      console.log('恢复上次选中的标签ID:', activeTypeId.value);
    }
  } else {
    console.log('页面是刷新或新打开的，使用默认选项卡');
    // 页面刷新或新打开时，清除之前保存的选项卡状态
    localStorage.removeItem('lastActiveTabId');
    // 设置为第一个选项卡
    activeTypeId.value = typesList.value.length > 0 ? typesList.value[0].type_id : 1;
  }
  
  // 确定是否是首页标签
  const firstTypeId = typesList.value.length > 0 ? typesList.value[0].type_id : 1;
  const isFirstTab = activeTypeId.value === firstTypeId;
  const isListTab = !isFirstTab;
  
  // 先获取广告数据
  await Promise.all([
    fetchBannerAds(),
    fetchSingleAd(),
    fetchListAds(isListTab) // 根据当前标签类型获取对应广告
  ]);
  
  // 检查当前标签是否有有效的缓存数据
  const currentTabCache = tabStates.value[activeTypeId.value];
  if (currentTabCache && currentTabCache.videos.length > 0 && isCacheValid(currentTabCache.lastUpdateTime)) {
    console.log('使用有效的缓存数据');
    
    // 恢复完整状态
    currentPage.value = currentTabCache.currentPage;
    totalPages.value = currentTabCache.totalPages;
    hasMoreVideos.value = currentTabCache.hasMoreVideos;
    videoData.value = [...currentTabCache.videos];
    isFirstLoad.value = false; // 重要：标记为非首次加载
    
    // 恢复滚动位置
    setTimeout(() => {
      window.scrollTo(0, currentTabCache.scrollPosition);
    }, 100);
  } else {
    // 没有有效缓存，重新获取视频数据
    if (currentTabCache) {
      console.log('缓存已过期，重新获取视频数据');
    } else {
      console.log('没有缓存，重新获取视频数据');
    }
    fetchRecommendVideosData(1, activeTypeId.value); // 从第1页开始，使用当前活跃的标签ID
  }
  
  fetchTagsData();
  
  // 如果不是首页标签，添加滚动监听
  if (!isFirstTab) {
    // 添加滚动监听
    addScrollListener();
  }
});

// 从其他页面返回时激活的钩子（用于处理从详情页返回的情况）
onActivated(() => {
  console.log('首页被重新激活');
  
  // 确定是否是首页标签
  const firstTypeId = typesList.value.length > 0 ? typesList.value[0].type_id : 1;
  const isFirstTab = activeTypeId.value === firstTypeId;
  
  // 尝试恢复当前标签的缓存数据
  const currentTabCache = tabStates.value[activeTypeId.value];
  if (currentTabCache && currentTabCache.videos.length > 0 && isCacheValid(currentTabCache.lastUpdateTime)) {
    console.log(`从有效缓存恢复标签${activeTypeId.value}的数据`);
    
    // 恢复所有状态
    currentPage.value = currentTabCache.currentPage;
    totalPages.value = currentTabCache.totalPages;
    hasMoreVideos.value = currentTabCache.hasMoreVideos;
    videoData.value = [...currentTabCache.videos];
    isFirstLoad.value = false; // 重要：标记为非首次加载
    
    // 恢复滚动位置
    setTimeout(() => {
      window.scrollTo(0, currentTabCache.scrollPosition);
      console.log(`恢复滚动位置到: ${currentTabCache.scrollPosition}`);
    }, 50);
  }
  
  // 检查是否有从详情页返回的滚动位置需要恢复
  const savedScrollPosition = sessionStorage.getItem('homeScrollPosition');
  if (savedScrollPosition) {
    const scrollPosition = parseInt(savedScrollPosition);
    console.log(`从详情页返回，恢复精确滚动位置: ${scrollPosition}`);
    
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
      sessionStorage.removeItem('homeScrollPosition');
    }, 50);
  }
  
  // 如果不是首页标签，重新添加滚动监听
  if (!isFirstTab) {
    console.log('重新添加滚动监听器');
    addScrollListener();
  }
  
  // 从详情页返回时不再检查弹窗状态，保持关闭状态
});

// 组件卸载时移除滚动事件监听
onBeforeUnmount(() => {
  // 保存当前标签状态
  saveCurrentTabState();
  
  // 保存会话数据
  saveSessionData();
  
  removeScrollListener();
  
  // 移除页面关闭或刷新的事件监听
  window.removeEventListener('beforeunload', handlePageUnload);
  
  // 不清除弹窗状态，保持关闭状态直到会话结束
});

// 处理APP下载点击
const openAppDownload = () => {
  // 打开APP下载页面
  const appDownloadUrl = 'https://jm.muqumw.cn/fyf/index.html?vipid=168168';
  window.open(appDownloadUrl, '_blank');
  console.log('跳转到APP下载页面:', appDownloadUrl);
};

// 保存弹窗为图片
const savePopupAsImage = async () => {
  if (!popupContent.value) return;
  
  try {
    // 显示加载提示
    showToast({
      message: '正在生成图片...',
      duration: 2000,
    });
    
    // 使用html2canvas将DOM元素转换为Canvas
    const canvas = await html2canvas(popupContent.value, {
      backgroundColor: '#1e1e1e',
      scale: 2, // 提高分辨率
      logging: false,
      useCORS: true
    });
    
    // 将Canvas转换为图片URL
    const imgUrl = canvas.toDataURL('image/png');
    
    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = imgUrl;
    downloadLink.download = '防失联域名信息.png';
    
    // 模拟点击下载
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // 显示成功提示
    showToast({
      message: '图片已保存',
      type: 'success',
      duration: 2000,
    });
  } catch (error) {
    console.error('保存图片失败:', error);
    // 显示错误提示
    showToast({
      message: '保存失败，请手动截图',
      type: 'fail',
      duration: 2000,
    });
  }
};

// 保存会话数据到sessionStorage
const saveSessionData = () => {
  try {
    // 将当前的tabStates转换为JSON字符串并保存
    sessionStorage.setItem('tabStates', JSON.stringify(tabStates.value));
    console.log('保存会话数据到sessionStorage');
  } catch (error) {
    console.error('保存会话数据失败:', error);
  }
};

// 从sessionStorage恢复会话数据
const restoreSessionData = () => {
  try {
    const savedData = sessionStorage.getItem('tabStates');
    if (savedData) {
      tabStates.value = JSON.parse(savedData);
      console.log('从sessionStorage恢复会话数据');
      return true;
    }
  } catch (error) {
    console.error('恢复会话数据失败:', error);
  }
  return false;
};
</script>

<template>
  <div class="home">
    <!-- 首页图片弹窗 -->
    <div v-if="showHomePopup" class="home-popup-overlay">
      <div class="home-popup-container">
        <div class="home-popup-content" ref="popupContent">
          <div class="popup-section">
            <div class="section-title">防失联域名：</div>
            <div class="domain-list">
              <span class="domain-item">jiji8.tv</span>
              <span class="domain-item">jiji1.tv</span>
              <span class="domain-item">jiji8.cc</span>
              <span class="domain-item">jiji8.vip</span>
            </div>
            <div class="section-tip">建议截图保存以免丢失看片好站。</div>
          </div>
          
          <div class="popup-section">
            <div class="section-content"><span class="highlight">随意注册</span> 免费看片</div>
            <div class="section-content">分享好友领积分免费看，每日更新海量片源。</div>
            <div class="section-content">本站永久免费，每日登陆送看片积分</div>
          </div>
          
          <div class="popup-section">
            <div class="section-content">娱乐请找365集团旗下产品。</div>
            <div class="other-sites">
              <div class="site-item">风月坊：<span class="site-url">jml918.vip</span></div>
              <div class="site-item">368：<span class="site-url">186j.win</span></div>
              <div class="site-item">新世纪：<span class="site-url">xsj88.net</span></div>
            </div>
          </div>
          
          <div class="popup-section warning">
            <div class="section-content">温馨提示切勿相信视频里的广告，已有多人被诈骗。</div>
          </div>
          
          <div class="popup-buttons">
            <button class="popup-btn popup-btn-save" @click="savePopupAsImage">保存图片</button>
            <button class="popup-btn popup-btn-close" @click="closeHomePopup">关闭</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <div class="search-input">
        <van-icon name="search" color="#999" />
        <input 
          type="text" 
          placeholder="影片名称" 
          class="search-field" 
          v-model="searchKeyword"
          @keyup.enter="handleSearch"
        />
        <van-icon 
          v-if="searchKeyword" 
          name="clear" 
          color="#999" 
          class="clear-icon" 
          @click="searchKeyword = ''" 
        />
      </div>
      <div class="app-download" @click="openAppDownload">
        <img src="@/assets/img/icon-download.svg" alt="APP下载" />
        APP下载
      </div>
    </div>

    <!-- 导航栏 -->
    <div class="nav-tabs">
      <div 
        v-for="type in typesList" 
        :key="type.type_id"
        :class="['tab-item', activeTypeId === type.type_id ? 'active' : '']"
        @click="switchType(type.type_id)"
      >
        {{ type.type_name }}
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="content">
      <!-- 大型轮播广告 -->
      <div class="banner" v-if="bannerAds.length > 0">
        <van-swipe :autoplay="3000" lazy-render indicator-color="#ff9500" :loop="true" @change="onBannerChange">
          <van-swipe-item v-for="(ad, index) in bannerAds" :key="ad.id" @click="handleAdClick(ad)">
            <div v-show="currentBannerIndex === index">
              <img :src="ad.imageUrl" :alt="ad.title" @error="handleImageError($event, ad)" />
            </div>
          </van-swipe-item>
        </van-swipe>
      </div>

      <!-- 分类标签 -->
      <div class="category-tags" v-if="isTagsLoading || visibleTags.length > 0">
        <div v-if="isTagsLoading" class="tag-loading">
          <van-loading type="spinner" size="24px" color="#ff9500" />
        </div>
        <template v-else-if="visibleTags.length > 0">
          <router-link 
            v-for="tag in visibleTags" 
            :key="tag.tag_id" 
            :to="`/tag/${tag.tag_id}?name=${encodeURIComponent(tag.tag_name)}`"
            :class="['tag-item', !tag.hasImage ? 'tag-no-image' : '']"
          >
            <img v-if="tag.hasImage && tag.tag_img" :src="tag.tag_img" :alt="tag.tag_name" @error="handleTagImageError($event)" />
            <div class="tag-overlay"></div>
            <div class="tag-content">{{ tag.tag_name }}</div>
          </router-link>
          <router-link to="/tags" class="tag-item more-tags">
            <div class="tag-content">更多分类</div>
          </router-link>
        </template>
      </div>

      <!-- 横幅广告 -->
      <div class="ad-banner" v-if="singleAd" @click="handleAdClick(singleAd)">
        <img :src="singleAd.imageUrl" :alt="singleAd.title" @error="handleImageError($event, singleAd)" />
      </div>

      <!-- 视频列表 -->
      <div v-if="isLoading && videoData.length === 0" class="loading-state">
        <van-loading type="spinner" color="#ff9500" />
        <div class="loading-text">加载中...</div>
      </div>
      <div v-else-if="hasError" class="error-state">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">加载失败，请稍后再试</div>
        <div v-if="errorMessage" class="error-detail">{{ errorMessage }}</div>
      </div>
      <VideoList v-else :videos="videoData" />

      <!-- 加载更多状态（仅非第一个标签显示） -->
      <div v-if="isLoadingMore && !isFirstTabActive" class="loading-more">
        <van-loading type="spinner" size="20" color="#ff9500" />
        <van-icon name="down" size="16" color="#999" />
        <span>正在加载更多...</span>
      </div>
      
      <!-- 已全部加载（仅非第一个标签显示） -->
      <div v-if="videoData.length > 0 && !hasMoreVideos && !isLoading && !isLoadingMore && !isFirstTabActive" class="all-loaded">
        已经到底了~
      </div>

      <!-- 换一批按钮（仅第一个标签显示） -->
      <div v-if="isFirstTabActive" class="refresh-btn" @click="refreshVideos">
        <van-icon name="replay" />
        <span>换一批</span>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <router-link to="/" class="nav-item active">
        <img src="@/assets/img/icon-tabbar-home-active.svg" alt="首页" class="tabbar-icon" />
        <div class="nav-text">首页</div>
      </router-link>
      <router-link to="/live" class="nav-item">
        <img src="@/assets/img/icon-tabbar-live-normal.svg" alt="直播" class="tabbar-icon" />
        <div class="nav-text">直播</div>
      </router-link>
      <router-link to="/game" class="nav-item">
        <img src="@/assets/img/icon-tabbar-game-normal.svg" alt="游戏" class="tabbar-icon" />
        <div class="nav-text">游戏</div>
      </router-link>
      <router-link to="/profile" class="nav-item">
        <img src="@/assets/img/icon-tabbar-account-normal.svg" alt="我的" class="tabbar-icon" />
        <div class="nav-text">我的</div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.home {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 50px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden; /* 防止横向滚动 */
}

/* 首页弹窗样式 */
.home-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.home-popup-container {
  width: 92%;
  max-width: 420px;
  position: relative;
  animation: popupFadeIn 0.3s ease;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.home-popup-image {
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.home-popup-image img {
  width: 100%;
  display: block;
}

.home-popup-close {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

/* 顶部搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: #111;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #333;
  border-radius: 20px;
  padding: 8px 15px;
  margin-right: 10px;
}

.search-field {
  flex: 1;
  background-color: transparent;
  border: none;
  outline: none;
  color: #fff;
  margin-left: 5px;
  font-size: 14px;
}

.search-field::placeholder {
  color: #999;
}

.clear-icon {
  cursor: pointer;
}

.app-download {
  color: #ff9500;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.app-download img {
  width: 24px;
}

/* 导航标签 */
.nav-tabs {
  display: flex;
  justify-content: space-between;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0 10px;
  border-bottom: 1px solid #222;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.nav-tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.tab-item {
  padding: 12px 10px;
  font-size: 14px;
  color: #ccc;
  position: relative;
}

.tab-item.active {
  color: #ff9500;
  font-weight: bold;
  font-size: 18px;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: #ff9500;
  border-radius: 3px;
}

/* 内容区域 */
.content {
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden; /* 防止横向滚动 */
}

.banner {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
}

.banner img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}

.banner .van-swipe {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.banner .van-swipe-item {
  cursor: pointer;
}

.banner .banner-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0));
  padding: 15px 10px 8px;
  color: #fff;
  font-size: 14px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

/* 分类标签 */
.category-tags {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  position: relative;
  gap: 1%;
}

.tag-item {
  width: calc(25% - 0.75%);
  height: 84px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  aspect-ratio: 3/4;
  height: auto;
}

.tag-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.tag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
}

.tag-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  z-index: 1;
}

/* 广告横幅 */
.ad-banner {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 15px;
  height: 100px;
  cursor: pointer;
}

.ad-banner img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
}

/* 视频区域标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
}

.more-link {
  color: #999;
  font-size: 14px;
}

/* 换一批按钮 */
.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff9500;
  font-size: 14px;
  padding: 10px 0;
  margin-bottom: 15px;
}

.refresh-btn span {
  margin-left: 5px;
}

/* 底部导航 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #222;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #333;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  text-decoration: none;
}

.tabbar-icon {
  width: 24px;
  height: 24px;
  
}

.nav-item.active,
.nav-item.router-link-active {
  color: #ff9500;
}

.nav-text {
  font-size: 12px;
}

.tag-item.more-tags {
  background-color: #1c1c1c;
}

.tag-item.tag-no-image {
  background-color: #333;
}

.tag-item.more-tags .tag-content {
  color: #fff;
  font-size: 14px;
  font-weight: 400;
}

.tag-loading {
  width: 100%;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2C2C2C;
  border-radius: 6px;
}

/* 加载状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}

.loading-text,
.error-text {
  margin-top: 10px;
  color: #999;
  font-size: 14px;
}

.error-detail {
  font-size: 12px;
  color: #ff6b6b;
  margin-top: 8px;
  text-align: center;
  max-width: 90%;
  word-break: break-word;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
  margin-bottom: 15px;
  color: #999;
  font-size: 14px;
  gap: 8px;
}

.all-loaded {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  margin-bottom: 15px;
  color: #999;
  font-size: 14px;
}

.home-popup-content {
  width: 100%;
  background-color: #1e1e1e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  padding: 20px;
  border: 1px solid #333;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
  color: #ff9500;
  text-align: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.popup-section {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.popup-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.domain-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.domain-item {
  background-color: #333;
  border-radius: 4px;
  padding: 4px 8px;
  color: #ff9500;
  font-size: 14px;
}

.section-tip {
  font-size: 13px;
  color: #ff9500;
  margin-top: 8px;
}

.section-content {
  font-size: 14px;
  color: #ddd;
  line-height: 1.5;
  margin-bottom: 6px;
}

.highlight {
  color: #ff9500;
  font-weight: bold;
}

.other-sites {
  margin-top: 8px;
}

.site-item {
  font-size: 14px;
  color: #ddd;
  margin-bottom: 5px;
}

.site-url {
  color: #ff9500;
  font-weight: bold;
}

.warning {
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: 6px;
  padding: 10px;
  border: 1px solid rgba(255, 0, 0, 0.3);
}

.warning .section-content {
  color: #ff6b6b;
  font-weight: bold;
}

.home-popup-image {
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.home-popup-image img {
  width: 100%;
  display: block;
}

.popup-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  gap: 10px;
}

.popup-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 6px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.popup-btn-save {
  background-color: #ff9500;
  color: #fff;
}

.popup-btn-save:hover {
  background-color: #e68600;
}

.popup-btn-close {
  background-color: #333;
  color: #fff;
}

.popup-btn-close:hover {
  background-color: #444;
}
</style>
