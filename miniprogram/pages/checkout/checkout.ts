import { createPageWithAnalytics } from '../../utils/page-analytics';
import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { cartStore } from '../../stores/cartStore';
import { shopStore } from '../../stores/shopStore';
import { userStore } from '../../stores/index';
import { calculateOrderPrice, createOrder, OrderRequestPayload } from '../../api/order';
import { bindPhoneNumber } from '../../api/user';
import { createGuestSession } from '../../api/guest';
import { getStorage } from '../../utils/storage';
import Toast from 'tdesign-miniprogram/toast/index';

createPageWithAnalytics({
  data: {
    deliveryType: 'pickup',
    address: null as any,
    notes: '',
    tempNotes: '',
    notesDialogVisible: false,
    couponText: '暂无可用',
    deliveryFee: '0.00' as any,
    discountAmount: '0.00' as any,
    finalPrice: '0.00' as any,
    submitting: false,
    cartItems: [] as any[],
    estimatedPickupTime: '10分钟',
    items: [] as any[],
    totalPrice: '0.00' as any,
    totalCount: 0,
    shopInfo: null as any,
    shopId: 1,
    userInfo: null as any,
    token: null as any,
    // 布局相关
    navbarHeight: 0,
    bottomBarHeight: 0,
    agreementHeight: 0,
    pagePaddingBottom: 0,
    agreementPaddingBottom: 0,
    safeAreaBottom: 0,
    // 交互数据
    userPhone: '',
    diningType: 'dine-in',
    savedAmount: 0,
    timePickerVisible: false,
    timePickerValue: [] as any[],
    pickupTimeOptions: [
      ['今天', '明天'],
      ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'],
    ],
    agreementChecked: false,
    priceLoading: false,
    phoneBinding: false,
  },

  cartBindings: null as any,
  shopBindings: null as any,
  userBindings: null as any,
  rpxRatio: 2,

  onLoad() {
    console.log('=== 结算页 onLoad ===');
    
    // 🔥 关键：先初始化购物车 store，从本地存储加载数据
    cartStore.init();
    console.log('cartStore 初始化后 - items:', cartStore.items.length, '件商品');
    
    // 初始化 store 绑定
    this.initStoreBindings();
    
    // 立即初始化数据显示
    this.initData();
    this.calculateLayoutHeights();
    
    // 等待绑定生效后强制刷新
    setTimeout(() => {
      console.log('购物车绑定状态 - items:', this.data.items?.length || 0);
      console.log('购物车绑定状态 - totalPrice:', this.data.totalPrice);
      
      // 强制更新显示和计算价格
      this.updateCartDisplay();
      this.calculatePrice();
      
      // 延迟检查登录（避免Toast阻塞渲染）
      setTimeout(() => {
        this.checkLogin();
      }, 100);
    }, 50);
  },

  onReady() {
    this.measureLayout();
  },

  onUnload() {
    if (this.cartBindings) {
      this.cartBindings.destroyStoreBindings();
    }
    if (this.shopBindings) {
      this.shopBindings.destroyStoreBindings();
    }
    if (this.userBindings) {
      this.userBindings.destroyStoreBindings();
    }
  },

  initStoreBindings() {
    this.cartBindings = createStoreBindings(this, {
      store: cartStore,
      fields: {
        items: 'items',
        totalPrice: 'totalPrice',
        totalCount: 'totalQuantity',
      },
      actions: {
        clearCart: 'clearAll',
      },
    });

    this.shopBindings = createStoreBindings(this, {
      store: shopStore,
      fields: {
        shopInfo: (store: any) => ({
          name: store.shopName,
          address: store.shopAddress,
          phone: store.shopPhone,
          id: store.id || 1,
        }),
        shopId: (store: any) => store.id || 1,
      },
      actions: [],
    });

    this.userBindings = createStoreBindings(this, {
      store: userStore,
      fields: ['userInfo', 'token'],
      actions: [],
    });
  },

  checkLogin() {
    if (!this.data.token) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先登录',
        theme: 'warning',
      });
    }
  },

  initData() {
    this.updateCartDisplay();
  },

  onShow() {
    console.log('=== 结算页 onShow ===');
    console.log('购物车当前状态 - items:', this.data.items);
    console.log('购物车当前状态 - totalPrice:', this.data.totalPrice);
    this.calculatePrice();
  },

  updateCartDisplay() {
    const items = this.data.items || [];
    console.log('购物车商品数量:', items.length, '商品详情:', items);
    const cartItems = items.map((item: any) => {
      const basePrice = item.base_price || 0;
      const specsPrice = (item.selected_specs || []).reduce((sum: number, spec: any) => sum + (spec.price_modifier || 0), 0);
      const itemTotalPrice = basePrice + specsPrice;
      
      return {
        ...item,
        name: item.product_name || '未知商品',
        price: itemTotalPrice.toFixed(2),
        image: item.image || 'https://tdesign.gtimg.com/mobile/demos/example1.png',
        specs: (item.selected_specs || []).map((s: any) => s.option_name).join('/') || '默认',
      };
    });
    this.setData({ cartItems });
  },

  onDeliveryTypeChange(e: any) {
    const value = e?.detail?.value || e?.currentTarget?.dataset?.value || 'pickup';
    this.setData({ deliveryType: value }, () => {
      this.calculatePrice();
    });
  },

  async onChooseAddress() {
    try {
      const res = await wx.chooseLocation({});
      console.log('Selected address:', res);
      this.setData({
        address: {
          address: res.address,
          detail: res.name,
          name: this.data.userInfo?.nickName || '用户',
          phone: '13800000000',
          lat: res.latitude,
          lng: res.longitude,
        },
      });
      this.calculatePrice();
    } catch (err) {
      console.error('Choose location failed', err);
    }
  },

  onEditNotes() {
    this.setData({
      notesDialogVisible: true,
      tempNotes: this.data.notes,
    });
  },

  onNotesChange(e: any) {
    this.setData({ tempNotes: e.detail.value });
  },

  onConfirmNotes() {
    this.setData({
      notes: this.data.tempNotes,
      notesDialogVisible: false,
    });
  },

  onCancelNotes() {
    this.setData({ notesDialogVisible: false });
  },

  onSelectCoupon() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '优惠券功能开发中',
    });
  },

  onAgreementChange() {
    this.setData({ agreementChecked: !this.data.agreementChecked });
  },

  onViewAgreement() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '协议详情暂未接入',
    });
  },

  async calculatePrice() {
    // 优先使用 store 中的最新数据，避免绑定延迟导致 items 为空
    const storeItems = cartStore.items || [];
    const dataItems = this.data.items || [];
    const items = storeItems.length ? storeItems : dataItems;
    const { deliveryType, address } = this.data;

    if (items.length && (!dataItems.length || dataItems.length !== items.length)) {
      // 同步一次 data.items，便于渲染
      this.setData({ items }, () => this.updateCartDisplay());
    } else {
      this.updateCartDisplay();
    }

    console.log('计算价格，商品数量:', items.length);
    if (!items.length) {
      this.setData({
        totalPrice: '0.00',
        deliveryFee: '0.00',
        discountAmount: '0.00',
        finalPrice: '0.00',
        savedAmount: '0.00',
      });
      return;
    }

    if (deliveryType === 'delivery' && !address) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择收货地址',
        theme: 'warning',
      });
      return;
    }

    // 先用本地计算给出兜底值，避免闪 0
    const localTotals = this.calculateLocalTotals(items, deliveryType);
    this.setData({
      totalPrice: localTotals.totalPrice,
      deliveryFee: localTotals.deliveryFee,
      discountAmount: '0.00',
      finalPrice: localTotals.finalPrice,
      savedAmount: '0.00',
    });

    await this.ensureGuestSession();
    const payload = this.buildOrderPayload(items);
    this.setData({ priceLoading: true });

    try {
      const res = await calculateOrderPrice(payload);
      const priceData: any = (res as any)?.data || res;
      console.log('价格试算响应:', priceData);
      if (!priceData) {
        throw new Error('空响应');
      }
      const subtotal = Number(priceData.subtotal || 0);
      const deliveryFee = Number(priceData.delivery_fee || 0);
      const couponDiscount = Number(priceData.coupon_discount || 0);
      const pointsDiscount = Number(priceData.points_discount || 0);
      const finalAmount = Number(priceData.final_amount || 0);
      const saved = couponDiscount + pointsDiscount;

      this.setData({
        totalPrice: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        discountAmount: saved.toFixed(2),
        finalPrice: finalAmount.toFixed(2),
        savedAmount: saved.toFixed(2),
      }, () => {
        this.measureLayout();
      });
    } catch (err) {
      console.error('价格试算失败', err);
      // 后端失败时保持本地计算结果
      Toast({
        context: this,
        selector: '#t-toast',
        message: '价格试算失败，已使用本地价格',
        theme: 'warning',
      });
    } finally {
      this.setData({ priceLoading: false });
    }
  },

  async onSubmitOrder() {
    if (this.data.submitting) return;
    
    if (!this.data.agreementChecked) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先阅读并同意服务协议',
        theme: 'warning',
      });
      return;
    }

    if (!this.data.items || this.data.items.length === 0) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '购物车为空',
        theme: 'warning',
      });
      return;
    }

    if (this.data.deliveryType === 'delivery' && !this.data.address) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择收货地址',
        theme: 'warning',
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      await this.ensureGuestSession();

      const payload = this.buildOrderPayload();
      console.log('创建订单 payload:', payload);
      const res = await this.submitOrderWithRetry(payload);
      console.log('提交订单成功:', res);

      Toast({
        context: this,
        selector: '#t-toast',
        message: '下单成功',
        theme: 'success',
      });

      this.clearCart();

      setTimeout(() => {
        wx.switchTab({ url: '/pages/order-list/index' });
      }, 1200);

    } catch (err) {
      console.error(err);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '下单失败，请重试',
        theme: 'error',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async submitOrderWithRetry(payload: OrderRequestPayload) {
    try {
      return await createOrder(payload);
    } catch (err: any) {
      console.error('创建订单失败:', err);
      const detail = err?.data?.detail || err?.data?.error?.detail || err?.message;
      const detailText = typeof detail === 'string' ? detail : JSON.stringify(detail || '');
      // 处理 guest session 失效，刷新后重试一次
      if (detailText.toLowerCase().includes('guest session')) {
        try {
          const res = await createGuestSession();
          const gid = (res as any)?.data?.guest_session_id || (res as any)?.guest_session_id;
          if (gid) {
            wx.setStorageSync('guest_session_id', gid);
          }
          const retryPayload = this.buildOrderPayload();
          return await createOrder(retryPayload);
        } catch (retryErr) {
          throw retryErr;
        }
      }
      throw err;
    }
  },

  async ensureGuestSession() {
    const token = getStorage<string>('access_token') || getStorage<string>('token');
    let guestSession = getStorage<string>('guest_session_id');
    if (token || guestSession) return;
    try {
      const res = await createGuestSession();
      const gid = (res as any)?.data?.guest_session_id || (res as any)?.guest_session_id;
      if (gid) {
        guestSession = gid;
        wx.setStorageSync('guest_session_id', gid);
        console.log('已创建 guest_session_id:', gid);
      }
    } catch (err) {
      console.error('创建游客会话失败', err);
    }
  },

  // ===== 布局高度计算 =====
  calculateLayoutHeights() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      const windowWidth = systemInfo.windowWidth || 375;
      this.rpxRatio = 750 / windowWidth;

      const statusBarHeightPx = systemInfo.statusBarHeight || 0;
      const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      let navContentPx = 44; // 默认导航内容高度 px
      if (menuButton && statusBarHeightPx) {
        navContentPx = menuButton.height + (menuButton.top - statusBarHeightPx) * 2;
      }
      const navBarHeightPx = statusBarHeightPx + navContentPx;
      const safeAreaBottomPx = systemInfo.safeArea ? (systemInfo.screenHeight - systemInfo.safeArea.bottom) : 0;
      const navbarHeight = Math.round(this.toRpx(navBarHeightPx));
      const safeAreaBottom = Math.max(0, Math.round(this.toRpx(safeAreaBottomPx)));

      this.setData({
        navbarHeight,
        safeAreaBottom,
      }, () => {
        this.measureLayout();
      });
    } catch (err) {
      console.warn('获取系统信息失败，使用默认导航高度', err);
      this.setData({
        navbarHeight: 176, // 88rpx 约等于 44px
      });
    }
  },

  toRpx(px: number) {
    return px * (this.rpxRatio || 2);
  },

  measureLayout() {
    wx.nextTick(() => {
      const query = wx.createSelectorQuery().in(this);
      query.select('.bottom-bar').boundingClientRect();
      query.select('.bottom-agreement').boundingClientRect();
      query.exec((res: any) => {
        if (!res) return;
        const bottomBarPx = res[0]?.height || 0;
        const agreementPx = res[1]?.height || 0;
        const bottomBarHeight = Math.round(this.toRpx(bottomBarPx));
        const agreementHeight = Math.round(this.toRpx(agreementPx));
        const pagePaddingBottom = bottomBarHeight + agreementHeight;
        const agreementPaddingBottom = bottomBarHeight;

        this.setData({
          bottomBarHeight,
          agreementHeight,
          pagePaddingBottom,
          agreementPaddingBottom,
        });
      });
    });
  },

  buildOrderPayload(itemsParam?: any[]): OrderRequestPayload {
    const {
      deliveryType,
      diningType,
      timePickerValue,
      userPhone,
      notes,
      address,
      shopId,
    } = this.data as any;
    const items = itemsParam || this.data.items || [];

    const scheduledAt = Array.isArray(timePickerValue) && timePickerValue.length
      ? timePickerValue.join(' ')
      : undefined;
    const guestSession = getStorage<string>('guest_session_id');

    const payload: OrderRequestPayload = {
      shop_id: shopId || 1,
      delivery_type: deliveryType,
      dining_type: deliveryType === 'pickup' ? diningType : undefined,
      scheduled_at: scheduledAt,
      user_phone: userPhone || undefined,
      notes: notes || undefined,
      use_points: false,
      items: (items || []).map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity || 1,
        selected_specs: (item.selected_specs || []).map((spec: any) => ({
          spec_id: spec.group_id,
          option_id: spec.option_id,
          option_name: spec.option_name,
          price_modifier: spec.price_modifier,
        })),
      })),
      guest_session_id: guestSession || undefined,
    };

    if (deliveryType === 'delivery' && address) {
      payload.address = {
        address: address.address,
        detail: address.detail,
        name: address.name,
        phone: address.phone,
        lat: address.lat,
        lng: address.lng,
      };
    }

    // 移除显式的 null/undefined，避免后端校验失败
    Object.keys(payload).forEach((key) => {
      const k = key as keyof OrderRequestPayload;
      if (payload[k] === null || payload[k] === undefined) {
        // @ts-ignore
        delete payload[k];
      }
    });

    return payload;
  },

  calculateLocalTotals(items: any[], deliveryType: 'pickup' | 'delivery') {
    const subtotal = items.reduce((sum, item: any) => {
      const basePrice = item.base_price || 0;
      const specsPrice = (item.selected_specs || []).reduce((s: number, spec: any) => s + (spec.price_modifier || 0), 0);
      const itemPrice = basePrice + specsPrice;
      return sum + itemPrice * (item.quantity || 0);
    }, 0);
    const deliveryFee = deliveryType === 'delivery' ? 0 : 0;
    const finalPrice = subtotal + deliveryFee;
    return {
      totalPrice: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
    };
  },

  // ===== 交互补充 =====
  onPhoneInput(e: any) {
    this.setData({ userPhone: e.detail.value });
  },

  async onGetPhoneNumber(e: any) {
    const code = e?.detail?.code;
    if (!code) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '未获取到授权码',
        theme: 'warning',
      });
      return;
    }

    if (this.data.phoneBinding) return;
    this.setData({ phoneBinding: true });

    try {
      const res = await bindPhoneNumber({ code });
      const phone = (res as any)?.data?.phone_number || (res as any)?.phone_number;
      if (phone) {
        this.setData({ userPhone: phone });
      }
    } catch (err) {
      console.error('绑定手机号失败', err);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '获取手机号失败，请稍后重试',
        theme: 'error',
      });
    } finally {
      this.setData({ phoneBinding: false });
    }
  },

  onDiningTypeChange(e: any) {
    const type = e?.currentTarget?.dataset?.type;
    if (type) {
      this.setData({ diningType: type });
    }
  },

  onShowPickupTime() {
    this.setData({ timePickerVisible: true });
  },

  onConfirmPickupTime(e: any) {
    const value = e?.detail?.value || [];
    const timeText = Array.isArray(value) ? value.join(' ') : '';
    this.setData({
      timePickerValue: value,
      estimatedPickupTime: timeText || this.data.estimatedPickupTime,
      timePickerVisible: false,
    });
    // 更新时间后重新试算价格
    this.calculatePrice();
  },

  onCancelPickupTime() {
    this.setData({ timePickerVisible: false });
  },
});
