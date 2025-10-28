// custom-tab-bar/index.ts
Component({
  data: {
    active: 'index',
    list: [
      {
        name: 'index',
        pagePath: '/pages/index/index',
        icon: 'home',
        text: '首页'
      },
      {
        name: 'menu',
        pagePath: '/pages/menu/menu',
        icon: 'app',
        text: '点单'
      },
      {
        name: 'order-list',
        pagePath: '/pages/order-list/order-list',
        icon: 'order',
        text: '订单'
      },
      {
        name: 'profile',
        pagePath: '/pages/profile/profile',
        icon: 'user',
        text: '我的'
      }
    ]
  },

  methods: {
    onChange(event: WechatMiniprogram.CustomEvent) {
      const that = this as any
      const name = event.detail.value
      const item = that.data.list.find((item: any) => item.name === name)
      
      if (item) {
        wx.switchTab({
          url: item.pagePath
        })
      }
    },

    // 更新当前选中的 tab
    updateActive(active: string) {
      const that = this as any
      that.setData({ active })
    }
  }
})
