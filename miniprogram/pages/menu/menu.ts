// pages/menu/menu.ts
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { menuStore, shopStore, cartStore } from '../../stores/index'
import { MenuProduct, MenuCategory, MenuSpecOption, MenuSpecGroup } from '../../api/menu'
import { SOLDOUT_STYLE } from '../../config/index'
import type { CartItem } from '../../stores/cartStore'

type SpecSelectionValue = MenuSpecOption | MenuSpecOption[]

interface SelectedSpecsMap {
  [groupId: number]: SpecSelectionValue | undefined
}

interface SpecGroupBehavior {
  type: 'single' | 'multiple'
  max?: number
  tag?: string
  required?: boolean
}

const GROUP_BEHAVIOR_OVERRIDES: Record<string, SpecGroupBehavior> = {
  温度: { type: 'single', required: true, tag: '必选' },
  冰块: { type: 'single', required: true, tag: '必选' },
  甜度: { type: 'single', required: true, tag: '必选' },
  杯型: { type: 'single', required: true, tag: '必选' },
  浓度: { type: 'single', required: true, tag: '必选' },
  加料: { type: 'multiple', max: 2, required: false, tag: '最多2项' },
  配料: { type: 'multiple', required: false }
}

const MULTIPLE_KEYWORDS = ['加料', '加配', '配料', 'topping', 'addon', 'add-on']

