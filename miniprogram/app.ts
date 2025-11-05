// app.ts
import { cartStore } from './stores/index'

// 全局错误抑制 - Skyline 渲染器兼容性处理
function setupErrorHandlers() {
  // 抑制控制台中的特定错误
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    const ignoredPatterns = [
      '__subscribe_webviewId',
      'postMessage',
      'webapi_getwxaasyncsecinfo',
      'ERR_PROXY_CONNECTION_FAILED',
      'Failed to fetch'
    ];
    
    const shouldIgnore = ignoredPatterns.some(pattern => message.includes(pattern));
    
    if (!shouldIgnore) {
      originalConsoleError.apply(console, args);
    }
  };
}

App<IAppOption>({
  globalData: {
    theme: 'default' // 'default' | 'elder'
  },
  
  onLaunch() {
    // 全局错误抑制
    setupErrorHandlers();
    
    // 初始化购物车
    cartStore.init();
    
    // 检查小程序更新
    this.checkUpdate();
    
    // 初始化主题
    this.initTheme();
    
    // 登录(仅在真机或体验版执行,开发环境跳过以避免网络错误)
    try {
      const accountInfo = wx.getAccountInfoSync();
      if (accountInfo.miniProgram.envVersion !== 'develop') {
        wx.login({
          success: res => {
            console.log('登录 code:', res.code);
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
          },
          fail: err => {
            console.warn('登录失败(可忽略):', err);
          }
        });
      } else {
        console.log('开发环境,跳过微信登录');
      }
    } catch (e) {
      console.warn('获取环境信息失败,跳过登录:', e);
    }
  },

  onError(error: string) {
    // 过滤已知的 Skyline 渲染器兼容性错误
    const ignoredErrors = [
      '__subscribe_webviewId',
      'postMessage',
      'webapi_getwxaasyncsecinfo',
      'Failed to fetch'
    ];
    
    const shouldIgnore = ignoredErrors.some(pattern => error.includes(pattern));
    
    if (!shouldIgnore) {
      console.error('App Error:', error);
      // 可以在这里上报到错误监控平台
    }
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
