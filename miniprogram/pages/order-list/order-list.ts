import { getOrderList, cancelOrder, OrderListItem } from '../../api/order';
import Dialog from 'tdesign-miniprogram/dialog/index';
import Toast from 'tdesign-miniprogram/toast/index';

Component({
  data: {
    // Tab 配置
    tabs: [
      { label: '全部', value: 'all' },
      { label: '待支付', value: 'pending_payment' },
      { label: '制作中', value: 'in_production' },
      { label: '已完成', value: 'completed' },
    ],
    currentTab: 'all',

    // 订单列表
    orders: [] as OrderListItem[],
    loading: false,
    refreshing: false,
    loadingMore: false,

    // 分页（使用 limit/offset）
    limit: 20,
    offset: 0,
    hasMore: true,

    // 空态
    isEmpty: false,
    isGuest: false, // 是否游客状态
  },

  pageLifetimes: {
    show() {
      // 更新 TabBar active 状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().updateActive('order-list');
      }
      
      this.loadOrders(true);
    },
  },

  methods: {
    /**
     * Tab 切换
     */
    onTabChange(e: WechatMiniprogram.CustomEvent) {
      const { value } = e.detail;
      this.setData({
        currentTab: value,
        offset: 0,
        orders: [],
        hasMore: true,
      });
      this.loadOrders(true);
    },

    /**
     * 加载订单列表
     */
    async loadOrders(reset: boolean = false) {
      if (this.data.loading || this.data.loadingMore) return;

      const isFirstPage = reset || this.data.offset === 0;

      this.setData({
        loading: isFirstPage,
        loadingMore: !isFirstPage,
      });

      try {
        const { currentTab, limit, offset } = this.data;
        console.log('[订单列表] 加载订单:', { currentTab, limit, offset });
        
        const orders = await getOrderList(
          currentTab === 'all' ? undefined : currentTab,
          limit,
          offset
        );

        console.log('[订单列表] 订单数据返回:', orders?.length || 0, '条');
        if (orders && orders.length > 0) {
          console.log('[订单列表] 订单详情:', orders.map(o => ({
            order_id: o.order_id,
            order_number: o.order_number,
            status: o.status,
          })));
        }

        const newOrders = reset ? orders : [...this.data.orders, ...orders];

        this.setData({
          orders: newOrders,
          hasMore: orders.length >= limit, // 如果返回数量等于 limit，说明可能还有更多
          isEmpty: newOrders.length === 0,
          loading: false,
          loadingMore: false,
          refreshing: false,
        });
      } catch (error: any) {
        console.error('[订单列表] 加载失败:', error);
        
        // 处理 401 未授权错误（未登录或游客模式）
        if (error.statusCode === 401) {
          this.setData({
            isEmpty: true,
            orders: [],
            isGuest: true, // 标记为游客状态
            loading: false,
            loadingMore: false,
            refreshing: false,
          });
          
          // 仅在第一次加载时显示提示
          if (isFirstPage) {
            Toast({
              context: this,
              selector: '#t-toast',
              message: '登录后可查看订单记录',
              theme: 'warning',
              duration: 2000,
            });
          }
        } else {
          this.setData({
            loading: false,
            loadingMore: false,
            refreshing: false,
          });
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: error.message || '加载失败',
            theme: 'error',
          });
        }
      }
    },

    /**
     * 下拉刷新
     */
    onRefresh() {
      this.setData({
        refreshing: true,
        offset: 0,
        orders: [],
        hasMore: true,
      });
      this.loadOrders(true);
    },

    /**
     * 上拉加载更多
     */
    onLoadMore() {
      if (!this.data.hasMore || this.data.loadingMore) return;

      this.setData({
        offset: this.data.offset + this.data.limit,
      });
      this.loadOrders(false);
    },

    /**
     * 点击订单卡片
     */
    onOrderTap(e: WechatMiniprogram.CustomEvent) {
      const { order } = e.detail;
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${order.order_id}`,
      });
    },

    /**
     * 订单操作
     */
    async onOrderAction(e: WechatMiniprogram.CustomEvent) {
      const { action, order } = e.detail;

      switch (action) {
        case 'pay':
          this.handlePay(order);
          break;
        case 'cancel':
          this.handleCancel(order);
          break;
        case 'contact':
          this.handleContact();
          break;
        case 'reorder':
          this.handleReorder(order);
          break;
      }
    },

    /**
     * 去支付
     */
    handlePay(order: OrderListItem) {
      wx.navigateTo({
        url: `/pages/payment/payment?id=${order.order_id}`,
      });
    },

    /**
     * 取消订单（仅待支付状态）
     */
    handleCancel(order: OrderListItem) {
      Dialog.confirm({
        title: '取消订单',
        content: '确认取消该订单吗？',
        confirmBtn: '确认取消',
        cancelBtn: '再想想',
        context: this,
      }).then(async () => {
        try {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '取消中...',
            theme: 'loading',
            duration: 0,
          });

          const result = await cancelOrder(order.order_id);
          console.log('[订单列表] 取消订单结果:', result);

          Toast({
            context: this,
            selector: '#t-toast',
            message: '订单已取消',
            theme: 'success',
          });

          // 延迟一下再刷新，确保后端状态已更新
          setTimeout(() => {
            this.onRefresh();
          }, 500);
        } catch (error: any) {
          console.error('取消订单失败:', error);
          Toast({
            context: this,
            selector: '#t-toast',
            message: error.message || '取消失败',
            theme: 'error',
          });
        }
      }).catch(() => {
        // 用户取消了对话框
      });
    },

    /**
     * 联系商家
     */
    handleContact() {
      wx.makePhoneCall({
        phoneNumber: '400-123-4567', // TODO: 从配置接口获取
      });
    },

    /**
     * 再来一单
     */
    handleReorder(order: OrderListItem) {
      // TODO: 将订单商品加入购物车
      Toast({
        context: this,
        selector: '#t-toast',
        message: '已加入购物车',
        theme: 'success',
      });
      wx.switchTab({
        url: '/pages/menu/menu',
      });
    },

    /**
     * 去下单或登录
     */
    goToMenu() {
      // 如果是游客状态，跳转到个人中心登录
      if (this.data.isGuest) {
        wx.switchTab({
          url: '/pages/profile/profile',
        });
      } else {
        // 否则跳转到菜单页点单
        wx.switchTab({
          url: '/pages/menu/menu',
        });
      }
    },
  },
})
