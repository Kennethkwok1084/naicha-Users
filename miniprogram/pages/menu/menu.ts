// pages/menu/menu.ts
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { menuStore, shopStore } from '../../stores/index'
import { MenuProduct, MenuCategory } from '../../api/menu'
import { SOLDOUT_STYLE } from '../../config/index'

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
    
    // 加载状态
    loading: true
  },

  storeBindings: null as any,

  lifetimes: {
    attached(this: any) {
      this.initStoreBindings()
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
    }
  },

  methods: {
    // 初始化 Store 绑定
    initStoreBindings(this: any) {
      this.storeBindings = createStoreBindings(this, {
        store: shopStore,
        fields: {
          shopIsOpen: 'isOpen'
        },
        actions: []
      })
    },

    // 加载数据
    async loadData(this: any) {
      this.setData({ loading: true })

      try {
        // 并行加载店铺状态和菜单数据
        await Promise.all([
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
      const { productid } = event.detail
      
      if (!productid) {
        return
      }

      // TODO: 跳转到商品详情页 (M2)
      wx.navigateTo({
        url: `/pages/product-detail/product-detail?id=${productid}`
      })
    },

    // 下拉刷新
    async onPullDownRefresh(this: any) {
      try {
        await Promise.all([
          shopStore.fetchShopStatus(true),
          menuStore.fetchMenu(true)
        ])
        
        this.setData({
          categories: menuStore.categories
        })
        
        this.updateCurrentProducts()
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
    }
  }
})

