// stores/cartStore.ts - 购物车状态管理
import { observable, action } from 'mobx-miniprogram'
import { getStorage, setStorage } from '../utils/storage'

/**
 * 购物车商品项目
 */
export interface CartItem {
  product_id: number
  product_name: string
  quantity: number
  base_price: number
  selected_specs: Array<{
    group_id: number
    group_name: string
    option_id: number
    option_name: string
    price_modifier: number
  }>
}

// 本地存储 key
const GUEST_CART_KEY = 'guest_cart'
const USER_CART_PREFIX = 'user_cart_'

/**
 * 加载购物车数据
 */
function loadCart(userId?: number): CartItem[] {
  try {
    const key = userId ? `${USER_CART_PREFIX}${userId}` : GUEST_CART_KEY
    return getStorage<CartItem[]>(key) || []
  } catch (err) {
    console.error('加载购物车失败:', err)
    return []
  }
}

/**
 * 保存购物车数据
 */
function saveCart(items: CartItem[], userId?: number): void {
  try {
    const key = userId ? `${USER_CART_PREFIX}${userId}` : GUEST_CART_KEY
    setStorage(key, items)
  } catch (err) {
    console.error('保存购物车失败:', err)
  }
}

/**
 * 计算单个商品的总价 (基础价格 + 所有规格加价)
 */
function calculateItemPrice(item: CartItem): number {
  const specsTotal = item.selected_specs.reduce(
    (sum, spec) => sum + spec.price_modifier,
    0
  )
  return (item.base_price + specsTotal) * item.quantity
}

/**
 * 生成购物车项的唯一标识
 * 用于判断相同商品+规格的项目
 */
function generateItemKey(item: CartItem): string {
  const specIds = item.selected_specs
    .map(s => s.option_id)
    .sort((a, b) => a - b)
    .join('-')
  return `${item.product_id}_${specIds}`
}

/**
 * 购物车状态管理
 */
export const cartStore = observable({
  // 状态
  items: [] as CartItem[],
  currentUserId: undefined as number | undefined,

  // 计算属性 - 总数量
  get totalQuantity(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0)
  },

  // 计算属性 - 总金额
  get totalPrice(): number {
    return this.items.reduce((sum, item) => sum + calculateItemPrice(item), 0)
  },

  // Actions

  /**
   * 初始化购物车 (从本地存储加载)
   */
  init: action(function(this: any, userId?: number) {
    this.currentUserId = userId
    this.items = loadCart(userId)
  }),

  /**
   * 添加商品到购物车
   * 如果相同商品+规格已存在，则累加数量
   */
  addItem: action(function(this: any, item: CartItem) {
    const itemKey = generateItemKey(item)
    const existingIndex = this.items.findIndex(
      (i: CartItem) => generateItemKey(i) === itemKey
    )

    if (existingIndex > -1) {
      // 已存在，累加数量
      this.items[existingIndex].quantity += item.quantity
    } else {
      // 新增
      this.items.push(item)
    }

    saveCart(this.items, this.currentUserId)
  }),

  /**
   * 移除购物车项目
   */
  removeItem: action(function(this: any, productId: number, specOptionIds: number[]) {
    const itemKey = `${productId}_${specOptionIds.sort((a, b) => a - b).join('-')}`
    this.items = this.items.filter((item: CartItem) => generateItemKey(item) !== itemKey)
    saveCart(this.items, this.currentUserId)
  }),

  /**
   * 更新商品数量
   */
  updateQuantity: action(function(
    this: any,
    productId: number,
    specOptionIds: number[],
    quantity: number
  ) {
    if (quantity <= 0) {
      this.removeItem(productId, specOptionIds)
      return
    }

    const itemKey = `${productId}_${specOptionIds.sort((a, b) => a - b).join('-')}`
    const item = this.items.find((i: CartItem) => generateItemKey(i) === itemKey)
    if (item) {
      item.quantity = quantity
      saveCart(this.items, this.currentUserId)
    }
  }),

  /**
   * 清空购物车
   */
  clearAll: action(function(this: any) {
    this.items = []
    saveCart(this.items, this.currentUserId)
  }),

  /**
   * 切换用户 (登录后合并购物车)
   */
  switchUser: action(function(this: any, userId: number) {
    // 加载游客购物车
    const guestCart = loadCart()
    // 加载用户购物车
    const userCart = loadCart(userId)

    // 合并购物车 (游客购物车优先)
    const mergedItems = [...userCart]
    guestCart.forEach((guestItem: CartItem) => {
      const itemKey = generateItemKey(guestItem)
      const existingIndex = mergedItems.findIndex(
        (i: CartItem) => generateItemKey(i) === itemKey
      )
      if (existingIndex > -1) {
        // 累加数量
        mergedItems[existingIndex].quantity += guestItem.quantity
      } else {
        // 新增
        mergedItems.push(guestItem)
      }
    })

    // 更新状态
    this.currentUserId = userId
    this.items = mergedItems

    // 保存到用户购物车
    saveCart(this.items, userId)

    // 清空游客购物车
    try {
      wx.removeStorageSync(GUEST_CART_KEY)
    } catch (err) {
      console.error('清空游客购物车失败:', err)
    }
  })
})
