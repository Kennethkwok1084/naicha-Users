// index.ts
// 获取应用实例
const app = getApp<IAppOption>()

Component({
  data: {
    // 轮播图数据
    banners: [
      {
        id: 1,
        title: '新品上市：姜黄拿铁',
        link: ''
      },
      {
        id: 2,
        title: '每日特惠 限时优惠',
        link: ''
      },
      {
        id: 3,
        title: '会员专属福利',
        link: ''
      }
    ] as SimpleBanner[],

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

    // 广告轮播数据（中间轮播）
    ads: [
      {
        id: 1,
        title: '咖啡配件特惠',
        subtitle: '买咖啡机送咖啡豆',
        link: ''
      },
      {
        id: 2,
        title: '会员专享',
        subtitle: '每月免费赠饮',
        link: ''
      },
      {
        id: 3,
        title: '新品推荐',
        subtitle: '限时尝鲜价 8折优惠',
        link: ''
      }
    ] as PromoCard[],

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
      // Skyline 模式下 getTabBar 存在兼容性问题,暂时禁用
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
        const that = this as any
        that.openUrl(link)
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
        const that = this as any
        that.openUrl(path)
      }
    },

    // 广告轮播点击
    onAdTap(e: WechatMiniprogram.BaseEvent) {
      const { link } = e.currentTarget.dataset
      if (link) {
        const that = this as any
        that.openUrl(link)
      } else {
        wx.showToast({
          title: '敬请期待',
          icon: 'none'
        })
      }
    },

    // 打开链接，自动根据是否为 tabBar 页面选择 switchTab 或 navigateTo
    openUrl(url: string) {
      if (!url) return
      const tabPages = [
        '/pages/index/index',
        '/pages/menu/menu',
        '/pages/order-list/order-list',
        '/pages/profile/profile'
      ]

      if (tabPages.includes(url)) {
        wx.switchTab({ url })
      } else {
        wx.navigateTo({ url })
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
