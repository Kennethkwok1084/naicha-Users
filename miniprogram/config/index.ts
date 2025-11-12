// config/index.ts - 全局配置
/**
 * 环境配置
 */
export const ENV = {
  // 开发环境
  dev: {
    apiBaseUrl: 'http://localhost:8000', // 本地开发服务器
    debug: true
  },
  // 测试环境
  test: {
    apiBaseUrl: 'http://localhost:8000',
    debug: true
  },
  // 生产环境
  prod: {
    apiBaseUrl: 'https://api.example.com',
    debug: false
  }
}

/**
 * 当前环境
 * 修改此处切换环境: 'dev' | 'test' | 'prod'
 */
const CURRENT_ENV: 'dev' | 'test' | 'prod' = 'dev'

/**
 * 当前环境配置
 */
export const config = ENV[CURRENT_ENV]

/**
 * API 基础地址
 * 可在此处直接修改,会覆盖环境配置
 */
export const API_BASE_URL = config.apiBaseUrl

/**
 * 是否开启调试模式
 */
export const DEBUG = config.debug

/**
 * 请求超时时间(毫秒)
 */
export const REQUEST_TIMEOUT = 30000

/**
 * 售罄商品显示策略
 * 'hide' - 隐藏售罄商品
 * 'disabled' - 显示但置灰
 */
export const SOLDOUT_STYLE: 'hide' | 'disabled' = 'disabled'

/**
 * 订单状态轮询间隔(毫秒)
 */
export const ORDER_POLLING_INTERVAL = 5000

/**
 * 订单状态轮询最大次数
 */
export const ORDER_POLLING_MAX_COUNT = 60

/**
 * 缓存过期时间(毫秒)
 */
export const CACHE_EXPIRE_TIME = {
  menu: 10 * 60 * 1000,      // 菜单 10分钟
  shopStatus: 5 * 60 * 1000,  // 店铺状态 5分钟
  userProfile: 30 * 60 * 1000 // 用户信息 30分钟
}
