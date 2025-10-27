// app.ts
App<IAppOption>({
  globalData: {
    theme: 'default' // 'default' | 'elder'
  },
  
  onLaunch() {
    // 检查小程序更新
    this.checkUpdate();
    
    // 初始化主题
    this.initTheme();
    
    // 登录
    wx.login({
      success: res => {
        console.log('登录 code:', res.code);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
      fail: err => {
        console.error('登录失败:', err);
      }
    });
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已准备好，是否重启应用？',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
          updateManager.onUpdateFailed(() => {
            wx.showToast({
              title: '更新失败',
              icon: 'none'
            });
          });
        }
      });
    }
  },

  initTheme() {
    const theme = wx.getStorageSync('theme') || 'default';
    this.globalData.theme = theme;
  }
})
