// 设备适配调试页面
import { logSystemInfo, getSystemInfo, getTabBarHeight, getNavBarHeight } from '../../utils/responsive'

Page({
  data: {
    systemInfo: {} as any,
    navBarHeight: 0,
    tabBarHeight: 0,
    cssVars: {} as Record<string, string>,
  },

  onLoad() {
    this.loadSystemInfo()
    this.checkCSSVariables()
  },

  loadSystemInfo() {
    const info = getSystemInfo()
    const navBarHeight = getNavBarHeight()
    const tabBarHeight = getTabBarHeight()

    this.setData({
      systemInfo: info,
      navBarHeight,
      tabBarHeight,
    })

    // 控制台输出
    logSystemInfo()
  },

  checkCSSVariables() {
    try {
      // 在小程序中无法直接读取 CSS 变量，这里仅作示例
      this.setData({
        cssVars: {
          '--tab-bar-height': 'calc(100rpx + env(safe-area-inset-bottom))',
          '--nav-bar-height': 'calc(88rpx + env(safe-area-inset-top))',
          '--safe-area-bottom': 'env(safe-area-inset-bottom)',
          '--safe-area-top': 'env(safe-area-inset-top)',
        }
      })
    } catch (e) {
      console.error('无法读取 CSS 变量', e)
    }
  },

  onCopyInfo() {
    const info = JSON.stringify(this.data.systemInfo, null, 2)
    wx.setClipboardData({
      data: info,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
        })
      },
    })
  },

  onRefresh() {
    wx.showLoading({ title: '刷新中...' })
    setTimeout(() => {
      this.loadSystemInfo()
      this.checkCSSVariables()
      wx.hideLoading()
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
      })
    }, 500)
  },
})
