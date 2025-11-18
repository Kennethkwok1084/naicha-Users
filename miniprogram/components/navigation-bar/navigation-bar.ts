Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      // 显示隐藏的时候opacity动画效果
      type: Boolean,
      value: true
    },
    show: {
      // 显示隐藏导航，隐藏的时候navigation-bar的高度占位还在
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    // back为true的时候,返回的页面深度
    delta: {
      type: Number,
      value: 1
    },
    // 是否显示底部阴影
    shadow: {
      type: Boolean,
      value: false
    },
    // 透明度 0-1
    opacity: {
      type: Number,
      value: 1
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: ''
  },
  lifetimes: {
    attached() {
      const that = this as any
      const rect = wx.getMenuButtonBoundingClientRect()
      wx.getSystemInfo({
        success: (res) => {
          const isAndroid = res.platform === 'android'
          const isDevtools = res.platform === 'devtools'
          // 将 px 转换为 rpx：在小程序中，1px = 2rpx（在 iPhone 6 基准下）
          const rightPadding = (res.windowWidth - rect.left) * 2
          const leftWidth = (res.windowWidth - rect.left) * 2
          const safeAreaTop = res.safeArea.top * 2
          
          that.setData({
            ios: !isAndroid,
            innerPaddingRight: `padding-right: ${rightPadding}rpx`,
            leftWidth: `width: ${leftWidth}rpx`,
            safeAreaTop: isDevtools || isAndroid ? `height: calc(var(--height) + ${safeAreaTop}rpx); padding-top: ${safeAreaTop}rpx` : ``
          })
        }
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _showChange(show: boolean) {
      const that = this as any
      const animated = that.data.animated
      let displayStyle = ''
      if (animated) {
        displayStyle = `opacity: ${
          show ? '1' : '0'
        };transition:opacity 0.5s;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      that.setData({
        displayStyle
      })
    },
    back() {
      const that = this as any
      const data = that.data
      if (data.delta) {
        wx.navigateBack({
          delta: data.delta
        })
      }
      that.triggerEvent('back', { delta: data.delta }, {})
    }
  },
})
