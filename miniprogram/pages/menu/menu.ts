// pages/menu/menu.ts
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { menuStore, shopStore, cartStore } from '../../stores/index'
import { MenuProduct, MenuCategory, MenuSpecOption } from '../../api/menu'
import { SOLDOUT_STYLE } from '../../config/index'
import type { CartItem } from '../../stores/cartStore'

interface SelectedSpecsMap {
  [groupId: number]: MenuSpecOption
}

Component({
  data: {
    // 店铺状态
    shopIsOpen: true,
    
    // 菜单数据
    categories: [] as MenuCategory[],
    activeCategory: 0,
    currentProducts: [] as MenuProduct[],
    
    // 售罄商品显示策略
    soldOutStyle: SOLDOUT_STYLE,
    
    // 店铺信息弹窗
    shopDetailVisible: false,
    shopDetailLoading: false,
    deliveryInfoLines: [
      { text: '满25起送；', highlight: false },
      { text: '由商户自配送提供配送服务，距离店30km范围内配送，配送费用受天气、时间等因素影响，以实际配送费为准。', highlight: false },
      { text: '支持到店自取', highlight: true }
    ],
    businessHoursText: '休息中',
    deliveryMode: 'pickup',
    supportsPickup: true,
    supportsDelivery: true,
    headerPaddingTop: 32,
    headerToolbarHeight: 44,
    
    // 规格选择弹窗
    specPopupVisible: false,
    selectedProduct: {} as MenuProduct,
    specSelectedSpecs: {} as SelectedSpecsMap,
    specQuantity: 1,
    specDisplayPrice: 0,
    specTotalPrice: '0.00',
    
    // 加载状态
    loading: true
  },

  storeBindings: null as any,

  lifetimes: {
    attached(this: any) {
      this.initStoreBindings()
      this.measureNavigationBar()
      this.loadData()
    },

    detached(this: any) {
      if (this.storeBindings) {
        this.storeBindings.destroyStoreBindings()
      }
    }
  },

  pageLifetimes: {
    show() {
      // 更新 tabBar 选中状态
      const that = this as any
      if (typeof that.getTabBar === 'function' && that.getTabBar()) {
        that.getTabBar().updateActive('menu')
      }

      // 刷新店铺状态
      shopStore.fetchShopStatus()
      this.measureNavigationBar()
    }
  },

  methods: {
    // 初始化 Store 绑定
    initStoreBindings(this: any) {
      this.storeBindings = createStoreBindings(this, {
        store: shopStore,
        fields: {
          shopIsOpen: 'isOpen',
          shopName: 'shopName',
          shopAnnouncement: 'shopAnnouncement',
          shopAddress: 'shopAddress',
          shopPhone: 'shopPhone',
          deliveryRadius: (store: any) => {
            const radius = store.deliveryRadius
            if (radius && radius >= 1000) {
              return `${(radius / 1000).toFixed(1)}km`
            } else if (radius) {
              return `${radius}m`
            }
            return '30km'
          },
          supportsPickup: 'supportsPickup',
          supportsDelivery: 'supportsDelivery',
          deliveryNotes: 'deliveryNotes',
          businessHoursToday: 'businessHoursToday',
          minDeliveryAmount: 'minDeliveryAmount',
          deliveryFee: 'deliveryFee',
          freeDeliveryAmount: 'freeDeliveryAmount'
        },
        actions: []
      })
    },

    // 计算导航占位
    measureNavigationBar(this: any) {
      try {
        const systemInfo = wx.getSystemInfoSync()
        const statusBarHeight = systemInfo.statusBarHeight || 0
        const menuButtonRect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
        let headerPaddingTop = statusBarHeight + 8
        let headerToolbarHeight = 44

        if (menuButtonRect) {
          const topGap = menuButtonRect.top - statusBarHeight
          headerToolbarHeight = menuButtonRect.height + topGap * 2
          headerPaddingTop = statusBarHeight + topGap
        }

        this.setData({
          headerPaddingTop,
          headerToolbarHeight
        })
      } catch (error) {
        console.error('获取导航栏信息失败:', error)
        this.setData({
          headerPaddingTop: 32,
          headerToolbarHeight: 44
        })
      }
    },

    // 加载数据
    async loadData(this: any) {
      this.setData({ loading: true })

      try {
        // 并行加载店铺状态和菜单数据
        await Promise.all([
          shopStore.fetchShopProfile(),
          shopStore.fetchShopStatus(),
          menuStore.fetchMenu()
        ])

        const categories = menuStore.categories

        // 设置默认选中第一个分类
        const activeCategory = categories.length > 0 ? categories[0].category_id : 0

        this.setData({
          categories,
          activeCategory,
          loading: false
        })

        // 更新当前分类的商品列表
        this.updateCurrentProducts()
        this.normalizeDeliveryMode()
      } catch (error) {
        console.error('加载菜单数据失败:', error)
        wx.showToast({
          title: '加载失败,请重试',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    },

    // 分类切换
    onCategoryChange(this: any, event: any) {
      const categoryId = event.detail
      this.setData({
        activeCategory: categoryId
      })
      this.updateCurrentProducts()
    },

    // 更新当前分类的商品列表
    updateCurrentProducts(this: any) {
      const { activeCategory, soldOutStyle } = this.data
      
      let currentProducts = menuStore.getProductsByCategoryId(activeCategory)

      // 根据售罄策略处理
      if (soldOutStyle === 'hide') {
        // 隐藏售罄商品
        currentProducts = currentProducts.filter((p: MenuProduct) => p.inventory_status === 'available')
      }

      this.setData({
        currentProducts
      })
    },

    // 商品点击
    onProductTap(this: any, event: any) {
      const { productId } = event.detail
      
      if (!productId) {
        return
      }

      // 跳转到商品详情页
      wx.navigateTo({
        url: `/pages/product-detail/product-detail?id=${productId}`
      })
    },

    // 商品加号点击 - 打开规格选择弹窗
    onProductAdd(this: any, event: any) {
      const { productId } = event.detail
      
      if (!productId) {
        return
      }

      const product = menuStore.getProductById(productId)
      if (!product) {
        wx.showToast({
          title: '商品不存在',
          icon: 'none'
        })
        return
      }

      // 如果商品已售罄
      if (product.inventory_status === 'sold_out') {
        wx.showToast({
          title: '该商品已售罄',
          icon: 'none'
        })
        return
      }

      // 重置规格选择状态
      const basePrice = Number(product.base_price) || 0
      this.setData({
        specPopupVisible: true,
        selectedProduct: product,
        specSelectedSpecs: {},
        specQuantity: 1,
        specDisplayPrice: basePrice.toFixed(2),
        specTotalPrice: basePrice.toFixed(2)
      })
    },

    // 关闭规格选择弹窗
    closeSpecPopup(this: any) {
      this.setData({ 
        specPopupVisible: false,
        selectedProduct: {},
        specSelectedSpecs: {},
        specQuantity: 1
      })
    },

    // 规格选择弹窗可见性变化
    onSpecPopupChange(this: any, e: any) {
      if (!e.detail.visible) {
        this.closeSpecPopup()
      }
    },

    // 选择规格
    handleSelectSpec(this: any, event: any) {
      const { groupId, option } = event.currentTarget.dataset as {
        groupId: number
        option: MenuSpecOption
      }

      if (option.inventory_status === 'sold_out') {
        this.showSpecToast('该规格已售罄', 'warning')
        return
      }

      const specSelectedSpecs: SelectedSpecsMap = { ...this.data.specSelectedSpecs }
      if (specSelectedSpecs[groupId]?.option_id === option.option_id) {
        delete specSelectedSpecs[groupId]
      } else {
        specSelectedSpecs[groupId] = option
      }

      this.updateSpecPrice(specSelectedSpecs)
    },

    // 更新规格价格
    updateSpecPrice(this: any, specSelectedSpecs: SelectedSpecsMap) {
      const { selectedProduct, specQuantity } = this.data
      const basePrice = Number(selectedProduct.base_price) || 0
      const specsTotal = Object.values(specSelectedSpecs).reduce((sum, spec) => {
        return sum + (Number(spec.price_modifier) || 0)
      }, 0)

      const displayPrice = basePrice + specsTotal
      const totalPrice = displayPrice * specQuantity

      this.setData({
        specSelectedSpecs,
        specDisplayPrice: displayPrice.toFixed(2),
        specTotalPrice: totalPrice.toFixed(2)
      })
    },

    // 数量变化
    handleSpecQuantityChange(this: any, event: any) {
      const quantity = Number(event.detail?.value ?? event.detail) || 1
      const displayPrice = Number(this.data.specDisplayPrice) || 0
      const totalPrice = displayPrice * quantity

      this.setData({
        specQuantity: quantity,
        specTotalPrice: totalPrice.toFixed(2)
      })
    },

    // 加入购物车
    handleAddToCart(this: any) {
      const { selectedProduct, specSelectedSpecs, specQuantity } = this.data
      
      if (!selectedProduct || !selectedProduct.product_id) {
        return
      }

      // 校验必选规格
      const specGroups = selectedProduct.spec_groups || []
      for (const group of specGroups) {
        if (!specSelectedSpecs[group.group_id]) {
          this.showSpecToast(`请选择${group.name}`, 'warning')
          return
        }
      }

      // 构造购物车项
      const cartItem: CartItem = {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.name,
        quantity: specQuantity,
        base_price: Number(selectedProduct.base_price) || 0,
        selected_specs: Object.entries(specSelectedSpecs).map(([groupId, spec]) => {
          const specOption = spec as MenuSpecOption
          return {
            group_id: Number(groupId),
            group_name: this.getGroupNameById(Number(groupId)),
            option_id: specOption.option_id,
            option_name: specOption.name,
            price_modifier: Number(specOption.price_modifier) || 0
          }
        })
      }

      // 添加到购物车
      cartStore.addItem(cartItem)
      this.showSpecToast('已加入购物车', 'success')

      // 延迟关闭弹窗
      setTimeout(() => {
        this.closeSpecPopup()
      }, 1000)
    },

    // 获取规格组名称
    getGroupNameById(this: any, groupId: number): string {
      const { selectedProduct } = this.data
      if (!selectedProduct) return ''
      const group = selectedProduct.spec_groups?.find((item: any) => item.group_id === groupId)
      return group ? group.name : ''
    },

    // 显示规格弹窗提示
    showSpecToast(this: any, message: string, theme: 'success' | 'error' | 'warning' | 'info' = 'info') {
      const iconMap = {
        success: 'success',
        error: 'error',
        warning: 'none',
        info: 'none'
      }
      
      wx.showToast({
        title: message,
        icon: iconMap[theme] as any,
        duration: 1500
      })
    },

    // 下拉刷新
    async onPullDownRefresh(this: any) {
      try {
        await Promise.all([
          shopStore.fetchShopProfile(true),
          shopStore.fetchShopStatus(true),
          menuStore.fetchMenu(true)
        ])
        
        this.setData({
          categories: menuStore.categories
        })
        
        this.updateCurrentProducts()
        this.normalizeDeliveryMode()
        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        })
      } catch (error) {
        wx.showToast({
          title: '刷新失败',
          icon: 'none'
        })
      } finally {
        wx.stopPullDownRefresh()
      }
    },

    // 显示店铺详情弹窗
    async onShowShopDetail(this: any) {
      this.setData({
        shopDetailVisible: true,
        shopDetailLoading: true
      })

      try {
        await shopStore.fetchShopProfile()
        await shopStore.fetchShopStatus()
      } catch (error) {
        console.error('加载店铺详情失败:', error)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.updateShopDetailContent()
        this.setData({
          shopDetailLoading: false
        })
      }
    },

    // 关闭店铺详情弹窗
    closeShopDetail(this: any) {
      this.setData({ shopDetailVisible: false })
    },

    // 店铺详情弹窗可见性变化
    onShopDetailChange(this: any, e: any) {
      this.setData({ shopDetailVisible: e.detail.visible })
    },

    // 导航到店铺
    onNavigateToShop(this: any) {
      const address = shopStore.shopAddress
      const name = shopStore.shopName
      const location = shopStore.location
      
      // 检查是否有地址
      if (!address) {
        wx.showToast({
          title: '店铺地址暂无',
          icon: 'none'
        })
        return
      }

      // 检查是否有经纬度
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        wx.showToast({
          title: '店铺位置信息暂无',
          icon: 'none'
        })
        return
      }

      wx.openLocation({
        latitude: location.lat,
        longitude: location.lng,
        name: name || '清风茶記',
        address: address,
        scale: 15,
        fail: (err) => {
          console.error('打开地图失败:', err)
          wx.showToast({
            title: '打开地图失败',
            icon: 'none'
          })
        }
      })
    },

    // 拨打店铺电话
    onCallShop(this: any) {
      const phone = shopStore.shopPhone
      
      if (!phone) {
        wx.showToast({
          title: '联系电话暂无',
          icon: 'none'
        })
        return
      }

      wx.makePhoneCall({
        phoneNumber: phone,
        fail: (err) => {
          console.error('拨打电话失败:', err)
          wx.showToast({
            title: '拨打电话失败',
            icon: 'none'
          })
        }
      })
    },

    // 切换配送模式
    switchDeliveryMode(this: any, event: any) {
      const { mode } = event.currentTarget.dataset
      if (!mode || mode === this.data.deliveryMode) {
        return
      }
      if ((mode === 'pickup' && !this.data.supportsPickup) || (mode === 'delivery' && !this.data.supportsDelivery)) {
        return
      }
      this.setData({
        deliveryMode: mode
      })
    },

    // 返回首页
    onGoHome() {
      wx.switchTab({
        url: '/pages/index/index',
        fail: (err) => {
          console.error('跳转首页失败:', err)
          wx.showToast({
            title: '暂无法跳转',
            icon: 'none'
          })
        }
      })
    },

    // 搜索入口
    onSearch() {
      wx.showToast({
        title: '搜索功能建设中',
        icon: 'none'
      })
    },

    // 组装弹窗展示数据
    updateShopDetailContent(this: any) {
      const {
        deliveryNotes,
        deliveryRadius,
        supportsPickup,
        supportsDelivery,
        minDeliveryAmount,
        deliveryFee,
        freeDeliveryAmount,
        businessHoursToday
      } = this.data

      const normalizeAmount = (amount?: string | null) => {
        if (!amount) return ''
        const num = Number(amount)
        if (Number.isNaN(num)) return amount
        return num % 1 === 0 ? `${num.toFixed(0)}` : `${num.toFixed(2)}`
      }

      let deliveryInfoLines: Array<{ text: string; highlight?: boolean }> = []

      if (Array.isArray(deliveryNotes) && deliveryNotes.length > 0) {
        deliveryInfoLines = deliveryNotes
          .filter((note) => !!note)
          .map((note) => ({ text: note, highlight: false }))
      }

      if (deliveryInfoLines.length === 0) {
        const radiusText = deliveryRadius || '30km'
        deliveryInfoLines.push({ text: `配送范围：距离店${radiusText}内`, highlight: false })

        const minAmountText = normalizeAmount(minDeliveryAmount)
        if (minAmountText) {
          deliveryInfoLines.push({ text: `满${minAmountText}元起送`, highlight: false })
        }

        const deliveryFeeText = normalizeAmount(deliveryFee)
        if (deliveryFeeText) {
          deliveryInfoLines.push({ text: `配送费：¥${deliveryFeeText}`, highlight: false })
        }

        const freeDeliveryText = normalizeAmount(freeDeliveryAmount)
        if (freeDeliveryText) {
          deliveryInfoLines.push({ text: `满${freeDeliveryText}元免配送费`, highlight: false })
        }

        if (supportsPickup) {
          deliveryInfoLines.push({ text: '支持到店自取', highlight: true })
        } else if (supportsDelivery) {
          deliveryInfoLines.push({ text: '由商户自配送，费用可能受天气及时段影响。', highlight: false })
        }
      }

      if (deliveryInfoLines.length === 0) {
        deliveryInfoLines = [
          { text: '满25起送；', highlight: false },
          { text: '由商户自配送提供配送服务，距离店30km范围内配送，配送费用受天气、时间等因素影响，以实际配送费为准。', highlight: false },
          { text: '支持到店自取', highlight: true }
        ]
      }

      this.normalizeDeliveryMode()
      this.setData({
        deliveryInfoLines,
        businessHoursText: businessHoursToday || this.formatBusinessHoursText()
      })
    },

    // 格式化营业时间展示信息
    formatBusinessHoursText() {
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const todayKey = dayKeys[new Date().getDay()]
      const openHours = shopStore.openHours || {}
      const todayHours = openHours ? openHours[todayKey] : null
      const isOpen = shopStore.isOpen
      const statusText = isOpen ? '营业中' : '休息中'

      if (!todayHours) {
        return statusText
      }

      if (typeof todayHours === 'string' && todayHours.toLowerCase() === 'closed') {
        return '休息中'
      }

      return `${statusText} ${todayHours}`
    },

    normalizeDeliveryMode(this: any) {
      const { supportsDelivery, supportsPickup } = this.data
      let target = this.data.deliveryMode

      if (target === 'delivery' && !supportsDelivery) {
        target = supportsPickup ? 'pickup' : ''
      } else if (target === 'pickup' && !supportsPickup) {
        target = supportsDelivery ? 'delivery' : ''
      }

      if (!target) {
        if (supportsDelivery) {
          target = 'delivery'
        } else if (supportsPickup) {
          target = 'pickup'
        } else {
          target = 'pickup'
        }
      }

      if (target !== this.data.deliveryMode) {
        this.setData({ deliveryMode: target })
      }
    }
  }
})
