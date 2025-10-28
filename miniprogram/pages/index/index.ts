// index.ts
// 获取应用实例
const app = getApp<IAppOption>()

Component({
  data: {
    // 轮播图数据 (使用占位符,后续替换为真实图片)
    banners: [
      {
        id: 1,
        image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="750" height="420"%3E%3Cdefs%3E%3ClinearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%"%3E%3Cstop offset="0%" style="stop-color:%23667eea"/%3E%3Cstop offset="100%" style="stop-color:%23764ba2"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="750" height="420" fill="url(%23a)"/%3E%3Ctext x="375" y="210" font-size="48" fill="white" text-anchor="middle" font-family="Arial"%3E欢迎光临%3C/text%3E%3C/svg%3E',
        link: '',
        title: '欢迎光临'
      },
      {
        id: 2,
        image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="750" height="420"%3E%3Cdefs%3E%3ClinearGradient id="b" x1="0%" y1="0%" x2="100%" y2="100%"%3E%3Cstop offset="0%" style="stop-color:%23f093fb"/%3E%3Cstop offset="100%" style="stop-color:%234facfe"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="750" height="420" fill="url(%23b)"/%3E%3Ctext x="375" y="210" font-size="48" fill="white" text-anchor="middle" font-family="Arial"%3E新品上市%3C/text%3E%3C/svg%3E',
        link: '',
        title: '新品上市'
      },
      {
        id: 3,
        image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="750" height="420"%3E%3Cdefs%3E%3ClinearGradient id="c" x1="0%" y1="0%" x2="100%" y2="100%"%3E%3Cstop offset="0%" style="stop-color:%23fa709a"/%3E%3Cstop offset="100%" style="stop-color:%23fee140"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="750" height="420" fill="url(%23c)"/%3E%3Ctext x="375" y="210" font-size="48" fill="white" text-anchor="middle" font-family="Arial"%3E特惠活动%3C/text%3E%3C/svg%3E',
        link: '',
        title: '特惠活动'
      }
    ] as Banner[],

    // 功能区数据 (使用 emoji 占位符)
    functions: [
      {
        id: 'dine_in',
        name: '堂食点单',
        icon: '🪑', // emoji 占位符,后续可替换为真实图标
        path: '/pages/menu/menu',
        type: 'dine_in' as const
      },
      {
        id: 'take_away',
        name: '打包带走',
        icon: '🥤', // emoji 占位符
        path: '/pages/menu/menu',
        type: 'take_away' as const
      },
      {
        id: 'delivery',
        name: '外卖配送',
        icon: '🚚', // emoji 占位符
        path: '/pages/menu/menu',
        type: 'delivery' as const
      }
    ] as FunctionItem[],

    // 广告轮播数据 (使用占位符)
    ads: [
      {
        id: 1,
        image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="686" height="200"%3E%3Cdefs%3E%3ClinearGradient id="d" x1="0%" y1="0%" x2="100%" y2="0%"%3E%3Cstop offset="0%" style="stop-color:%23ff6b6b"/%3E%3Cstop offset="100%" style="stop-color:%23feca57"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="686" height="200" fill="url(%23d)" rx="16"/%3E%3Ctext x="343" y="110" font-size="36" fill="white" text-anchor="middle" font-family="Arial"%3E限时优惠%3C/text%3E%3C/svg%3E',
        link: '',
        title: '限时优惠'
      },
      {
        id: 2,
        image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="686" height="200"%3E%3Cdefs%3E%3ClinearGradient id="e" x1="0%" y1="0%" x2="100%" y2="0%"%3E%3Cstop offset="0%" style="stop-color:%235f27cd"/%3E%3Cstop offset="100%" style="stop-color:%2300d2ff"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="686" height="200" fill="url(%23e)" rx="16"/%3E%3Ctext x="343" y="110" font-size="36" fill="white" text-anchor="middle" font-family="Arial"%3E会员专享%3C/text%3E%3C/svg%3E',
        link: '',
        title: '会员专享'
      }
    ] as Banner[],

    // 集杯卡数据
    loyaltyCard: {
      user_id: 0,
      total_cups: 0,
      current_cups: 3,
      reward_threshold: 10,
      is_redeemable: false
    } as LoyaltyCard | null,

    // 店铺信息
    shopInfo: {
      name: '智能奶茶档口',
      address: '广州市天河区xxx路xxx号',
      phone: '020-12345678',
      business_hours: '周一至周日 09:00-22:00',
      status: 'open' as const
    } as ShopInfo,

    loading: false
  },

  lifetimes: {
    attached() {
      const that = this as any
      that.loadHomeData()
    }
  },

  pageLifetimes: {
    show() {
      // 更新 tabBar 选中状态
      const that = this as any
      if (typeof that.getTabBar === 'function' && that.getTabBar()) {
        that.getTabBar().updateActive('index')
      }
    }
  },

  methods: {
    // 加载首页数据
    async loadHomeData() {
      const that = this as any
      that.setData({ loading: true })
      
      try {
        // TODO: 后续接入真实 API
        // const data = await request<HomePageData>({ url: '/api/v1/home', method: 'GET' })
        // that.setData({ ...data, loading: false })
        
        // 模拟数据加载完成
        setTimeout(() => {
          that.setData({ loading: false })
        }, 500)
      } catch (error) {
        console.error('加载首页数据失败:', error)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        that.setData({ loading: false })
      }
    },

    // 轮播图点击
    onBannerTap(e: WechatMiniprogram.BaseEvent) {
      const { link } = e.currentTarget.dataset
      if (link) {
        wx.navigateTo({ url: link })
      }
    },

    // 功能区点击
    onFunctionTap(e: WechatMiniprogram.BaseEvent) {
      const { path, type } = e.currentTarget.dataset
      
      // 保存订单类型到全局
      if (type) {
        wx.setStorageSync('order_type', type)
      }
      
      if (path) {
        wx.navigateTo({ url: path })
      }
    },

    // 广告点击
    onAdTap(e: WechatMiniprogram.BaseEvent) {
      const { link } = e.currentTarget.dataset
      if (link) {
        wx.navigateTo({ url: link })
      }
    },

    // 兑换奖励
    onRedeemTap() {
      const that = this as any
      const { loyaltyCard } = that.data
      
      if (!loyaltyCard || !loyaltyCard.is_redeemable) {
        wx.showToast({
          title: '集杯数量不足',
          icon: 'none'
        })
        return
      }

      wx.showModal({
        title: '兑换确认',
        content: '确定要兑换一杯免费饮品吗?',
        success: (res) => {
          if (res.confirm) {
            // TODO: 调用兑换 API
            wx.showToast({
              title: '兑换成功',
              icon: 'success'
            })
            
            // 更新集杯卡状态
            that.setData({
              'loyaltyCard.current_cups': 0,
              'loyaltyCard.is_redeemable': false
            })
          }
        }
      })
    },

    // 下拉刷新
    onPullDownRefresh() {
      const that = this as any
      that.loadHomeData().then(() => {
        wx.stopPullDownRefresh()
      })
    }
  }
})
