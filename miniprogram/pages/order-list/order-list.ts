// pages/order-list/order-list.ts
Component({
  data: {
    
  },

  pageLifetimes: {
    show() {
      // 更新 tabBar 选中状态
      const that = this as any
      if (typeof that.getTabBar === 'function' && that.getTabBar()) {
        that.getTabBar().updateActive('order-list')
      }
    }
  },

  methods: {
    
  }
})