const DEFAULT_SPEC_GROUPS: MenuSpecGroup[] = [
  {
    group_id: -1001,
    name: '温度',
    sort_order: 1,
    options: [
      { option_id: -1101, name: '冰饮', price_modifier: 0, inventory_status: 'available', sort_order: 1 },
      { option_id: -1102, name: '热饮', price_modifier: 0, inventory_status: 'available', sort_order: 2 }
    ]
  },
  {
    group_id: -1002,
    name: '冰块',
    sort_order: 2,
    options: [
      { option_id: -1201, name: '不加冰', price_modifier: 0, inventory_status: 'available', sort_order: 1 },
      { option_id: -1202, name: '少冰', price_modifier: 0, inventory_status: 'available', sort_order: 2 },
      { option_id: -1203, name: '正常冰', price_modifier: 0, inventory_status: 'available', sort_order: 3 },
      { option_id: -1204, name: '多冰', price_modifier: 0, inventory_status: 'available', sort_order: 4 }
    ]
  },
  {
    group_id: -1003,
    name: '甜度',
    sort_order: 3,
    options: [
      { option_id: -1301, name: '不加糖', price_modifier: 0, inventory_status: 'available', sort_order: 1 },
      { option_id: -1302, name: '微糖', price_modifier: 0, inventory_status: 'available', sort_order: 2 },
      { option_id: -1303, name: '少糖', price_modifier: 0, inventory_status: 'available', sort_order: 3 },
      { option_id: -1304, name: '标准糖', price_modifier: 0, inventory_status: 'available', sort_order: 4 }
    ]
  },
  {
    group_id: -1004,
    name: '加料',
    sort_order: 4,
    options: [
      { option_id: -1401, name: '波霸', price_modifier: 2, inventory_status: 'available', sort_order: 1 },
      { option_id: -1402, name: '椰果', price_modifier: 2, inventory_status: 'available', sort_order: 2 },
      { option_id: -1403, name: '仙草', price_modifier: 3, inventory_status: 'available', sort_order: 3 },
      { option_id: -1404, name: '芋圆', price_modifier: 3, inventory_status: 'available', sort_order: 4 }
    ]
  }
]

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
    searchKeyword: '',
    noticeExpanded: false,
    noticeMarquee: { speed: 40, loop: -1 } as any,
    currentNoticeMarquee: { speed: 40, loop: -1 } as any,
    sidebarSkeleton: [1, 1, 1, 1, 1, 1],
    productSkeleton: [
      { type: 'rect', width: '100%', height: '140rpx' },
      [{ width: '60%', height: '28rpx' }, { width: '30%', height: '28rpx' }],
      { width: '70%', height: '28rpx' }
    ],
    
    // 规格选择弹窗
    specPopupVisible: false,
    specPopupLoading: true,
    selectedProduct: {} as MenuProduct,
    specSelectedSpecs: {} as SelectedSpecsMap,
    specSelectedOptionIds: {} as Record<number, string | string[]>,
    specGroupBehaviors: {} as Record<number, SpecGroupBehavior>,
    specGroups: [] as MenuSpecGroup[],
    specQuantity: 1,
    specDisplayPrice: '0.00',
    specTotalPrice: '0.00',
    specPriceBreakdown: '',
    specNote: '',
    productImagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
    specSkeletonRows: [
      [{ width: '30%', height: '28rpx' }, { width: '20%', height: '28rpx' }],
      { width: '100%', height: '80rpx' },
      { width: '100%', height: '80rpx' },
      { width: '100%', height: '80rpx' }
    ],
    
    // 购物车浮层
    cartTotalQuantity: 0,
    cartTotalPriceDisplay: '0.00',
    cartBadgeCount: 0,
    cartHasItems: false,
    cartDeliveryHint: '预计到手价',
    
    // 加载状态
    loading: true
  },

  storeBindings: null as any,
  cartBindings: null as any,

  lifetimes: {
    attached(this: any) {
      this.initStoreBindings()
      this.initCartBindings()
      this.measureNavigationBar()
      this.loadData()
    },

    detached(this: any) {
      if (this.storeBindings) {
        this.storeBindings.destroyStoreBindings()
      }
      if (this.cartBindings) {
        this.cartBindings.destroyStoreBindings()
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

    initCartBindings(this: any) {
      this.cartBindings = createStoreBindings(this, {
        store: cartStore,
        fields: {
          cartTotalQuantity: 'totalQuantity',
          cartTotalPriceDisplay: (store: any) => store.totalPrice.toFixed(2),
          cartBadgeCount: (store: any) => Math.min(store.totalQuantity, 99),
          cartHasItems: (store: any) => store.totalQuantity > 0
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

    updateCartHint(this: any) {
      const { deliveryMode, deliveryFee } = this.data
      let hint = '预计到手价'
      const hasFee = deliveryFee !== undefined && deliveryFee !== null && `${deliveryFee}` !== ''
      if (deliveryMode === 'delivery' && hasFee) {
        hint = `另需配送费¥${deliveryFee}`
      }
      this.setData({ cartDeliveryHint: hint })
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
        this.updateShopDetailContent()
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
      const categoryId = event.detail.value ?? event.detail
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

      this.openSpecPopup(productId)
    },

    // 商品加号点击 - 打开规格选择弹窗
    onProductAdd(this: any, event: any) {
      const { productId } = event.detail
      
      if (!productId) {
        return
      }

      this.openSpecPopup(productId)
    },

    openSpecPopup(this: any, productId: number) {
      const normalizedId = Number(productId)
      if (!normalizedId) {
        return
      }
      const product = menuStore.getProductById(normalizedId)
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

      const normalizedProduct = this.normalizeProductSpecs(product)
      const basePrice = Number(normalizedProduct.base_price) || 0
      const initialState = this.buildInitialSpecState(normalizedProduct)
      const displayPrice = this.calculateDisplayPrice(basePrice, initialState.specSelectedSpecs)
      
      // 先显示弹窗和骨架屏
      this.setData({
        specPopupVisible: true,
        specPopupLoading: true
      })
      
      // 模拟加载延迟，然后显示内容
      setTimeout(() => {
        this.setData({
          specPopupLoading: false,
          selectedProduct: normalizedProduct,
          specGroupBehaviors: initialState.specGroupBehaviors,
          specSelectedSpecs: initialState.specSelectedSpecs,
          specSelectedOptionIds: initialState.specSelectedOptionIds,
          specGroups: initialState.specGroups,
          specQuantity: 1,
          specDisplayPrice: displayPrice.toFixed(2),
          specTotalPrice: displayPrice.toFixed(2),
          specPriceBreakdown: this.buildSpecBreakdown(basePrice, initialState.specSelectedSpecs, displayPrice),
          specNote: ''
        })
      }, 300)
    },

    // 关闭规格选择弹窗
    closeSpecPopup(this: any) {
      this.setData({ 
        specPopupVisible: false,
        specPopupLoading: true,
        selectedProduct: {},
        specSelectedSpecs: {},
        specSelectedOptionIds: {},
        specGroupBehaviors: {},
        specGroups: [],
        specQuantity: 1,
        specDisplayPrice: '0.00',
        specTotalPrice: '0.00',
        specPriceBreakdown: '',
        specNote: ''
      })
    },

    // 规格选择弹窗可见性变化
    onSpecPopupChange(this: any, e: any) {
      if (!e.detail.visible) {
        this.closeSpecPopup()
      }
    },

    handleRadioChange(this: any, event: any) {
      const groupId = Number(event.currentTarget.dataset.groupId)
      const optionId = Number(event.detail?.value)
      if (!groupId || Number.isNaN(optionId)) return

      const option = this.findOptionById(groupId, optionId)
      if (!option) {
        this.showSpecToast('规格不可用', 'warning')
        return
      }

      if (option.inventory_status === 'sold_out') {
        this.showSpecToast('该规格已售罄', 'warning')
        return
      }

      const specSelectedSpecs: SelectedSpecsMap = { ...this.data.specSelectedSpecs }
      const specSelectedOptionIds = { ...this.data.specSelectedOptionIds, [groupId]: String(optionId) }
      specSelectedSpecs[groupId] = option
      this.commitSpecSelectionState(specSelectedSpecs, specSelectedOptionIds)
    },

    // 统一的规格选项点击处理
    onSpecOptionTap(this: any, event: any) {
      const { groupId, optionId } = event.currentTarget.dataset
      if (!groupId || !optionId) return
      
      const gid = Number(groupId)
      const oid = Number(optionId)
      const behavior = this.data.specGroupBehaviors[gid]
      
      if (!behavior) return
      
      const option = this.findOptionById(gid, oid)
      if (!option || option.inventory_status === 'sold_out') {
        return
      }
      
      const specSelectedSpecs: SelectedSpecsMap = { ...this.data.specSelectedSpecs }
      let specSelectedOptionIds = { ...this.data.specSelectedOptionIds }
      
      if (behavior.type === 'single') {
        // 单选逻辑
        specSelectedSpecs[gid] = option
        specSelectedOptionIds[gid] = String(oid)
      } else {
        // 多选逻辑
        let currentSelection = (specSelectedSpecs[gid] || []) as MenuSpecOption[]
        const index = currentSelection.findIndex((opt: MenuSpecOption) => opt.option_id === oid)
        
        if (index > -1) {
          currentSelection = currentSelection.filter((opt: MenuSpecOption) => opt.option_id !== oid)
        } else {
          const maxCount = behavior?.max || 999
          if (currentSelection.length >= maxCount) {
            wx.showToast({ title: `最多选择${maxCount}项`, icon: 'none' })
            return
          }
          currentSelection = [...currentSelection, option]
        }
        
        specSelectedSpecs[gid] = currentSelection
        specSelectedOptionIds[gid] = currentSelection.map((opt: MenuSpecOption) => String(opt.option_id))
      }
      
      // 更新specGroups，添加_selected标记
      const specGroups = this.data.specGroups.map((g: MenuSpecGroup) => {
        if (g.group_id !== gid) return g
        return {
          ...g,
          options: g.options.map((opt: MenuSpecOption) => ({
            ...opt,
            _selected: behavior.type === 'single' 
              ? opt.option_id === oid
              : specSelectedOptionIds[gid].includes(String(opt.option_id))
          }))
        }
      })
      
      this.setData({ specGroups })
      this.commitSpecSelectionState(specSelectedSpecs, specSelectedOptionIds)
    },

    handleCheckboxChange(this: any, event: any) {
      const groupId = Number(event.currentTarget.dataset.groupId)
      if (!groupId) return
      const behavior = this.data.specGroupBehaviors[groupId]
      let valueList = (event.detail?.value || [])
        .map((id: string | number) => Number(id))
        .filter((id: number) => !Number.isNaN(id))

      if (behavior?.max && behavior.max > 0 && valueList.length > behavior.max) {
        valueList = valueList.slice(0, behavior.max)
        this.showSpecToast(`最多可选${behavior.max}项`, 'warning')
      }

      const group = this.getSpecGroupById(groupId)
      if (!group) return
      const options = this.getGroupOptions(group)
      const selectedOptions = options.filter((option: MenuSpecOption) => valueList.includes(option.option_id))

      const specSelectedSpecs: SelectedSpecsMap = { ...this.data.specSelectedSpecs }
      specSelectedSpecs[groupId] = selectedOptions
      const specSelectedOptionIds = { ...this.data.specSelectedOptionIds, [groupId]: valueList.map((id: number) => String(id)) }
      this.commitSpecSelectionState(specSelectedSpecs, specSelectedOptionIds)
    },

    commitSpecSelectionState(
      this: any,
      specSelectedSpecs: SelectedSpecsMap,
      specSelectedOptionIds: Record<number, string | string[]>
    ) {
      const { selectedProduct, specQuantity } = this.data
      const basePrice = Number(selectedProduct?.base_price) || 0
      const displayPrice = this.calculateDisplayPrice(basePrice, specSelectedSpecs)
      const totalPrice = displayPrice * specQuantity
      this.setData({
        specSelectedSpecs,
        specSelectedOptionIds,
        specDisplayPrice: displayPrice.toFixed(2),
        specTotalPrice: totalPrice.toFixed(2),
        specPriceBreakdown: this.buildSpecBreakdown(basePrice, specSelectedSpecs, displayPrice)
      })
    },

    calculateDisplayPrice(this: any, basePrice: number, specSelectedSpecs: SelectedSpecsMap): number {
      const specsTotal = this.flattenSelectedSpecs(specSelectedSpecs).reduce((sum: number, spec: MenuSpecOption) => {
        return sum + (Number(spec?.price_modifier) || 0)
      }, 0)
      return basePrice + specsTotal
    },

    flattenSelectedSpecs(this: any, specSelectedSpecs: SelectedSpecsMap): MenuSpecOption[] {
      const list: MenuSpecOption[] = []
      Object.values(specSelectedSpecs || {}).forEach((selection) => {
        if (!selection) return
        if (Array.isArray(selection)) {
          selection.forEach((option) => option && list.push(option))
        } else if (selection) {
          list.push(selection)
        }
      })
      return list
    },

    buildInitialSpecState(this: any, product: MenuProduct) {
      const specGroupBehaviors: Record<number, SpecGroupBehavior> = {}
      const specSelectedSpecs: SelectedSpecsMap = {}
      const specSelectedOptionIds: Record<number, string | string[]> = {}

      const specGroups = this.getSpecGroups(product).map((group: MenuSpecGroup) => {
        const behavior = this.resolveGroupBehavior(group.name)
        specGroupBehaviors[group.group_id] = behavior

        let defaultSelectedId: string | null = null
        
        if (behavior.type === 'single') {
          const options = this.getGroupOptions(group)
          const defaultOption =
            options.find((option: MenuSpecOption) => option.inventory_status !== 'sold_out') || options[0]
          if (defaultOption) {
            specSelectedSpecs[group.group_id] = defaultOption
            specSelectedOptionIds[group.group_id] = String(defaultOption.option_id)
            defaultSelectedId = String(defaultOption.option_id)
          } else {
            specSelectedOptionIds[group.group_id] = ''
          }
        } else {
          specSelectedSpecs[group.group_id] = []
          specSelectedOptionIds[group.group_id] = []
        }
        
        // 添加 _selected 标记
        return {
          ...group,
          options: group.options.map((opt: MenuSpecOption) => ({
            ...opt,
            _selected: defaultSelectedId ? opt.option_id === Number(defaultSelectedId) : false
          }))
        }
      })

      return {
        specGroupBehaviors,
        specSelectedSpecs,
        specSelectedOptionIds,
        specGroups
      }
    },

    resolveGroupBehavior(this: any, name?: string): SpecGroupBehavior {
      const key = (name || '').trim()
      if (key && GROUP_BEHAVIOR_OVERRIDES[key]) {
        return { ...GROUP_BEHAVIOR_OVERRIDES[key] }
      }
      const lower = key.toLowerCase()
      if (MULTIPLE_KEYWORDS.some((kw) => lower.includes(kw))) {
        return { type: 'multiple', required: false }
      }
      return { type: 'single', required: true, tag: '必选' }
    },

    findOptionById(this: any, groupId: number, optionId: number): MenuSpecOption | undefined {
      const group = this.getSpecGroupById(groupId)
      if (!group) return undefined
      const options = this.getGroupOptions(group)
      return options.find((option: MenuSpecOption) => option.option_id === optionId)
    },

    getSpecGroupById(this: any, groupId: number) {
      const groups = this.getSpecGroups()
      return groups.find((group: any) => group.group_id === groupId)
    },

    normalizeProductSpecs(this: any, product: MenuProduct): MenuProduct {
      const rawGroups = this.getSpecGroups(product)
      const normalizedGroups = (rawGroups.length > 0 ? rawGroups : this.buildDefaultSpecGroups()).map((group: any) => ({
        ...group,
        options: this.getGroupOptions(group)
      }))
      return {
        ...product,
        spec_groups: normalizedGroups
      }
    },

    getSpecGroups(this: any, product?: MenuProduct): MenuSpecGroup[] {
      if (product && Array.isArray(product.spec_groups)) {
        return product.spec_groups
      }
      if (Array.isArray(this.data.specGroups) && this.data.specGroups.length > 0) {
        return this.data.specGroups
      }
      const target = product || this.data.selectedProduct
      if (!target) return []
      return Array.isArray(target.spec_groups) ? target.spec_groups : []
    },

    getGroupOptions(this: any, group: MenuSpecGroup): MenuSpecOption[] {
      if (!group) return []
      return Array.isArray(group.options) ? group.options : []
    },

    buildDefaultSpecGroups() {
      return DEFAULT_SPEC_GROUPS.map((group) => ({
        ...group,
        options: group.options.map((option) => ({ ...option }))
      }))
    },

    buildSpecBreakdown(this: any, basePrice: number, specSelectedSpecs: SelectedSpecsMap, displayPrice: number) {
      const parts: string[] = [`¥${basePrice.toFixed(2)} 面价`]
      this.flattenSelectedSpecs(specSelectedSpecs).forEach((spec: MenuSpecOption) => {
        if (!spec) return
        const modifier = Number(spec.price_modifier) || 0
        const absValue = Math.abs(modifier).toFixed(2)
        if (modifier === 0) {
          parts.push(`${spec.name}¥0.00`)
        } else {
          const sign = modifier > 0 ? '+' : '-'
          parts.push(`${spec.name}${sign}¥${absValue}`)
        }
      })
      return `${parts.join(' + ')} = ¥${displayPrice.toFixed(2)}`
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

    handleSpecNoteChange(this: any, event: any) {
      const note = event?.detail?.value || ''
      this.setData({
        specNote: note.slice(0, 30)
      })
    },

    // 加入购物车
    handleAddToCart(this: any) {
      const { selectedProduct, specSelectedSpecs, specQuantity, specGroupBehaviors } = this.data
      
      if (!selectedProduct || !selectedProduct.product_id) {
        return
      }

      // 校验必选规格
      const specGroups = this.getSpecGroups(selectedProduct)
      for (const group of specGroups) {
        const selection = specSelectedSpecs[group.group_id]
        const behavior = specGroupBehaviors[group.group_id]
        const isRequired = behavior ? behavior.required !== false : true
        if (!isRequired) {
          continue
        }
        if (Array.isArray(selection)) {
          if (!selection || selection.length === 0) {
            this.showSpecToast(`请选择${group.name}`, 'warning')
            return
          }
        } else if (!selection) {
          this.showSpecToast(`请选择${group.name}`, 'warning')
          return
        }
      }

      const flattenSelected = Object.entries(specSelectedSpecs).reduce((acc, [groupIdStr, selection]) => {
        if (!selection) return acc
        const groupId = Number(groupIdStr)
        const selectionList = Array.isArray(selection) ? selection : [selection]
        selectionList.forEach((specOption) => {
          if (!specOption) return
          acc.push({
            group_id: groupId,
            group_name: this.getGroupNameById(groupId),
            option_id: specOption.option_id,
            option_name: specOption.name,
            price_modifier: Number(specOption.price_modifier) || 0
          })
        })
        return acc
      }, [] as CartItem['selected_specs'])

      // 构造购物车项
      const cartItem: CartItem = {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.name,
        quantity: specQuantity,
        base_price: Number(selectedProduct.base_price) || 0,
        selected_specs: flattenSelected
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
        this.updateShopDetailContent()
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
    handleServiceTypeChange(this: any, event: any) {
      const mode = event?.detail?.value
      this.updateDeliveryMode(mode)
    },

    switchDeliveryMode(this: any, event: any) {
      const { mode } = event.currentTarget.dataset
      this.updateDeliveryMode(mode)
    },

    updateDeliveryMode(this: any, rawMode?: string) {
      const { supportsPickup, supportsDelivery } = this.data
      let target = rawMode || this.data.deliveryMode

      if (target === 'delivery' && !supportsDelivery) {
        target = supportsPickup ? 'pickup' : ''
      } else if (target === 'pickup' && !supportsPickup) {
        target = supportsDelivery ? 'delivery' : ''
      }

      if (!target) {
        target = supportsPickup ? 'pickup' : supportsDelivery ? 'delivery' : ''
      }

      if (target && target !== this.data.deliveryMode) {
        this.setData({ deliveryMode: target }, () => this.updateCartHint())
      } else {
        this.updateCartHint()
      }
    },

    // 返回上一页
    onGoBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 })
        return
      }
      this.onGoHome()
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

    handleSearchChange(this: any, event: any) {
      this.setData({
        searchKeyword: event?.detail?.value || ''
      })
    },

    handleSearchFocus() {
      this.openSearchPlaceholder()
    },

    handleSearchClear(this: any) {
      this.setData({ searchKeyword: '' })
    },

    handleSearchConfirm(this: any, event: any) {
      this.setData({
        searchKeyword: event?.detail?.value || this.data.searchKeyword
      })
      this.openSearchPlaceholder()
    },

    openSearchPlaceholder() {
      wx.showToast({
        title: '搜索功能建设中',
        icon: 'none'
      })
    },

    toggleNotice(this: any) {
      const { noticeExpanded, noticeMarquee } = this.data
      const nextExpanded = !noticeExpanded
      this.setData({
        noticeExpanded: nextExpanded,
        currentNoticeMarquee: nextExpanded ? false : noticeMarquee
      })
    },

    handleCartPreview(this: any) {
      if (!this.data.cartHasItems) {
        wx.showToast({
          title: '还没选商品',
          icon: 'none'
        })
        return
      }
      wx.showToast({
        title: '购物车弹层建设中',
        icon: 'none'
      })
    },

    goCheckout(this: any) {
      if (!this.data.cartHasItems) {
        wx.showToast({
          title: '请先选择商品',
          icon: 'none'
        })
        return
      }
      wx.navigateTo({
        url: '/pages/order-list/order-list',
        fail: () => {
          wx.showToast({
            title: '暂无法跳转',
            icon: 'none'
          })
        }
      })
    },

    handleBuyNow(this: any) {
      wx.showToast({
        title: '立即购买流程建设中',
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

      this.setData({
        deliveryInfoLines,
        businessHoursText: businessHoursToday || this.formatBusinessHoursText()
      }, () => {
        this.updateCartHint()
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
      this.updateDeliveryMode(this.data.deliveryMode)
    }
  }
})
