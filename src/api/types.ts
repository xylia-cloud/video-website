// 定义参数接口
export interface VideoParams {
  mid?: number | string
  limit?: number | string
  page?: number | string
  tid?: number | string
  [key: string]: string | number | undefined
}

// 定义搜索参数接口
export interface SearchParams {
  mid?: number | string // 模型mid，如1影片、2文章等
  wd?: string // 关键词
  limit?: number | string // 获取数量
  page?: number | string // 页码
  [key: string]: any // 允许其他属性
}

// 定义注册参数接口
export interface RegisterParams {
  country_code: number // 固定为86
  user_login: string // 用户名
  user_pass: string // 密码
  user_pass2: string // 确认密码
  rec_code?: string // 推荐码（可选）
  [key: string]: string | number | undefined // 添加索引签名
}

// 类型数据接口
export interface TypeItem {
  type_id: number
  type_name: string
  type_pid?: number
  child?: TypeItem[]
}

// 视频详情数据接口
export interface VideoDetail {
  vod_id: number
  vod_name: string
  vod_pic: string
  vod_pic_thumb?: string
  vod_class?: string
  vod_duration?: string
  vod_time?: string
  vod_time_add?: string
  vod_play_url?: string
  vod_pubdate?: string
  vod_copyright?: string | number
  vod_points_play?: number | string // 观看所需积分
  vod_actors?: string
  vod_director?: string
  vod_remarks?: string
  vod_content?: string
  [key: string]: any
}

// 定义标签接口返回的数据类型
export interface TagItem {
  tag_id: number
  tag_name: string
  tag_img?: string
}


// 用户信息存储管理
export interface UserInfo {
  user_id: number
  user_name: string
  token: string
  user_portrait?: string
  user_points?: number
  coin?: number // 钻石余额
  group_id?: number
  group_name?: string
  user_nick_name?: string
  rec_code?: string
  // 🔥 新增：完整的用户信息字段
  sex?: string // 性别：0=保密, 1=男, 2=女
  birthday?: string // 生日：格式 YYYY-MM-DD
  signature?: string // 个性签名
  province?: string // 省份
  city?: string // 城市
  avatar_thumb?: string // 头像缩略图
  [key: string]: any // 添加索引签名
}



export interface UserPointsData {
  points: number | string
  coin: number | string
  video_nums: number
  is_vip: number | string
  endtime?: string | number
}

export interface RefreshUserPointsResult {
  code: 0 | 1
  data: UserPointsData | null
  msg?: string
}


/**
 * 游戏记录数据接口
 */
export interface GameRecord {
  aioid: string
  ref_no: string
  gameid: string
  start_time: string
  payout: string
  p_win: string
  status: string
  game_name: string
}


/**
 * 公告数据接口
 */
export interface Notice {
  id: string
  title: string
  content: string
  status: string
  type: string
  createtime: string
  updatetime: string | null
}

export interface NoticeGroup {
  id: number
  name: string
  list: Notice[]
}


/**
 * 账目明细数据接口
 */
export interface AccountDetail {
  id: string
  type: string
  action: string
  uid: string
  totalcoin: string
}


// 关注列表相关接口和类型
export interface FollowItem {
  uid: string
  touid: string
  isattent: string // "0"表示未关注，"1"表示已关注
  user_name?: string
  user_portrait?: string
  user_nick_name?: string
}

export interface FollowListResponse {
  code: number
  info: FollowItem[]
  msg: string
}


/**
 * 推广记录数据接口
 */
export interface PromotionRecord {
  addtime: string
  user_login: string
}

