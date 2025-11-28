/**
 * 响应式适配工具类
 * 解决跨设备尺寸不一致问题
 */

export interface SystemInfo {
  screenWidth: number
  screenHeight: number
  windowWidth: number
  windowHeight: number
  statusBarHeight: number
  safeArea: {
    top: number
    bottom: number
    left: number
    right: number
    height: number
    width: number
  }
  platform: 'ios' | 'android' | 'devtools'
  pixelRatio: number
}

/**
 * 获取系统信息（带缓存）
 */
let cachedSystemInfo: SystemInfo | null = null
export const getSystemInfo = (): SystemInfo => {
  if (cachedSystemInfo) return cachedSystemInfo
  
  try {
    const info = wx.getSystemInfoSync()
    cachedSystemInfo = {
      screenWidth: info.screenWidth,
      screenHeight: info.screenHeight,
      windowWidth: info.windowWidth,
      windowHeight: info.windowHeight,
      statusBarHeight: info.statusBarHeight || 20,
      safeArea: info.safeArea || {
        top: info.statusBarHeight || 20,
        bottom: info.screenHeight,
        left: 0,
        right: info.screenWidth,
        height: info.screenHeight - (info.statusBarHeight || 20),
        width: info.screenWidth,
      },
      platform: (info.platform as 'ios' | 'android' | 'devtools') || 'devtools',
      pixelRatio: info.pixelRatio || 2,
    }
    return cachedSystemInfo
  } catch (err) {
    console.error('获取系统信息失败:', err)
    // 返回默认值（iPhone 6 尺寸）
    return {
      screenWidth: 375,
      screenHeight: 667,
      windowWidth: 375,
      windowHeight: 667,
      statusBarHeight: 20,
      safeArea: { top: 20, bottom: 667, left: 0, right: 375, height: 647, width: 375 },
      platform: 'ios',
      pixelRatio: 2,
    }
  }
}

/**
 * 获取状态栏高度（px）
 */
export const getStatusBarHeight = (): number => {
  const info = getSystemInfo()
  return info.statusBarHeight
}

/**
 * 获取顶部安全区域高度（px，包含状态栏）
 */
export const getSafeAreaTop = (): number => {
  const info = getSystemInfo()
  return info.safeArea.top
}

/**
 * 获取底部安全区域高度（px，刘海屏/全面屏的底部边距）
 */
export const getSafeAreaBottom = (): number => {
  const info = getSystemInfo()
  const bottomSafeHeight = info.screenHeight - info.safeArea.bottom
  return bottomSafeHeight
}

/**
 * px 转 rpx（物理像素转响应式像素）
 * @param px 物理像素
 * @returns rpx 值
 */
export const px2rpx = (px: number): number => {
  const info = getSystemInfo()
  // rpx = px * 750 / 屏幕宽度
  return Math.round((px * 750) / info.screenWidth)
}

/**
 * rpx 转 px（响应式像素转物理像素）
 * @param rpx 响应式像素
 * @returns px 值
 */
export const rpx2px = (rpx: number): number => {
  const info = getSystemInfo()
  // px = rpx * 屏幕宽度 / 750
  return Math.round((rpx * info.screenWidth) / 750)
}

/**
 * 获取自定义导航栏高度（rpx）
 * = 状态栏高度 + 导航栏内容高度（默认 88rpx）
 */
export const getNavBarHeight = (): number => {
  const statusBarHeight = getStatusBarHeight()
  const navContentHeight = 44 // px，导航栏内容区域高度
  return px2rpx(statusBarHeight) + navContentHeight * 2 // 转为 rpx
}

/**
 * 获取 TabBar 高度（rpx）
 * iOS: 100rpx + 底部安全区
 * Android: 100rpx + 底部安全区
 */
export const getTabBarHeight = (): number => {
  const bottomSafeHeight = getSafeAreaBottom()
  const tabBarContentHeight = 50 // px
  return px2rpx(bottomSafeHeight) + tabBarContentHeight * 2 // 转为 rpx
}

/**
 * 获取可用内容区域高度（rpx）
 * = 窗口高度 - 导航栏 - TabBar
 */
export const getContentHeight = (options?: {
  hasNavBar?: boolean
  hasTabBar?: boolean
}): number => {
  const { hasNavBar = true, hasTabBar = true } = options || {}
  const info = getSystemInfo()
  let contentHeight = px2rpx(info.windowHeight)
  
  if (hasNavBar) {
    contentHeight -= getNavBarHeight()
  }
  if (hasTabBar) {
    contentHeight -= getTabBarHeight()
  }
  
  return contentHeight
}

/**
 * 判断是否为小屏设备（iPhone SE、Android 小屏）
 */
export const isSmallScreen = (): boolean => {
  const info = getSystemInfo()
  return info.screenWidth <= 375
}

/**
 * 判断是否为大屏设备（iPhone Plus、Android 大屏）
 */
export const isLargeScreen = (): boolean => {
  const info = getSystemInfo()
  return info.screenWidth >= 414
}

/**
 * 判断是否为刘海屏/全面屏（底部有安全区）
 */
export const isNotchScreen = (): boolean => {
  const bottomSafeHeight = getSafeAreaBottom()
  return bottomSafeHeight > 0
}

/**
 * 判断是否为 iOS
 */
export const isIOS = (): boolean => {
  const info = getSystemInfo()
  return info.platform === 'ios'
}

/**
 * 判断是否为 Android
 */
export const isAndroid = (): boolean => {
  const info = getSystemInfo()
  return info.platform === 'android'
}

/**
 * 生成动态样式字符串
 * @example
 * getInlineStyle({ 'padding-top': '100rpx', height: '500rpx' })
 * // => "padding-top: 100rpx; height: 500rpx;"
 */
export const getInlineStyle = (styles: Record<string, string>): string => {
  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}

/**
 * 获取底部操作栏的 bottom 值（rpx）
 * 确保在 TabBar 之上悬浮
 */
export const getActionBarBottom = (): string => {
  const tabBarHeight = getTabBarHeight()
  return `${tabBarHeight + 20}rpx` // TabBar 高度 + 20rpx 间距
}

/**
 * 获取页面内容的 padding-bottom（rpx）
 * 为底部操作栏和 TabBar 预留空间
 */
export const getContentPaddingBottom = (options?: {
  hasActionBar?: boolean
  actionBarHeight?: number
}): string => {
  const { hasActionBar = false, actionBarHeight = 160 } = options || {}
  const tabBarHeight = getTabBarHeight()
  
  if (hasActionBar) {
    return `${tabBarHeight + actionBarHeight + 40}rpx` // TabBar + ActionBar + 额外间距
  }
  
  return `${tabBarHeight + 40}rpx` // TabBar + 额外间距
}

/**
 * 调试输出系统信息
 */
export const logSystemInfo = () => {
  const info = getSystemInfo()
  console.log('=== 系统信息 ===')
  console.log('屏幕尺寸:', `${info.screenWidth}x${info.screenHeight}`)
  console.log('窗口尺寸:', `${info.windowWidth}x${info.windowHeight}`)
  console.log('状态栏高度:', `${info.statusBarHeight}px`)
  console.log('底部安全区:', `${getSafeAreaBottom()}px`)
  console.log('平台:', info.platform)
  console.log('像素比:', info.pixelRatio)
  console.log('导航栏高度:', `${getNavBarHeight()}rpx`)
  console.log('TabBar高度:', `${getTabBarHeight()}rpx`)
  console.log('是否刘海屏:', isNotchScreen())
  console.log('是否小屏:', isSmallScreen())
  console.log('================')
}
