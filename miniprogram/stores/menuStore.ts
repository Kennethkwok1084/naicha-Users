// stores/menuStore.ts - 菜单数据管理
import { observable, action } from 'mobx-miniprogram'
import { getMenu, MenuCategory, MenuProduct } from '../api/menu'
import { CACHE_EXPIRE_TIME } from '../config/index'

export const menuStore = observable({
  // 状态
  categories: [] as MenuCategory[],
  uncategorizedProducts: [] as MenuProduct[],
  multiCategoryEnabled: false,
  loading: false,
  lastFetchTime: 0,

  // 获取所有商品(展平)
  getAllProducts(): MenuProduct[] {
    const products: MenuProduct[] = []
    this.categories.forEach((cat: MenuCategory) => {
      products.push(...cat.products)
    })
    products.push(...this.uncategorizedProducts)
    return products
  },

  // 根据分类ID获取商品
  getProductsByCategoryId(categoryId: number): MenuProduct[] {
    const category = this.categories.find((c: MenuCategory) => c.category_id === categoryId)
    return category ? category.products : []
  },

  // Actions
  fetchMenu: action(async function(this: any, forceRefresh = false) {
    // 使用配置的缓存时间
    const now = Date.now()
    if (!forceRefresh && this.lastFetchTime && (now - this.lastFetchTime) < CACHE_EXPIRE_TIME.menu) {
      return
    }

    this.loading = true
    try {
      const menuData = await getMenu()
      this.categories = menuData.categories.sort((a, b) => a.sort_order - b.sort_order)
      this.uncategorizedProducts = menuData.uncategorized_products
      this.multiCategoryEnabled = menuData.multi_category_enabled
      this.lastFetchTime = now
    } catch (error) {
      console.error('获取菜单失败:', error)
      throw error
    } finally {
      this.loading = false
    }
  }),

  // 根据ID获取商品
  getProductById: action(function(this: any, productId: number): MenuProduct | undefined {
    const allProducts = this.getAllProducts()
    return allProducts.find((p: MenuProduct) => p.product_id === productId)
  })
})
