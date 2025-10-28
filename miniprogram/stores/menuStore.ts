// stores/menuStore.ts - 菜单数据管理
import { observable, action } from 'mobx-miniprogram'
import { getMenu, MenuCategory, Product } from '../api/menu'

export const menuStore = observable({
  // 状态
  categories: [] as MenuCategory[],
  products: [] as Product[],
  loading: false,
  lastFetchTime: 0,

  // 获取按分类分组的商品
  getProductsByCategory(): Map<number, Product[]> {
    const map = new Map<number, Product[]>()
    this.categories.forEach((cat: MenuCategory) => {
      map.set(cat.id, [])
    })
    this.products.forEach((product: Product) => {
      const list = map.get(product.category_id) || []
      list.push(product)
      map.set(product.category_id, list)
    })
    return map
  },

  // Actions
  fetchMenu: action(async function(this: any, forceRefresh = false) {
    // 缓存 10 分钟
    const now = Date.now()
    if (!forceRefresh && this.lastFetchTime && (now - this.lastFetchTime) < 10 * 60 * 1000) {
      return
    }

    this.loading = true
    try {
      const menuData = await getMenu()
      this.categories = menuData.categories.sort((a, b) => a.sort_order - b.sort_order)
      this.products = menuData.products.sort((a, b) => a.sort_order - b.sort_order)
      this.lastFetchTime = now
    } catch (error) {
      console.error('获取菜单失败:', error)
      throw error
    } finally {
      this.loading = false
    }
  }),

  // 根据ID获取商品
  getProductById: action(function(this: any, productId: number): Product | undefined {
    return this.products.find((p: Product) => p.id === productId)
  })
})
