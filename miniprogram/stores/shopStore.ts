// stores/shopStore.ts - 店铺状态管理
import { observable, action } from 'mobx-miniprogram'
import { getShopStatus, ShopStatus } from '../api/shop'

export const shopStore = observable({
  // 状态
  isOpen: true,
  businessHours: '',
  announcement: '',
  features: {
    pickup_enabled: true,
    delivery_enabled: true,
    dine_in_enabled: true
  },
  loading: false,
  lastFetchTime: 0,

  // Actions
  fetchShopStatus: action(async function(this: any, forceRefresh = false) {
    // 缓存 5 分钟
    const now = Date.now()
    if (!forceRefresh && this.lastFetchTime && (now - this.lastFetchTime) < 5 * 60 * 1000) {
      return
    }

    this.loading = true
    try {
      const status: ShopStatus = await getShopStatus()
      this.isOpen = status.is_open
      this.businessHours = status.business_hours
      this.announcement = status.announcement || ''
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
