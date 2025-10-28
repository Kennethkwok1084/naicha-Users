// pages/profile/profile.ts
Component({
  data: {
    
  },

  pageLifetimes: {
    show() {
      // 更新 tabBar 选中状态
      const that = this as any
      if (typeof that.getTabBar === 'function' && that.getTabBar()) {
        that.getTabBar().updateActive('profile')
      }
    }
  },

  methods: {
    
  }
})
