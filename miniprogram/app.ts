// app.ts
import { cartStore } from './stores/index'
import { initAnalytics, getAnalytics, flushAll } from './utils/analytics'
import { login } from './api/user'
import { saveAuth } from './utils/auth'

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
    
    // 初始化游客会话ID（用于埋点）
    this.initGuestSession();
    
    // 初始化购物车
    cartStore.init();
    
    // 初始化埋点系统
    initAnalytics({
      enabled: true,
      debug: true, // 开发环境开启调试
    });
    
    // 检查小程序更新
    this.checkUpdate();
    
    // 初始化主题
    this.initTheme();
    
    // 微信登录
    this.performLogin();
  },

  async performLogin() {
    try {
      // 获取设备信息用于调试
      const systemInfo = wx.getSystemInfoSync();
      console.log('[App] 设备信息:', {
        platform: systemInfo.platform,
        system: systemInfo.system,
        model: systemInfo.model,
      });
      
      const loginResult = await wx.login();
      console.log('[App] 微信登录 code:', loginResult.code);
      console.log('[App] code 长度:', loginResult.code.length);
      
      // 调用后端登录接口换取 access_token
      const response = await login({
        code: loginResult.code,
      });
      
      console.log('[App] 登录响应完整数据:', response);
      
      // 保存 token 和用户信息
      if (response.data) {
        saveAuth({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          user_id: response.data.user_id,
        });
        
        console.log('[App] 登录成功', {
          user_id: response.data.user_id,
          is_new_user: response.data.is_new_user,
          expires_in: response.data.expires_in,
        });
        
        // 如果是新用户，可以显示欢迎提示
        if (response.data.is_new_user) {
          console.log('[App] 欢迎新用户！');
        }
      }
      
    } catch (error: any) {
      console.error('[App] 登录失败:', error);
      
      // 显示友好的错误提示
      const errorMsg = error?.data?.message || error?.message || '登录失败';
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000,
      });
      
      // 登录失败不阻塞应用启动,部分功能可能无法使用
    }
  },

  onShow() {
    // 小程序显示时，记录应用启动事件
    getAnalytics().track('app_show', {
      scene: wx.getLaunchOptionsSync().scene,
    });
  },

  onHide() {
    // 小程序隐藏时，立即上报所有待上报事件
    flushAll();
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
      
      // 上报错误到埋点系统
      getAnalytics().track('app_error', {
        error: error.substring(0, 500), // 限制长度
        timestamp: new Date().toISOString(),
      });
    }
  },

  initGuestSession() {
    // 初始化游客会话ID，用于埋点等匿名接口
    let sessionId = wx.getStorageSync('guest_session_id');
    if (!sessionId) {
      // 生成游客会话ID: guest_<timestamp>_<random>
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      sessionId = `guest_${timestamp}_${random}`;
      wx.setStorageSync('guest_session_id', sessionId);
      console.log('[App] 游客会话ID已创建:', sessionId);
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
