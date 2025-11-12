// stores/shopStore.ts - 店铺状态管理
import { observable, action } from 'mobx-miniprogram'
import { getShopStatus, getShopProfile, ShopStatus, ShopProfile, ShopFeatures } from '../api/shop'
import { CACHE_EXPIRE_TIME } from '../config/index'

export const shopStore = observable({
  // 店铺基础信息
  shopName: '智能奶茶店',
  shopAddress: '',
  shopPhone: '',
  shopAnnouncement: '欢迎光临!',
  shopLogoUrl: null as string | null,
  deliveryNotes: [] as string[],
  supportsPickup: true,
  supportsDelivery: true,
  minDeliveryAmount: null as string | null,
  deliveryFee: null as string | null,
  freeDeliveryAmount: null as string | null,
  
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
  businessHoursToday: '',
  loading: false,
  lastFetchTime: 0,
  lastProfileFetchTime: 0,

  // Actions - 获取店铺基础信息
  fetchShopProfile: action(async function(this: any, forceRefresh = false) {
    const now = Date.now()
    if (!forceRefresh && this.lastProfileFetchTime && (now - this.lastProfileFetchTime) < CACHE_EXPIRE_TIME.shopStatus) {
      console.log('[ShopStore] 使用缓存的店铺信息')
      return
    }

    try {
      console.log('[ShopStore] 开始获取店铺信息...')
      const profile: ShopProfile = await getShopProfile()
      console.log('[ShopStore] 店铺信息获取成功:', profile)
      
      this.shopName = profile.name
      this.shopAddress = profile.address
      this.shopPhone = profile.phone
      this.shopAnnouncement = profile.announcement || '欢迎光临!'
      this.shopLogoUrl = profile.logo_url
      this.deliveryNotes = Array.isArray(profile.delivery_notes) ? profile.delivery_notes : []
      this.supportsPickup = profile.supports_pickup ?? true
      this.supportsDelivery = profile.supports_delivery ?? true
      this.minDeliveryAmount = profile.min_delivery_amount || null
      this.deliveryFee = profile.delivery_fee || null
      this.freeDeliveryAmount = profile.free_delivery_amount || null
      this.lastProfileFetchTime = now
      
      console.log('[ShopStore] 店铺信息已更新:', {
        shopName: this.shopName,
        shopAnnouncement: this.shopAnnouncement
      })
    } catch (error) {
      console.error('[ShopStore] 获取店铺信息失败:', error)
      // 失败时使用默认值,不影响用户浏览
    }
  }),

  // Actions - 获取店铺状态
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
      this.businessHoursToday = status.business_hours_today || ''
      this.lastFetchTime = now
    } catch (error) {
      console.error('获取店铺状态失败:', error)
      // 失败时使用默认值,不影响用户浏览
    } finally {
      this.loading = false
    }
  })
})
