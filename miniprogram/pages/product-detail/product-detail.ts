// pages/product-detail/product-detail.ts
import Toast from 'tdesign-miniprogram/toast/index'
import { menuStore, cartStore } from '../../stores/index'
import { MenuProduct, MenuSpecOption } from '../../api/menu'
import { addWant } from '../../api/want'
import type { CartItem } from '../../stores/cartStore'

interface SelectedSpecsMap {
  [groupId: number]: MenuSpecOption
}

Page({
  data: {
    product: null as MenuProduct | null,
    loading: true,
    selectedSpecs: {} as SelectedSpecsMap,
    quantity: 1,
    displayPrice: 0,
    isSoldOut: false,
    productSkeletonRows: [
      { type: 'rect', width: '100%', height: '360rpx', margin: '0 0 32rpx 0' },
      { type: 'text', width: '60%', height: '40rpx', margin: '0 0 16rpx 0' },
      { type: 'text', width: '80%', height: '32rpx', margin: '0 0 24rpx 0' },
      { type: 'text', width: '70%', height: '28rpx' }
    ]
  },

  showToast(message: string, theme: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 1500) {
    Toast({
      context: this,
      selector: '#product-toast',
      message,
      theme,
      duration
    })
  },

  onLoad(options: { id: string }) {
    const productId = Number(options.id)
    if (!productId) {
      this.showToast('商品 ID 无效', 'error')
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.loadProductDetail(productId)
  },

  async loadProductDetail(productId: number) {
    try {
      this.setData({ loading: true })
      await menuStore.fetchMenu()

      const product = menuStore.getProductById(productId)
      if (!product) {
        this.showToast('商品不存在', 'error')
        setTimeout(() => wx.navigateBack(), 1500)
        return
      }

      const basePrice = Number(product.base_price) || 0
      this.setData({
        product,
        isSoldOut: product.inventory_status === 'sold_out',
        displayPrice: basePrice,
        selectedSpecs: {},
        quantity: 1,
        loading: false
      })
    } catch (error) {
      console.error('加载商品详情失败:', error)
      this.showToast('加载失败，请重试', 'error')
      this.setData({ loading: false })
    }
  },

  handleSelectSpec(event: WechatMiniprogram.CustomEvent) {
    const { groupId, option } = event.currentTarget.dataset as {
      groupId: number
      option: MenuSpecOption
    }

    if (option.inventory_status === 'sold_out') {
      this.showToast('该规格已售罄', 'warning')
      return
    }

    const selectedSpecs: SelectedSpecsMap = { ...this.data.selectedSpecs }
    if (selectedSpecs[groupId]?.option_id === option.option_id) {
      delete selectedSpecs[groupId]
    } else {
      selectedSpecs[groupId] = option
    }

    const displayPrice = this.calculatePrice(selectedSpecs)
    this.setData({ selectedSpecs, displayPrice })
  },

  calculatePrice(selectedSpecs: SelectedSpecsMap): number {
    const { product } = this.data
    if (!product) return 0

    const basePrice = Number(product.base_price) || 0
    const specsTotal = Object.values(selectedSpecs).reduce((sum, spec) => {
      return sum + (Number(spec.price_modifier) || 0)
    }, 0)

    return basePrice + specsTotal
  },

  handleQuantityChange(event: WechatMiniprogram.CustomEvent) {
    const quantity = Number(event.detail?.value ?? event.detail) || 1
    this.setData({ quantity })
  },

  handleAddToCart() {
    const { product, selectedSpecs, quantity, isSoldOut } = this.data
    if (!product) return

    if (isSoldOut) {
      this.showToast('商品已售罄', 'warning')
      return
    }

    const specGroups = product.spec_groups || []
    for (const group of specGroups) {
      if (!selectedSpecs[group.group_id]) {
        this.showToast(`请选择${group.name}`, 'warning')
        return
      }
    }

    const cartItem: CartItem = {
      product_id: product.product_id,
      product_name: product.name,
      quantity,
      base_price: Number(product.base_price) || 0,
      selected_specs: Object.entries(selectedSpecs).map(([groupId, spec]) => ({
        group_id: Number(groupId),
        group_name: this.getGroupNameById(Number(groupId)),
        option_id: spec.option_id,
        option_name: spec.name,
        price_modifier: Number(spec.price_modifier) || 0
      }))
    }

    cartStore.addItem(cartItem)
    this.showToast('已加入购物车', 'success')

    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  getGroupNameById(groupId: number): string {
    const { product } = this.data
    if (!product) return ''
    const group = product.spec_groups?.find(item => item.group_id === groupId)
    return group ? group.name : ''
  },

  getGroupNameByOptionId(optionId: number): string {
    const { product } = this.data
    if (!product) return ''
    for (const group of product.spec_groups || []) {
      const option = group.options.find(item => item.option_id === optionId)
      if (option) {
        return group.name
      }
    }
    return ''
  },

  async handleWant() {
    const { product } = this.data
    if (!product) return

    try {
      await addWant(product.product_id)
      this.showToast('已记录，到货后将通知您', 'success')
    } catch (error: any) {
      console.error('记录想要失败:', error)
      if (error?.code === 401 || error?.statusCode === 401) {
        wx.showModal({
          title: '提示',
          content: '此功能需要登录，是否前往登录？',
          success(res) {
            if (res.confirm) {
              wx.switchTab({ url: '/pages/profile/profile' })
            }
          }
        })
      } else {
        this.showToast(error?.message || '操作失败', 'error')
      }
    }
  }
})

