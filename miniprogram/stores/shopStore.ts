// stores/shopStore.ts - 店铺状态管理
import { observable, action } from 'mobx-miniprogram'
import { getShopStatus, ShopStatus, ShopFeatures } from '../api/shop'
import { CACHE_EXPIRE_TIME } from '../config/index'

export const shopStore = observable({
  // 状态
  isOpen: true,
  deliveryRadius: 0,
  timezone: 'Asia/Shanghai',
  openHours: {} as any,
  location: null as any,
  features: {
    multi_category_enabled: false,
    reservation_enabled: false,
    want_enabled: false
  } as ShopFeatures,
  loading: false,
  lastFetchTime: 0,

  // Actions
  fetchShopStatus: action(async function(this: any, forceRefresh = false) {
    // 使用配置的缓存时间
    const now = Date.now()
    if (!forceRefresh && this.lastFetchTime && (now - this.lastFetchTime) < CACHE_EXPIRE_TIME.shopStatus) {
      return
    }

    this.loading = true
    try {
      const status: ShopStatus = await getShopStatus()
      this.isOpen = status.is_open
      this.deliveryRadius = status.delivery_radius_m
      this.timezone = status.timezone
      this.openHours = status.open_hours || {}
      this.location = status.location || null
      this.features = status.features
      this.lastFetchTime = now
    } catch (error) {
      console.error('获取店铺状态失败:', error)
      // 失败时使用默认值,不影响用户浏览
    } finally {
      this.loading = false
    }
  })
})
